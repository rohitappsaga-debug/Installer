const fs = require('fs');
const { Client } = require('pg');

// Read and parse .env
const envContent = fs.readFileSync('installed/RMS/robs-backend/.env', 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        let val = trimmed.substring(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        envVars[key] = val;
    }
}

const dbUrl = envVars['DATABASE_URL'];
console.log('DATABASE_URL:', dbUrl);

// Test the connection
const client = new Client({ connectionString: dbUrl });

async function test() {
    try {
        await client.connect();
        const res = await client.query('SELECT current_user, current_database()');
        console.log('\n✅ Connection successful!');
        console.log('Connected as:', res.rows[0].current_user);
        console.log('Database:', res.rows[0].current_database);
        await client.end();
    } catch (err) {
        console.log('\n❌ Connection FAILED:', err.message);
        await client.end().catch(() => { });
    }
}

test();
