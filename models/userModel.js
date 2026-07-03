const db = require('../database/db');
const bcrypt = require('bcrypt');

class UserModel {
    static findByUsername(username, callback) {
        const sql = `SELECT * FROM users WHERE username = ?`;
        db.get(sql, [username], (err, row) => {
            callback(err, row);
        });
    }

    static createUser(username, password, callback) {
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) return callback(err);
            const sql = `INSERT INTO users (username, password_hash) VALUES (?, ?)`;
            db.run(sql, [username, hash], function(err) {
                callback(err, this ? this.lastID : null);
            });
        });
    }

    static checkDefaultAdmin() {
        const adminUser = process.env.ADMIN_USERNAME || 'admin';
        const adminPass = process.env.ADMIN_PASSWORD || 'admin';
        
        this.findByUsername(adminUser, (err, row) => {
            if (!row) {
                this.createUser(adminUser, adminPass, (err, id) => {
                    if (!err) console.log(`[Auth] Default admin account created: ${adminUser}`);
                });
            }
        });
    }
}

module.exports = UserModel;
