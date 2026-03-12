const fs = require('fs');
const { exec } = require('child_process');

console.log('Running Prisma generate via child_process...');
exec('node ..\\node_modules\\prisma\\build\\index.js generate', (error, stdout, stderr) => {
    let output = `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
    if (error) {
        output += `\nERROR:\n${error.message}\n${error.stack}`;
    }
    fs.writeFileSync('prisma-debug-error.txt', output, 'utf8');
    console.log('Finished. Check prisma-debug-error.txt');
});
