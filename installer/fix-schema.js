const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'installed/RMS/robs-backend/prisma/schema.prisma');

// Read as buffer to handle BOM manually
const buf = fs.readFileSync(schemaPath);

// Remove UTF-8 BOM: EF BB BF
let content = buf.toString('utf8');
if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
    content = buf.slice(3).toString('utf8');
    console.log('Removed UTF-8 BOM (EF BB BF).');
} else if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
    console.log('Removed BOM (FEFF).');
} else {
    console.log('No BOM found.');
}

// Print first 200 chars to verify
console.log('First 200 chars:', JSON.stringify(content.substring(0, 200)));

// Replace the datasource block to have only provider (url is set via prisma.config.ts)
const cleanDatasource = 'datasource db {\n  provider = "postgresql"\n}';
let fixed = content;

// Try various patterns
if (/datasource db \{[\s\S]*?\}/.test(content)) {
    fixed = content.replace(/datasource db \{[\s\S]*?\}/s, cleanDatasource);
    console.log('Replaced datasource block.');
} else {
    console.log('WARNING: datasource db block not found with standard regex. Searching manually...');
    const startIdx = content.indexOf('datasource db {');
    if (startIdx === -1) {
        console.log('ERROR: datasource db block NOT FOUND in file at all!');
        process.exit(1);
    }
    const endIdx = content.indexOf('}', startIdx);
    const beforeDs = content.substring(0, startIdx);
    const afterDs = content.substring(endIdx + 1);
    fixed = beforeDs + cleanDatasource + afterDs;
    console.log('Replaced datasource block using manual find.');
}

// Write back without BOM
fs.writeFileSync(schemaPath, fixed, { encoding: 'utf8', flag: 'w' });
console.log('\nSUCCESS: File saved without BOM.');

// Verify
const verify = fs.readFileSync(schemaPath);
if (verify[0] === 0xEF && verify[1] === 0xBB && verify[2] === 0xBF) {
    console.log('ERROR: BOM was added again?!');
} else {
    console.log('Verification: No BOM present in saved file. ✓');
}
const verifyContent = verify.toString('utf8');
const m = /datasource db \{[\s\S]*?\}/.exec(verifyContent);
console.log('Datasource block:', m ? m[0] : 'NOT FOUND');
