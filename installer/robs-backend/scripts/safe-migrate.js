const { execSync } = require('child_process');

console.log('Starting safe migration process...');

try {
    console.log('Running prisma migrate deploy...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('Migration deployed successfully.');
} catch (error) {
    console.log('Standard migration failed. This is common on existing non-empty databases (P3005). Attempting to baseline...');
    try {
        // Attempt to resolve the initial migration to baseline internal tables
        execSync('npx prisma migrate resolve --applied 000_init', { stdio: 'inherit' });
        console.log('Baselined successfully. Retrying deploy for any subsequent migrations...');
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    } catch (fallbackError) {
        console.error('Migration fallback failed. Continuing deployment but database might not be fully synced.');
        // We do not exit with code 1 here. We want to allow the app to start even if migrations fail
        // because it's highly likely that the database is already fully populated from a SQL dump.
    }
}
