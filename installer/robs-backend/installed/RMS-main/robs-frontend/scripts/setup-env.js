import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env');
const examplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath)) {
    if (fs.existsSync(examplePath)) {
        fs.copyFileSync(examplePath, envPath);
        console.log('✅ Created .env from .env.example');
    } else {
        console.warn('⚠️ .env.example not found. Please create .env manually.');
    }
} else {
    console.log('ℹ️ .env already exists. Skipping copy.');
}
