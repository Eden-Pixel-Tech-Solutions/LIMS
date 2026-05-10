const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const { app } = require("electron");

const dbPath = path.join(app.getPath("userData"), "lis_agent.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS analyzer_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unique_id TEXT UNIQUE,
      analyzer_name TEXT,
      model TEXT,
      port TEXT,
      baud INTEGER,
      lab_id INTEGER,
      lab_name TEXT,
      manufacturer TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);
});

function saveSetting(key, value) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [key, value], (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
}

function getSetting(key) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT value FROM settings WHERE key = ?`, [key], (err, row) => {
      if (err) reject(err);
      else resolve(row ? row.value : null);
    });
  });
}

function saveConfig(config) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO analyzer_config (unique_id, analyzer_name, model, port, baud, lab_id, lab_name, manufacturer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      config.uniqueId,
      config.name,
      config.model,
      config.port,
      config.baud,
      config.labId,
      config.labName,
      config.manufacturer,
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );

    stmt.finalize();
  });
}

function getConfig() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM analyzer_config ORDER BY id DESC`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows); // Return all rows
    });
  });
}

function deleteConfig(id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM analyzer_config WHERE id = ?`, [id], (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
}

module.exports = { saveConfig, getConfig, deleteConfig, saveSetting, getSetting };
