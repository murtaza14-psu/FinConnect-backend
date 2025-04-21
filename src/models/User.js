const bcrypt = require('bcryptjs');
const db = require('../config/database');

class User {
    static async create({ name, email, password, role = 'developer' }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO users (name, email, password, role, subscription_status) VALUES (?, ?, ?, ?, ?)',
                [name, email, hashedPassword, role, 'inactive'],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    static async findByEmail(email) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    static async findById(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    static async updateSubscriptionStatus(userId, status) {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE users SET subscription_status = ? WHERE id = ?',
                [status, userId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    static async getAllUsers() {
        return new Promise((resolve, reject) => {
            db.all('SELECT id, name, email, role, subscription_status FROM users', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = User; 