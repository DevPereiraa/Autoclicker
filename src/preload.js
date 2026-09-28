const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('window-toggle-pin'),

  // Clicker actions
  startClicker: (config) => ipcRenderer.send('clicker-start', config),
  stopClicker: () => ipcRenderer.send('clicker-stop'),
  getCursorPosition: () => ipcRenderer.invoke('get-cursor-position'),

  // Hotkey
  updateHotkey: (hotkey) => ipcRenderer.invoke('update-hotkey', hotkey),

  // Events from main
  onStatusChange: (callback) => ipcRenderer.on('clicker-status', (_event, data) => callback(data)),
  onClickEvent: (callback) => ipcRenderer.on('clicker-click', (_event, data) => callback(data)),
  onFailSafe: (callback) => ipcRenderer.on('clicker-failsafe', (_event, data) => callback(data)),
  onFinished: (callback) => ipcRenderer.on('clicker-finished', (_event, data) => callback(data)),
  onHotkeyTriggered: (callback) => ipcRenderer.on('hotkey-toggle', () => callback())
});
