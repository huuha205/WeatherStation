const db = require('../database/db');

class AiReportModel {
    static insert(data, callback) {
        const sql = `INSERT INTO ai_reports (sensor_id, status, summary, risk, trend, forecast, recommendations, alert, confidence) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const recsStr = Array.isArray(data.recommendations) ? JSON.stringify(data.recommendations) : data.recommendations;
        
        db.run(sql, [
            data.sensor_id, 
            data.status, 
            data.summary, 
            data.risk, 
            data.trend, 
            data.forecast, 
            recsStr, 
            data.alert, 
            data.confidence
        ], function(err) {
            callback(err, this.lastID);
        });
    }

    static getLatest(callback) {
        const sql = `SELECT * FROM ai_reports ORDER BY created_at DESC LIMIT 1`;
        db.get(sql, [], (err, row) => {
            if (row && row.recommendations) {
                try { row.recommendations = JSON.parse(row.recommendations); } catch(e){}
            }
            callback(err, row);
        });
    }

    static getAll(callback) {
        const sql = `SELECT * FROM ai_reports ORDER BY created_at DESC`;
        db.all(sql, [], (err, rows) => {
            if (rows) {
                rows.forEach(row => {
                    if (row.recommendations) {
                        try { row.recommendations = JSON.parse(row.recommendations); } catch(e){}
                    }
                });
            }
            callback(err, rows);
        });
    }
}

module.exports = AiReportModel;
