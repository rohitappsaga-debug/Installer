import 'dotenv/config';
import { Pool } from 'pg';

console.log('Testing DB connection...');
const envUrl = process.env.DATABASE_URL;
console.log('DATABASE_URL from env:', envUrl ? 'DEFINED' : 'UNDEFINED');

if (envUrl) {
    const cleanUrl = envUrl.replace(/^"|"$/g, '').trim();
    console.log('Cleaned URL (masked):', cleanUrl.replace(/:[^:@]*@/, ':****@'));

    try {
        const url = new URL(cleanUrl);
        console.log('Parsed User:', url.username);
        console.log('Parsed Password Type:', typeof url.password);
        console.log('Parsed Password Length:', url.password.length);
        console.log('Parsed Password (first 2 chars):', url.password.substring(0, 2));

        const pool = new Pool({ connectionString: cleanUrl });
        pool.query('SELECT 1')
            .then(() => {
                console.log('✅ Connection SUCCESS');
                pool.end();
                process.exit(0);
            })
            .catch((err) => {
                console.error('❌ Connection FAILED:', err);
                pool.end();
                process.exit(1);
            });
    } catch (e) {
        console.error('URL parsing error:', e);
    }
} else {
    console.error('DATABASE_URL is missing!');
}
