const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Testing Prisma Client connectivity with full error capture...');
    try {
        const userCount = await prisma.user.count();
        console.log(`Success! Connected to database. User count: ${userCount}`);
    } catch (error) {
        console.log('--- ERROR START ---');
        console.log(JSON.stringify({
            message: error.message,
            stack: error.stack,
            code: error.code,
            clientVersion: error.clientVersion
        }, null, 2));
        console.log('--- ERROR END ---');
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
