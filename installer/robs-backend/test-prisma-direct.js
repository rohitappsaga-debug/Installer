const fs = require('fs');
const path = require('path');

function log(msg) {
    console.log(msg);
    fs.appendFileSync('direct_log.txt', msg + '\n');
}

try {
    log('Attempting to require ./.prisma/client directly...');
    // We are in robs-backend, so it's in node_modules/.prisma/client
    const clientPath = path.resolve(process.cwd(), 'node_modules', '.prisma', 'client');
    log('Client path: ' + clientPath);

    // Check if index.js exists there
    if (fs.existsSync(path.join(clientPath, 'index.js'))) {
        log('index.js exists at client path.');
    } else {
        log('index.js DOES NOT exist at client path.');
    }

    const { PrismaClient } = require(clientPath);
    log('Successfully required PrismaClient directly.');

    const prisma = new PrismaClient();
    log('Successfully instantiated PrismaClient.');

    prisma.$connect().then(() => {
        log('Successfully connected to database.');
        process.exit(0);
    }).catch(err => {
        log('FAILED to connect: ' + err.message);
        process.exit(1);
    });

} catch (err) {
    log('CRASH: ' + err.message);
    log(err.stack);
    process.exit(1);
}
