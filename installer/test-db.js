const { Client } = require('pg');
const client = new Client({
    connectionString: 'postgresql://restaurant_user:rohit5237@localhost:5432/restaurant_db?schema=public'
});

async function test() {
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('CONNECTED successfully');
        const res = await client.query('SELECT NOW()');
        console.log('Query Result:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('CONNECTION FAILED:', err.message);
        process.exit(1);
    }
}

test();
