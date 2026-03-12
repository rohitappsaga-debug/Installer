import { provisionPostgres, checkPostgresInstalled, installPostgres } from './src/installer/services/postgres';

async function test() {
    console.log("Checking postgres installed...");
    const status = await checkPostgresInstalled();
    console.log(status);

    if (!status.installed) {
        console.log("Installing postgres...");
        const installResult = await installPostgres(msg => console.log("[INSTALL LOG]", msg));
        console.log(installResult);
    }

    console.log("Provisioning...");
    const result = await provisionPostgres({
        host: 'localhost',
        port: 5432,
        dbName: 'restaurant_db',
        dbUser: 'restaurant_user',
        onLog: msg => console.log("[PROVISION LOG]", msg)
    });
    console.log("Provision Result:", result);
}

test().catch(console.error);
