// DOM Elements
const btnPin = document.getElementById('btn-pin');
const btnMinimize = document.getElementById('btn-minimize');
const btnClose = document.getElementById('btn-close');

const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const timerDisplay = document.getElementById('timer-display');
const statClicks = document.getElementById('stat-clicks');
const statCps = document.getElementById('stat-cps');
const statHotkey = document.getElementById('stat-hotkey');

const presetPills = document.querySelectorAll('.pill');
const intervalInput = document.getElementById('interval-input');
const unitSelect = document.getElementById('unit-select');

const mouseButton = document.getElementById('mouse-button');
const clickType = document.getElementById('click-type');

const repeatRadios = document.querySelectorAll('input[name="repeat-mode"]');
const repeatCountInput = document.getElementById('repeat-count-input');

const moveSwitch = document.getElementById('move-switch');
const moveDetails = document.getElementById('move-details');
const moveSlider = document.getElementById('move-slider');
const moveVal = document.getElementById('move-val');

const posRadios = document.querySelectorAll('input[name="pos-mode"]');
const coordsRow = document.getElementById('coords-row');
const coordX = document.getElementById('coord-x');
const coordY = document.getElementById('coord-y');
const btnPickPos = document.getElementById('btn-pick-pos');

const hotkeySelect = document.getElementById('hotkey-select');
const soundSwitch = document.getElementById('sound-switch');

const failsafeBanner = document.getElementById('failsafe-banner');
const btnToggle = document.getElementById('btn-toggle');
const btnToggleText = document.getElementById('btn-toggle-text');
const iconStart = document.querySelector('.icon-start');
const iconStop = document.querySelector('.icon-stop');

// State
let isRunning = false;
let currentHotkey = 'F8';
let clickCount = 0;
let sessionStartTime = null;
let timerInterval = null;
let cpsTracker = [];
let audioCtx = null;

// Audio Feedback (Synthesizer via Web Audio API)
function playSound(type) {
  if (!soundSwitch.checked) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    if (type === 'start') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'stop') {
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'click') {
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      osc.start(now);
      osc.stop(now + 0.02);
    } else if (type === 'failsafe') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(400, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {
    // Audio context not allowed or unsupported
  }
}

// Window Controls
btnPin.addEventListener('click', async () => {
  if (window.electronAPI) {
    const pinned = await window.electronAPI.toggleAlwaysOnTop();
    btnPin.classList.toggle('active', pinned);
    btnPin.title = pinned ? "Fixado no topo (Ativo)" : "Fixar sempre no topo";
  }
});

btnMinimize.addEventListener('click', () => {
  if (window.electronAPI) window.electronAPI.minimizeWindow();
});

btnClose.addEventListener('click', () => {
  if (window.electronAPI) window.electronAPI.closeWindow();
});

// Presets Handling
presetPills.forEach(pill => {
  pill.addEventListener('click', () => {
    presetPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');

    const interval = pill.getAttribute('data-interval');
    const unit = pill.getAttribute('data-unit');

    unitSelect.value = unit;
    intervalInput.value = interval;
  });
});

intervalInput.addEventListener('input', () => {
  // Clear active pill if custom value doesn't match
  presetPills.forEach(p => p.classList.remove('active'));
});

// Repeat Mode Handling
repeatRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    const isCount = (radio.value === 'count' && radio.checked);
    repeatCountInput.disabled = !isCount;
  });
});

// Movement Switch
moveSwitch.addEventListener('change', () => {
  if (moveSwitch.checked) {
    moveDetails.classList.remove('disabled');
  } else {
    moveDetails.classList.add('disabled');
  }
});

moveSlider.addEventListener('input', () => {
  moveVal.textContent = `${moveSlider.value} px`;
});

// Position Mode
posRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    const isFixed = (radio.value === 'fixed' && radio.checked);
    if (isFixed) {
      coordsRow.classList.remove('disabled');
      coordX.disabled = false;
      coordY.disabled = false;
      btnPickPos.disabled = false;
    } else {
      coordsRow.classList.add('disabled');
      coordX.disabled = true;
      coordY.disabled = true;
      btnPickPos.disabled = true;
    }
  });
});

btnPickPos.addEventListener('click', async () => {
  if (window.electronAPI) {
    btnPickPos.textContent = "Obtendo...";
    const pos = await window.electronAPI.getCursorPosition();
    coordX.value = pos.x;
    coordY.value = pos.y;
    btnPickPos.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Capturado (${pos.x}, ${pos.y})`;
    setTimeout(() => {
      btnPickPos.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Capturar Posição`;
    }, 1800);
  }
});

// Hotkey Change
hotkeySelect.addEventListener('change', async () => {
  const newKey = hotkeySelect.value;
  if (window.electronAPI) {
    const success = await window.electronAPI.updateHotkey(newKey);
    if (success) {
      currentHotkey = newKey;
      statHotkey.textContent = newKey;
      btnToggleText.textContent = isRunning ? `Parar (${newKey})` : `Iniciar (${newKey})`;
    } else {
      alert(`Não foi possível registrar o atalho ${newKey}. Ele pode estar em uso por outro aplicativo.`);
      hotkeySelect.value = currentHotkey;
    }
  }
});

