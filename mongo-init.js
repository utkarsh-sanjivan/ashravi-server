// MongoDB initialization script
db = db.getSiblingDB('nodejs-server-layered');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });
db.users.createIndex({ createdAt: -1 });
db.users.createIndex({ name: "text", email: "text" });

print('Database initialized with indexes');
