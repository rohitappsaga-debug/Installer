const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://restaurant_user:rohit5237@localhost:5432/restaurant_db?schema=public';
const sqlPath = path.join(__dirname, 'robs-backend', 'prisma', 'migrations', '000_init', 'migration.sql');

async function runMigration() {
    const client = new Client({ connectionString });
    try {
        console.log('Reading migration SQL...');
        let sql = fs.readFileSync(sqlPath, 'utf8');

        // Some SQL files contain CREATE SCHEMA IF NOT EXISTS "public" or similar 
        // which might fail on some providers.
        // We'll also ensure search_path is set.

        await client.connect();
        console.log('Connected.');

        console.log('Ensuring schema public exists and setting search path...');
        await client.query('CREATE SCHEMA IF NOT EXISTS public;');
        await client.query('SET search_path TO public;');

        console.log('Executing migration SQL...');
        // We'll run the SQL statement by statement if it's too large or complex
        // but first let's try to run it in a single transaction if possible.
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');

        console.log('SUCCESS');
        await client.end();
    } catch (err) {
        if (client) {
            try { await client.query('ROLLBACK'); } catch (e) { }
        }
        console.error('FAILED');
        fs.writeFileSync('error_details.json', JSON.stringify({
            message: err.message,
            detail: err.detail,
            hint: err.hint,
            code: err.code,
            position: err.position,
            query: err.query
        }, null, 2));
        process.exit(1);
    }
}

runMigration();
