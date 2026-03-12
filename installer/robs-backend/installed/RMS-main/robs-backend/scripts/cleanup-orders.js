const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function cleanup() {
    console.log('Connecting to database...');
    console.log('Database URL:', process.env.DATABASE_URL); // Debugging

    try {
        const { count } = await prisma.order.deleteMany({
            where: {
                status: 'pending'
            }
        });
        console.log(`Successfully deleted ${count} pending orders.`);
    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
