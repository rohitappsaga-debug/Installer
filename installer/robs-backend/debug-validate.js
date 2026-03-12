const { execSync } = require('child_process');
const path = require('path');
const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

console.log('Validating schema at:', schemaPath);

try {
    const output = execSync(`npx prisma validate --schema="${schemaPath}"`, {
        encoding: 'utf8',
        env: {
            ...process.env,
            DATABASE_URL: 'postgresql://restaurant_user:rohit5237@localhost:5432/restaurant_db?schema=public'
        }
    });
    console.log('SUCCESS:', output);
} catch (e) {
    console.log('FAILED');
    console.log('STDOUT:', e.stdout);
    console.log('STDERR:', e.stderr);
}
