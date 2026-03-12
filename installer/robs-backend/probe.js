
const fs = require('fs');
const path = require('path');

const target = 'C:\\Users\\Rohit S\\RMS-Installer\\installer\\robs-backend\\src\\installer\\public\\index.html';

console.log('--- PROBE START ---');
console.log('Target:', target);

if (fs.existsSync(target)) {
    console.log('SUCCESS: existsSync found the file.');
    try {
        const stats = fs.statSync(target);
        console.log('Stats:', stats.size, 'bytes');
        const content = fs.readFileSync(target, 'utf8');
        console.log('Read test:', content.substring(0, 50));
    } catch (e) {
        console.log('ERROR during access:', e.message);
    }
} else {
    console.log('FAILURE: existsSync did NOT find the file.');

    // Check parts of the path
    let current = 'C:\\';
    const parts = target.split('\\').slice(1);
    for (const part of parts) {
        current = path.join(current, part);
        if (fs.existsSync(current)) {
            console.log('OK:', current);
        } else {
            console.log('FAIL:', current);
            // List children of parent
            const parent = path.dirname(current);
            if (fs.existsSync(parent)) {
                console.log('Listing children of:', parent);
                try {
                    console.log(fs.readdirSync(parent));
                } catch (e) { console.log('Could not list:', e.message); }
            }
            break;
        }
    }
}
console.log('--- PROBE END ---');
