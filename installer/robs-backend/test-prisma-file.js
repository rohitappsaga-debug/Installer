const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
    console.log('Testing Prisma Client connectivity with full file capture...');
    try {
        const userCount = await prisma.user.count();
        console.log(`Success! Connected to database. User count: ${userCount}`);
    } catch (error) {
        console.log('--- ERROR OCCURRED ---');
        const errorData = {
            message: error.message,
            stack: error.stack,
            code: error.code,
            clientVersion: error.clientVersion,
            name: error.name
        };
        fs.writeFileSync('full_error_out.json', JSON.stringify(errorData, null, 2));
        console.log('Error details written to full_error_out.json');
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(err => {
    fs.writeFileSync('unhandled_error_out.json', JSON.stringify({
        message: err.message,
        stack: err.stack
    }, null, 2));
});
