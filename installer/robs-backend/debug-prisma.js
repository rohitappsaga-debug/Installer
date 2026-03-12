const { execSync } = require('child_process');
try {
    const out = execSync('npx prisma validate --schema=prisma/schema.prisma', { encoding: 'utf8', stdio: 'pipe' });
    console.log('SUCCESS:', out);
} catch (err) {
    console.log('ERROR:', err.stdout || '', err.stderr || '');
}
