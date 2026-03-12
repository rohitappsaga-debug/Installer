const fs = require('fs');

function log(msg) {
    console.log(msg);
    fs.appendFileSync('minimal_log.txt', msg + '\n');
}

try {
    log('Attempting to require @prisma/client...');
    const { PrismaClient } = require('@prisma/client');
    log('Successfully required @prisma/client.');

    try {
        log('Attempting to instantiate PrismaClient with explicit URL...');
        const prisma = new PrismaClient({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL
                }
            }
        });
        log('Successfully instantiated PrismaClient.');

        try {
            log('Attempting to connect to database...');
            prisma.$connect().then(() => {
                log('Successfully connected to database.');
                return prisma.user.count();
            }).then((count) => {
                log('User count: ' + count);
                process.exit(0);
            }).catch(err => {
                log('FAILED to connect/query: ' + err.message);
                log(err.stack);
                process.exit(1);
            });
        } catch (err) {
            log('CRASH during connect: ' + err.message);
            log(err.stack);
            process.exit(1);
        }
    } catch (err) {
        log('CRASH during instantiation: ' + err.message);
        log(err.stack);
        process.exit(1);
    }
} catch (err) {
    log('CRASH during require: ' + err.message);
    log(err.stack);
    process.exit(1);
}
