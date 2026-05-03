const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { SerialPort } = require('serialport');
const db = require("../db/sqlite");
const serialManager = require("./serialManager");

let win;

function createWindow() {
  console.log("Creating window...");

  win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  console.log("Loading React app...");

  win.loadURL("http://localhost:5173");

  win.webContents.openDevTools(); // 🔥 important for debugging
}

app.whenReady().then(() => {
  console.log("Electron ready");

  // IPC Handlers for SQLite (Analyzer Config)
  ipcMain.handle('get-config', async () => {
    try {
      return await db.getConfig();
    } catch (e) {
      console.error("IPC get-config error:", e);
      return null;
    }
  });

  ipcMain.handle('save-config', async (event, config) => {
    try {
      return await db.saveConfig(config);
    } catch (e) {
      console.error("IPC save-config error:", e);
      return null;
    }
  });

  ipcMain.handle('list-ports', async () => {
    try {
      console.log("Listing serial ports...");
      const ports = await SerialPort.list();
      return ports;
    } catch (err) {
      console.error('Error listing ports:', err);
      return [];
    }
  });

  ipcMain.handle('start-listening', async (event, testInfo) => {
    return await serialManager.startListening(testInfo, win);
  });

  ipcMain.handle('stop-listening', async () => {
    return await serialManager.stopListening();
  });

  createWindow();
});

app.on("window-all-closed", () => {
  console.log("All windows closed");
});