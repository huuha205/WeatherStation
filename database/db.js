const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'db.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Lỗi kết nối SQLite:', err.message);
    } else {
        console.log('Đã kết nối thành công tới SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Table: sensor_data
        db.run(`CREATE TABLE IF NOT EXISTS sensor_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            temperature REAL,
            humidity REAL,
            pressure REAL,
            rain INTEGER,
            rain_mm REAL,
            light REAL,
            wind_kmh REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Table: ai_reports
        db.run(`CREATE TABLE IF NOT EXISTS ai_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sensor_id INTEGER,
            status TEXT,
            summary TEXT,
            risk TEXT,
            trend TEXT,
            forecast TEXT,
            recommendations TEXT,
            alert TEXT,
            confidence INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sensor_id) REFERENCES sensor_data(id)
        )`);

        // Table: users
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password_hash TEXT
        )`);
    });
}

module.exports = db;
