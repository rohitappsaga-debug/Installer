const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://restaurant_user:rohit5237@localhost:5432/restaurant_db?schema=public'
});

async function main() {
    console.log('Testing direct PG connection...');
    try {
        await client.connect();
        console.log('Success! Connected to database via PG.');
        const res = await client.query('SELECT COUNT(*) FROM users');
        console.log('User count:', res.rows[0].count);
        await client.end();
    } catch (error) {
        console.error('Failed to connect to database via PG:');
        console.error(error);
        process.exit(1);
    }
}

main();
