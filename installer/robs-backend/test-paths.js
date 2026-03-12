const fs = require('fs');
const path = require('path');

console.log('Current CWD:', process.cwd());
console.log('Dirname:', __dirname);

const testPath = 'Z:\\installer\\node_modules\\prisma\\build\\index.js';
console.log('Testing access to:', testPath);
try {
    if (fs.existsSync(testPath)) {
        console.log('SUCCESS: File exists.');
        const stats = fs.statSync(testPath);
        console.log('File size:', stats.size);
    } else {
        console.log('FAILED: File does NOT exist.');
    }
} catch (err) {
    console.error('ERROR during access check:', err.message);
}

const nodeModules = 'Z:\\installer\\node_modules';
try {
    if (fs.existsSync(nodeModules)) {
        console.log('SUCCESS: node_modules exists.');
        const files = fs.readdirSync(nodeModules).slice(0, 10);
        console.log('Sample node_modules:', files);
    } else {
        console.log('FAILED: node_modules does NOT exist.');
    }
} catch (err) {
    console.error('ERROR during node_modules check:', err.message);
}
