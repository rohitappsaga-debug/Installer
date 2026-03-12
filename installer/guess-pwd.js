const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// We'll read the dictionary directly from the source file to be sure
const dictFile = 'c:/Users/Rohit S/RMS-Installer/installer/robs-backend/src/installer/services/passwordDictionary.ts';
let passwords = [];

try {
    const content = fs.readFileSync(dictFile, 'utf8');
    // The file has a dynamic generation logic, but we can just parse the COMMON_PASSWORDS array if it was static
    // Or we can just re-implement the generation logic here to be safe.

    // For now, let's just use some very common ones first, and then try to load the full list
    const baseWords = ['root', 'postgres', 'admin', 'password', '123456', 'qwerty', '12345', 'postgresql'];
    const years = ['2023', '2024', '2025', '2022'];
    const symbols = ['', '!', '@', '#'];

    passwords.push(''); // No password
    for (const word of baseWords) {
        passwords.push(word);
        passwords.push(word.charAt(0).toUpperCase() + word.slice(1));
        for (const year of years) {
            passwords.push(word + year);
            passwords.push(word + '@' + year);
        }
    }
} catch (e) {
    console.log('Error reading dictionary:', e.message);
}

// Ensure unique
passwords = Array.from(new Set(passwords));

async function guess() {
    console.log(`Starting guess for 'postgres' user among ${passwords.length} core variations...`);

    for (const pwd of passwords) {
        const client = new Client({
            host: 'localhost',
            port: 5432,
            user: 'postgres',
            password: pwd,
            database: 'postgres',
            connectionTimeoutMillis: 500
        });

        try {
            await client.connect();
            console.log(`\n✅ MATCH FOUND: Password is '${pwd}'`);
            await client.end();
            return pwd;
        } catch (err) {
            await client.end().catch(() => { });
        }
    }
    console.log('\n❌ No match found in core list.');
    return null;
}

guess();
