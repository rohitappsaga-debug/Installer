const { execSync } = require('child_process');
const env = {
    ...process.env,
    DATABASE_URL: 'postgresql://restaurant_user:rohit5237@localhost:5432/restaurant_db?schema=public'
};
try {
    console.log('Running prisma generate...');
    execSync('npx prisma generate', { env, encoding: 'utf8', stdio: 'inherit' });
    console.log('Running prisma migrate deploy...');
    execSync('npx prisma migrate deploy', { env, encoding: 'utf8', stdio: 'inherit' });
    console.log('SUCCESS');
} catch (err) {
    console.log('FAILED');
    process.exit(1);
}
