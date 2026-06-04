const {
  app, BrowserWindow, session, Menu,
  ipcMain, shell
} = require('electron');
const path = require('path');
const fs   = require('fs');
const https = require('https');

const API_BASE    = 'https://lims.poxiatechnologies.com';
const CONFIG_PATH = path.join(app.getPath('userData'), 'kiosk-config.json');

// ─── Config helpers ───────────────────────────────────────────────────────────
function readConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); }
  catch { return null; }
}
function writeConfig(data) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// ─── Single instance ──────────────────────────────────────────────────────────
if (!app.requestSingleInstanceLock()) { app.quit(); }

// ─── ESC × 5 tracking ────────────────────────────────────────────────────────
let escCount = 0;
let escReset = null;

// ─── Main ─────────────────────────────────────────────────────────────────────
let win;

app.whenReady().then(() => {
  // Strip Origin header → backend treats all renderer calls as server-side
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    delete details.requestHeaders['Origin'];
    callback({ requestHeaders: details.requestHeaders });
  });

  // Register IPC handlers before window is created
  registerIPC();
  createWindow();

  // Auto-start on Windows boot (packaged only)
  if (app.isPackaged) {
    app.setLoginItemSettings({ openAtLogin: true, path: process.execPath });
  }
});

function createWindow() {
  win = new BrowserWindow({
    fullscreen:      true,
    frame:           false,
    backgroundColor: '#f1f5f9',
    icon:            path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload:          path.join(__dirname, 'preload.js'),
    },
  });

  Menu.setApplicationMenu(null);

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    win.loadURL('http://localhost:5174');
    // win.webContents.openDevTools();
  }

  // ── After page loads: lock zoom + inject touch-action CSS ────────────────
  win.webContents.on('did-finish-load', () => {
    win.webContents.setZoomFactor(1);
    win.webContents.setVisualZoomLevelLimits(1, 1);

    // Disable pinch-zoom, multi-finger gestures, text selection, right-click highlight
    win.webContents.insertCSS(`
      * {
        touch-action: manipulation !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      input, textarea, [contenteditable] {
        touch-action: auto !important;
        user-select: text !important;
        -webkit-user-select: text !important;
      }
    `);

    // Block multi-touch (2+ finger) gestures at JS level in the renderer
    win.webContents.executeJavaScript(`
      document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) e.preventDefault();
      }, { passive: false });
      document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 1) e.preventDefault();
      }, { passive: false });
      document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
      document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
      document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });
    `);
  });

  // ── Block right-click context menu ───────────────────────────────────────
  win.webContents.on('context-menu', (e) => e.preventDefault());

  // ── Keyboard lockdown + ESC × 5 to quit ─────────────────────────────────
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;

    // ESC × 5: count presses within 4 s, quit on 5th
    if (input.key === 'Escape') {
      escCount++;
      clearTimeout(escReset);
      escReset = setTimeout(() => { escCount = 0; }, 4000);
      if (escCount >= 5) {
        app.isQuitting = true;
        app.quit();
        return;
      }
      // Don't block ESC so the count works; just don't let it do anything else
      if (app.isPackaged) event.preventDefault();
      return;
    }

    if (!app.isPackaged) return; // allow all keys in dev

    // Block in production: F5, Ctrl+R, F12, Ctrl+W, Ctrl+Shift+I, Alt+F4
    const blocked =
      input.key === 'F5' ||
      input.key === 'F12' ||
      (input.key === 'r'  && input.control) ||
      (input.key === 'w'  && input.control) ||
      (input.key === 'i'  && input.control && input.shift) ||
      (input.key === 'F4' && input.alt);

    if (blocked) event.preventDefault();
  });

  // ── Auto-reload on crash ─────────────────────────────────────────────────
  win.webContents.on('render-process-gone', (e, details) => {
    console.error('Renderer crashed:', details.reason);
    setTimeout(() => win?.reload(), 3000);
  });
  win.on('unresponsive', () => {
    setTimeout(() => win?.reload(), 5000);
  });

  // ── Keep fullscreen if user somehow exits it ─────────────────────────────
  win.on('leave-full-screen', () => {
    if (app.isPackaged) win.setFullScreen(true);
  });
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────
function registerIPC() {

  // Read saved lab config
  ipcMain.handle('get-config', () => readConfig());

  // Save selected lab and tell renderer to refresh
  ipcMain.handle('save-config', (e, config) => {
    writeConfig(config);
    return { success: true };
  });

  // Reset config (go back to setup screen)
  ipcMain.handle('reset-config', () => {
    try { fs.unlinkSync(CONFIG_PATH); } catch { /* already gone */ }
    win?.reload();
    return { success: true };
  });

  // Fetch labs from backend (main process → Node.js, no CORS)
  ipcMain.handle('fetch-labs', () => {
    return new Promise((resolve) => {
      const req = https.get(`${API_BASE}/api/lab/labs`, (res) => {
        let body = '';
        res.on('data', d => { body += d; });
        res.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch { resolve({ success: false, labs: [] }); }
        });
      });
      req.on('error', (e) => {
        console.error('fetch-labs error:', e.message);
        resolve({ success: false, labs: [] });
      });
      req.setTimeout(8000, () => { req.destroy(); resolve({ success: false, labs: [] }); });
    });
  });
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
app.on('second-instance', () => { if (win) { win.show(); win.focus(); } });
app.on('window-all-closed', () => app.quit());
