const bcrypt = require('bcryptjs');
const db = require('./config/database');

const seedUsers = async () => {
    const users = [
        {
            name: 'Admin User',
            email: 'admin@example.com',
            password: await bcrypt.hash('admin123', 10),
            role: 'admin',
            subscription_status: 'active'
        },
        {
            name: 'Developer User',
            email: 'dev@example.com',
            password: await bcrypt.hash('dev123', 10),
            role: 'developer',
            subscription_status: 'inactive'
        }
    ];

    db.serialize(() => {
        // Clear existing data
        db.run('DELETE FROM users');
        
        // Insert seed users
        const stmt = db.prepare('INSERT INTO users (name, email, password, role, subscription_status) VALUES (?, ?, ?, ?, ?)');
        users.forEach(user => {
            stmt.run(user.name, user.email, user.password, user.role, user.subscription_status);
        });
        stmt.finalize();

        console.log('Database seeded successfully!');
    });
};

seedUsers().catch(console.error); 