const { app, BrowserWindow, session, Menu, globalShortcut, dialog } = require('electron');
const path = require('path');

let win;

// ─── Single instance lock ──────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) { win.show(); win.focus(); }
  });
}

// ─── Strip Origin header so CORS never blocks renderer → backend calls ─────────
// Electron file:// pages send Origin: null which some backends reject.
// Removing it makes the request look like a server-side call (always allowed).
app.whenReady().then(() => {
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    delete details.requestHeaders['Origin'];
    callback({ requestHeaders: details.requestHeaders });
  });

  createWindow();

  // Auto-start on Windows boot when packaged
  if (app.isPackaged) {
    app.setLoginItemSettings({ openAtLogin: true, path: process.execPath });
  }
});

function createWindow() {
  win = new BrowserWindow({
    fullscreen: true,         // fills the TV screen
    frame: false,             // no title bar / chrome
    backgroundColor: '#f1f5f9',
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  });

  // Remove menu bar entirely
  Menu.setApplicationMenu(null);

  // Load the UI
  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    win.loadURL('http://localhost:5174');
    // Uncomment to open devtools in dev:
    // win.webContents.openDevTools();
  }

  // ── Disable F5 / Ctrl+R accidental reload + F12 devtools in production ──────
  win.webContents.on('before-input-event', (event, input) => {
    if (!app.isPackaged) return; // allow everything in dev
    const blocked = (
      (input.key === 'F5') ||
      (input.key === 'r' && input.control) ||
      (input.key === 'F12') ||
      (input.key === 'Escape') ||          // prevent hiding fullscreen accidentally
      (input.key === 'w' && input.control) // prevent Ctrl+W close
    );
    if (blocked) event.preventDefault();
  });

  // ── Auto-reload if the page crashes or becomes unresponsive ─────────────────
  win.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer crashed:', details.reason);
    setTimeout(() => win?.reload(), 3000);
  });

  win.on('unresponsive', () => {
    console.warn('Window unresponsive — reloading in 5s');
    setTimeout(() => win?.reload(), 5000);
  });

  // Keep fullscreen if the user somehow exits (e.g. system key combo)
  win.on('leave-full-screen', () => {
    if (app.isPackaged) win.setFullScreen(true);
  });
}

// ─── Dev only: Alt+F4 / Cmd+Q always works so you can quit ────────────────────
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  app.quit();
});
