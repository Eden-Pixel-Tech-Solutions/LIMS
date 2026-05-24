const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const os = require("os");
const { SerialPort } = require('serialport');
const axios = require('axios');
const db = require("../db/sqlite");
const serialManager = require("./serialManager");
const tcpManager = require("./tcpManager");

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

async function syncMachines() {
  const API_BASE = 'http://localhost:7005';
  try {
    const labId = await db.getSetting('labId');
    if (!labId) {
      console.log("No labId found in settings. Skipping machine sync.");
      return;
    }

    console.log(`🔄 Syncing machines from backend for Lab ID: ${labId}...`);
    const response = await axios.get(`${API_BASE}/api/lab/machines/${labId}`);

    if (response.data.success && response.data.machines) {
      const machines = response.data.machines;
      console.log(`✅ Found ${machines.length} machines on backend.`);

      for (const m of machines) {
        // Map backend machine to local analyzer_config format
        const config = {
          uniqueId: m.machine_id,
          name: m.name,
          model: m.model,
          port: m.port_ip || 'COM1',
          baud: m.baud_rate || 9600,
          labId: m.lab_id,
          labName: m.lab_name || 'Lab',
          manufacturer: m.manufacturer
        };

        // Get existing local config to preserve the COM port if it was set manually
        const existing = await db.getConfig();
        const localMatch = existing.find(lc => lc.unique_id === config.uniqueId);
        if (localMatch) {
          config.port = localMatch.port;
          config.baud = localMatch.baud;
        }

        await db.saveConfig(config);
      }
      console.log("🚀 Local machine database synchronized.");
    }
  } catch (err) {
    console.error("❌ Machine sync failed:", err.message);
  }
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

  ipcMain.handle('delete-config', async (event, id) => {
    try {
      return await db.deleteConfig(id);
    } catch (e) {
      console.error("IPC delete-config error:", e);
      return false;
    }
  });

  ipcMain.handle('save-setting', async (event, key, value) => {
    try {
      return await db.saveSetting(key, value);
    } catch (e) {
      console.error("IPC save-setting error:", e);
      return false;
    }
  });

  ipcMain.handle('get-setting', async (event, key) => {
    try {
      return await db.getSetting(key);
    } catch (e) {
      console.error("IPC get-setting error:", e);
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
    // If the user clicked "Run Test" from the Lab Worklist UI, 
    // it sends testInfo which we use to lock the machine to that sample ID.
    if (testInfo && testInfo.machineId) {
      serialManager.setManualContext(testInfo);
      if (tcpManager.setManualContext) tcpManager.setManualContext(testInfo);
    }
    await tcpManager.initializeAllServers(win);
    return await serialManager.initializeAllPorts(win);
  });

  ipcMain.handle('stop-listening', async () => {
    await tcpManager.stopListening();
    return await serialManager.stopListening();
  });

  ipcMain.handle('get-active-ports', async () => {
    const serialPorts = Array.from(serialManager.activePorts.keys());
    const tcpPorts = Array.from(tcpManager.activeClients.keys());
    return [...serialPorts, ...tcpPorts];
  });

  ipcMain.handle('get-local-ip', async () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        // Skip over internal (i.e. 127.0.0.1) and non-IPv4 addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return '127.0.0.1';
  });

  // Sync machines on boot and start background listeners
  syncMachines().then(() => {
    serialManager.initializeAllPorts(win);
    tcpManager.initializeAllServers(win);
  });

  createWindow();
});

app.on("window-all-closed", () => {
  console.log("All windows closed");
});