const db = require('../database/db');

class SensorModel {
    static insert(data, callback) {
        const sql = `INSERT INTO sensor_data (temperature, humidity, pressure, rain, rain_mm, light, wind_kmh) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        db.run(sql, [data.temperature, data.humidity, data.pressure, data.rain, data.rain_mm || 0, data.light, data.wind_kmh || 0], function(err) {
            callback(err, this ? this.lastID : null);
        });
    }

    static getLatest(callback) {
        const sql = `SELECT * FROM sensor_data ORDER BY created_at DESC LIMIT 1`;
        db.get(sql, [], (err, row) => {
            callback(err, row);
        });
    }

    static getHistory(limit, callback) {
        const sql = `SELECT * FROM sensor_data ORDER BY created_at DESC LIMIT ?`;
        db.all(sql, [limit], (err, rows) => {
            callback(err, rows);
        });
    }
}

module.exports = SensorModel;
