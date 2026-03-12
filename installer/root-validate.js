const { execSync } = require('child_process');
const path = require('path');
const rootDir = __dirname;
const rootPrisma = path.join(rootDir, 'node_modules', 'prisma', 'build', 'index.js');
const schemaPath = path.join(rootDir, 'robs-backend', 'prisma', 'schema.prisma');

console.log('Root Dir:', rootDir);
console.log('Using Prisma at:', rootPrisma);
console.log('Validating schema at:', schemaPath);

try {
    const output = execSync(`node "${rootPrisma}" validate --schema="${schemaPath}"`, {
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
