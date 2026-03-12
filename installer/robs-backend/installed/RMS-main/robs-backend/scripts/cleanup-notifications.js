
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function cleanupNotifications() {
    try {
        await client.connect();
        console.log('Connected to database.');

        // Delete all system init notifications to start fresh
        // Try lowercase plural first which is common prisma default if not mapped
        const res = await client.query("DELETE FROM \"notifications\" WHERE message LIKE '%System initialized successfully%' OR message LIKE '%Welcome to the restaurant%'");
        console.log(`Deleted ${res.rowCount} automated notifications.`);

    } catch (err) {
        console.error('Error cleaning up notifications:', err);
    } finally {
        await client.end();
    }
}

cleanupNotifications();
