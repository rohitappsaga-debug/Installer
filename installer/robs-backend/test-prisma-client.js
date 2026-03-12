const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Testing Prisma Client connectivity...');
    try {
        const userCount = await prisma.user.count();
        console.log(`Success! Connected to database. User count: ${userCount}`);

        const tables = await prisma.table.findMany({ take: 5 });
        console.log('Sample tables:', tables.map(t => t.number));
    } catch (error) {
        console.error('Failed to connect to database via Prisma client:');
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