// Calculate Interval in Milliseconds
function getCalculatedIntervalMs() {
  let val = parseFloat(intervalInput.value);
  if (isNaN(val) || val <= 0) val = 500;

  if (unitSelect.value === 's') {
    return Math.max(1, Math.round(val * 1000));
  }
  return Math.max(1, Math.round(val));
}

// Start / Stop Toggle
btnToggle.addEventListener('click', () => {
  toggleClicker();
});

function toggleClicker() {
  if (isRunning) {
    stopClicker();
  } else {
    startClicker();
  }
}

function startClicker() {
  failsafeBanner.classList.add('hidden');

  const config = {
    interval: getCalculatedIntervalMs(),
    button: mouseButton.value,
    type: clickType.value,
    move: moveSwitch.checked,
    distance: parseInt(moveSlider.value, 10) || 5,
    repeat: 0,
    targetX: -1,
    targetY: -1
  };

  const selectedRepeat = document.querySelector('input[name="repeat-mode"]:checked').value;
  if (selectedRepeat === 'count') {
    config.repeat = Math.max(1, parseInt(repeatCountInput.value, 10) || 100);
  }

  const selectedPos = document.querySelector('input[name="pos-mode"]:checked').value;
  if (selectedPos === 'fixed') {
    config.targetX = parseInt(coordX.value, 10) || 0;
    config.targetY = parseInt(coordY.value, 10) || 0;
  }

  if (window.electronAPI) {
    window.electronAPI.startClicker(config);
  }
}

function stopClicker() {
  if (window.electronAPI) {
    window.electronAPI.stopClicker();
  }
}

function updateUiState(running, failsafe = false) {
  isRunning = running;

  if (running) {
    playSound('start');
    clickCount = 0;
    statClicks.textContent = "0";
    statCps.textContent = "0.0";
    cpsTracker = [];
    sessionStartTime = Date.now();

    // Start timer interval
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimerDisplay, 200);

    // Update status badge
    statusDot.className = 'status-dot running';
    statusText.className = 'status-text running';
    statusText.textContent = 'EM EXECUÇÃO...';

    // Update main button
    btnToggle.className = 'btn-main stop';
    btnToggleText.textContent = `Parar (${currentHotkey})`;
    iconStart.classList.add('hidden');
    iconStop.classList.remove('hidden');

    // Disable inputs
    disableInputs(true);
  } else {
    if (failsafe) {
      playSound('failsafe');
      failsafeBanner.classList.remove('hidden');
      statusDot.className = 'status-dot failsafe';
      statusText.className = 'status-text failsafe';
      statusText.textContent = 'FAIL-SAFE ATIVADO!';
    } else {
      playSound('stop');
      statusDot.className = 'status-dot stopped';
      statusText.className = 'status-text stopped';
      statusText.textContent = 'PARADO';
    }

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    btnToggle.className = 'btn-main start';
    btnToggleText.textContent = `Iniciar (${currentHotkey})`;
    iconStart.classList.remove('hidden');
    iconStop.classList.add('hidden');

    disableInputs(false);
  }
}

function disableInputs(disabled) {
  intervalInput.disabled = disabled;
  unitSelect.disabled = disabled;
  mouseButton.disabled = disabled;
  clickType.disabled = disabled;
  repeatRadios.forEach(r => r.disabled = disabled);
  if (!disabled) {
    const isCount = document.querySelector('input[name="repeat-mode"]:checked').value === 'count';
    repeatCountInput.disabled = !isCount;
  } else {
    repeatCountInput.disabled = true;
  }
  moveSwitch.disabled = disabled;
  moveSlider.disabled = disabled;
  posRadios.forEach(r => r.disabled = disabled);
  presetPills.forEach(p => p.disabled = disabled);
}

function updateTimerDisplay() {
  if (!sessionStartTime) return;
  const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
  const hrs = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  const mins = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');
  timerDisplay.textContent = `${hrs}:${mins}:${secs}`;
}

// IPC Listeners
if (window.electronAPI) {
  window.electronAPI.onStatusChange((data) => {
    updateUiState(data.running, data.failsafe);
  });

  window.electronAPI.onClickEvent((data) => {
    clickCount = data.count;
    statClicks.textContent = clickCount.toLocaleString();

    // Sound tick
    if (clickCount % 10 === 0 || clickCount <= 10) {
      playSound('click');
    }

    // CPS Calculation (sliding window of last 1 second)
    const now = Date.now();
    cpsTracker.push(now);
    cpsTracker = cpsTracker.filter(t => now - t <= 1000);
    statCps.textContent = cpsTracker.length.toFixed(1);
  });

  window.electronAPI.onFailSafe(() => {
    updateUiState(false, true);
  });

  window.electronAPI.onFinished(() => {
    updateUiState(false);
  });

  window.electronAPI.onHotkeyTriggered(() => {
    toggleClicker();
  });
}
