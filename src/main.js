const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow = null;
let backendProcess = null;
let currentHotkey = 'F8';
let isClicking = false;
let isPinned = false;
let posCallbackQueue = [];

function getBackendExecutablePath() {
  if (app.isPackaged) {
    const packagedPath = path.join(process.resourcesPath, 'bin', 'ClickerBackend.exe');
    if (fs.existsSync(packagedPath)) return packagedPath;
    return path.join(process.resourcesPath, 'ClickerBackend.exe');
  }
  return path.join(__dirname, '..', 'bin', 'ClickerBackend.exe');
}

function initBackendProcess() {
  const exePath = getBackendExecutablePath();
  console.log('[Main] Inicializando backend em:', exePath);

  if (!fs.existsSync(exePath)) {
    console.error('[Main Erro] ClickerBackend.exe não foi encontrado em:', exePath);
    return;
  }

  backendProcess = spawn(exePath, [], {
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  backendProcess.stdout.on('data', (chunk) => {
    const lines = chunk.toString().split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      console.log('[Backend stdout]', line);

      if (line === 'EVENT:READY') {
        console.log('[Backend] ClickerBackend pronto para uso.');
      } else if (line === 'EVENT:STARTED') {
        isClicking = true;
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('clicker-status', { running: true });
        }
      } else if (line.startsWith('EVENT:STOPPED')) {
        isClicking = false;
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('clicker-status', { running: false });
        }
      } else if (line === 'EVENT:FAILSAFE') {
        isClicking = false;
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('clicker-failsafe');
          mainWindow.webContents.send('clicker-status', { running: false, failsafe: true });
        }
      } else if (line.startsWith('EVENT:FINISHED')) {
        isClicking = false;
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('clicker-finished');
          mainWindow.webContents.send('clicker-status', { running: false });
        }
      } else if (line.startsWith('EVENT:CLICK')) {
        const match = line.match(/count=(\d+)/);
        const count = match ? parseInt(match[1], 10) : 0;
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('clicker-click', { count });
        }
      } else if (line.startsWith('EVENT:POS')) {
        const xMatch = line.match(/x=(-?\d+)/);
        const yMatch = line.match(/y=(-?\d+)/);
        const x = xMatch ? parseInt(xMatch[1], 10) : 0;
        const y = yMatch ? parseInt(yMatch[1], 10) : 0;
        const cb = posCallbackQueue.shift();
        if (cb) cb({ x, y });
      }
    }
  });

  backendProcess.stderr.on('data', (data) => {
    console.error('[Backend stderr]', data.toString());
  });

  backendProcess.on('close', (code) => {
    console.log('[Backend] Processo fechado com código:', code);
    backendProcess = null;
  });
}

function registerHotkey(hotkey) {
  try {
    globalShortcut.unregisterAll();
    const registered = globalShortcut.register(hotkey, () => {
      console.log(`[Main] Tecla de atalho ${hotkey} acionada.`);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('hotkey-toggle');
      }
    });

    if (registered) {
      currentHotkey = hotkey;
      console.log(`[Main] Tecla de atalho ${hotkey} registrada com sucesso.`);
      return true;
    } else {
      console.warn(`[Main] Falha ao registrar tecla de atalho ${hotkey}.`);
      return false;
    }
  } catch (err) {
    console.error('[Main] Erro ao registrar hotkey:', err);
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 740,
    minWidth: 440,
    minHeight: 680,
    resizable: false,
    frame: false,
    transparent: false,
    backgroundColor: '#090d16',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: false
    },
    icon: path.join(__dirname, '..', 'build', 'icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  initBackendProcess();
  createWindow();
  registerHotkey(currentHotkey);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (backendProcess) {
    try {
      backendProcess.stdin.write('EXIT\n');
      backendProcess.kill();
    } catch (e) {
      // Ignora erro ao fechar
    }
  }
});

// IPC Handlers
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-toggle-pin', () => {
  if (!mainWindow) return false;
  isPinned = !isPinned;
  mainWindow.setAlwaysOnTop(isPinned, 'screen-saver');
  return isPinned;
});

ipcMain.handle('update-hotkey', (_event, newHotkey) => {
  return registerHotkey(newHotkey);
});

ipcMain.handle('get-cursor-position', () => {
  return new Promise((resolve) => {
    // We can also use screen.getCursorScreenPoint() built directly into Electron!
    try {
      const pt = screen.getCursorScreenPoint();
      resolve({ x: pt.x, y: pt.y });
    } catch (e) {
      // Fallback to backend
      if (backendProcess && backendProcess.stdin) {
        posCallbackQueue.push(resolve);
        backendProcess.stdin.write('GET_POS\n');
      } else {
        resolve({ x: 0, y: 0 });
      }
    }
  });
});

ipcMain.on('clicker-start', (_event, config) => {
  if (!backendProcess || !backendProcess.stdin) {
    initBackendProcess();
  }

  const interval = config.interval || 500;
  const button = config.button || 'left';
  const type = config.type || 'single';
  const move = config.move ? 1 : 0;
  const distance = config.distance || 5;
  const repeat = config.repeat || 0;
  const x = config.targetX !== undefined ? config.targetX : -1;
  const y = config.targetY !== undefined ? config.targetY : -1;

  const cmd = `START interval=${interval} button=${button} type=${type} move=${move} distance=${distance} repeat=${repeat} x=${x} y=${y}\n`;
  console.log('[Main Enviando]', cmd.trim());
  backendProcess.stdin.write(cmd);
});

ipcMain.on('clicker-stop', () => {
  if (backendProcess && backendProcess.stdin) {
    backendProcess.stdin.write('STOP\n');
  }
});
