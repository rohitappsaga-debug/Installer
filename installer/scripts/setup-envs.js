const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const projects = [
    { name: 'Root', path: rootDir },
    { name: 'Backend', path: path.join(rootDir, 'robs-backend') },
    { name: 'Frontend', path: path.join(rootDir, 'robs-frontend') }
];

console.log('🔍 Checking environment configurations...');

projects.forEach(project => {
    const envPath = path.join(project.path, '.env');
    const examplePath = path.join(project.path, '.env.example');
    const isProduction = process.env.NODE_ENV === 'production';

    if (fs.existsSync(envPath)) {
        console.log(`✅ ${project.name}: .env exists`);
    } else if (isProduction) {
        console.error(`❌ ${project.name}: .env is MISSING in production!`);
        console.error(`   You must create it manually. NEVER auto-copy .env.example in production.`);
        process.exit(1);
    } else if (fs.existsSync(examplePath)) {
        console.log(`⚠️ ${project.name}: .env missing. Copying from .env.example (Dev/Test only)...`);
        fs.copyFileSync(examplePath, envPath);
        console.log(`✨ ${project.name}: .env created`);
    } else {
        // Optional: Warn if neither exists, but don't fail scripts in dev
        // console.log(`ℹ️ ${project.name}: No .env.example found to copy.`);
    }
});

console.log('✅ Environment setup check complete.');
