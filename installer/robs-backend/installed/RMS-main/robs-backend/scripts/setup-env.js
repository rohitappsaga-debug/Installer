const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const examplePath = path.join(__dirname, '..', '.env.example');

// Check if we are in production
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
    // Production: Fail loudly if .env is missing
    if (!fs.existsSync(envPath)) {
        console.error('❌ FATAL: .env file is missing in production!');
        console.error('   Please ensure environment variables are set or the .env file is present.');
        process.exit(1);
    }
    console.log('✅ Production check passed: .env exists.');
} else {
    // Dev/Test: Copy .env.example if .env is missing
    if (!fs.existsSync(envPath)) {
        if (fs.existsSync(examplePath)) {
            fs.copyFileSync(examplePath, envPath);
            console.log('✅ Created .env from .env.example (Non-production)');
        } else {
            console.warn('⚠️ .env.example not found. Please create .env manually.');
        }
    } else {
        console.log('ℹ️ .env already exists. Skipping copy.');
    }
}
