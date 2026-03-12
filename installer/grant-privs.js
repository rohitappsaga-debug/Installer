const { Client } = require('pg');

const rootPasswords = ['', 'postgres', 'root', 'admin', 'password', 'rohit5237'];
const dbName = 'restaurant_db';
const dbUser = 'restaurant_user';

async function grantPrivileges() {
    for (const password of rootPasswords) {
        const client = new Client({
            host: 'localhost',
            port: 5432,
            user: 'postgres',
            password: password,
            database: 'postgres',
            connectionTimeoutMillis: 2000,
        });

        try {
            console.log(`Trying root password: "${password}"...`);
            await client.connect();
            console.log('CONNECTED as postgres!');

            console.log(`Switching to database ${dbName}...`);
            await client.query(`GRANT ALL ON SCHEMA public TO "${dbUser}"`);
            // Also need to do it IN the target database
            await client.end();

            const targetClient = new Client({
                host: 'localhost',
                port: 5432,
                user: 'postgres',
                password: password,
                database: dbName,
            });
            await targetClient.connect();
            console.log(`Connected to ${dbName} as root.`);
            await targetClient.query(`GRANT ALL ON SCHEMA public TO "${dbUser}"`);
            await targetClient.query(`ALTER SCHEMA public OWNER TO "${dbUser}"`); // Even better
            console.log('PRIVILEGES GRANTED SUCCESSFULLY');
            await targetClient.end();
            return;
        } catch (err) {
            console.error('Failed with this password:', err.message);
            await client.end().catch(() => { });
        }
    }
    console.error('COULD NOT CONNECT AS ROOT. All common passwords failed.');
    process.exit(1);
}

grantPrivileges();
