const bcrypt = require('bcryptjs');
const db = require('./config/database');

const seedUsers = async () => {
    const users = [
        {
            name: 'Admin User',
            email: 'admin@example.com',
            password: await bcrypt.hash('123456', 10),
            role: 'Admin',
            subscribed: true
        },
        {
            name: 'Developer User',
            email: 'dev@example.com',
            password: await bcrypt.hash('123456', 10),
            role: 'Developer',
            subscribed: false
        }
    ];

    db.serialize(() => {
        // Clear existing data
        db.run('DELETE FROM users');
        db.run('DELETE FROM transactions');
        
        // Insert seed users
        const stmt = db.prepare('INSERT INTO users (name, email, password, role, subscribed) VALUES (?, ?, ?, ?, ?)');
        users.forEach(user => {
            stmt.run(user.name, user.email, user.password, user.role, user.subscribed);
        });
        stmt.finalize();

        console.log('Database seeded successfully!');
        console.log('Test users created:');
        console.log('1. Admin User (admin@example.com / 123456)');
        console.log('2. Developer User (dev@example.com / 123456)');
    });
};

seedUsers().catch(console.error); 