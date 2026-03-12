const { Client } = require('pg');

const connectionString = 'postgresql://restaurant_user:rohit5237@localhost:5432/restaurant_db?schema=public';

async function check() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected.');

        const user = await client.query('SELECT current_user, current_database()');
        console.log('User/DB:', user.rows[0]);

        const schemas = await client.query('SELECT schema_name FROM information_schema.schemata');
        console.log('Available Schemas:', schemas.rows.map(r => r.schema_name));

        const checkPublic = await client.query("SELECT has_schema_privilege(current_user, 'public', 'CREATE')");
        console.log('Can create in public:', checkPublic.rows[0].has_schema_privilege);

        await client.end();
    } catch (err) {
        console.error('CHECK FAILED:', err.message);
        process.exit(1);
    }
}

check();
