// KidTube MongoDB initialization script
// Runs on first MongoDB start via docker-entrypoint-initdb.d

// Create database and collections
db = db.getSiblingDB('kidtube');

db.createCollection('channels');
db.createCollection('episodes');
db.createCollection('categories');
db.createCollection('age_groups');
db.createCollection('users');
db.createCollection('jobs');

// Create indexes
db.episodes.createIndex({ channel_id: 1 });
db.episodes.createIndex({ status: 1 });
db.users.createIndex({ email: 1 }, { unique: true });
db.jobs.createIndex({ episode_id: 1 });
db.jobs.createIndex({ status: 1 });
db.channels.createIndex({ category_ids: 1 });
db.channels.createIndex({ age_group_ids: 1 });

// Seed initial age groups (admin-defined per CONTEXT.md — admins can add more)
db.age_groups.insertMany([
    { name: '2-5', min_age: 2, max_age: 5, created_at: new Date(), updated_at: new Date() },
    { name: '6-10', min_age: 6, max_age: 10, created_at: new Date(), updated_at: new Date() }
]);

// Seed initial categories (Persian educational content categories)
db.categories.insertMany([
    { name: '\u0622\u0645\u0648\u0632\u0634\u06cc', created_at: new Date(), updated_at: new Date() },
    { name: '\u0633\u0631\u06af\u0631\u0645\u06cc', created_at: new Date(), updated_at: new Date() },
    { name: '\u0639\u0644\u0645\u06cc', created_at: new Date(), updated_at: new Date() }
]);

print('KidTube database initialized successfully');
