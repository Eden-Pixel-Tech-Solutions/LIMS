const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const { app } = require("electron");

const dbPath = path.join(app.getPath("userData"), "lis_agent.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS analyzer_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      analyzer_name TEXT,
      model TEXT,
      port TEXT,
      baud INTEGER
    )
  `);
});

function saveConfig(config) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO analyzer_config (analyzer_name, model, port, baud)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(
      config.name,
      config.model,
      config.port,
      config.baud,
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
    db.get(`SELECT * FROM analyzer_config ORDER BY id DESC LIMIT 1`, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

module.exports = { saveConfig, getConfig };
