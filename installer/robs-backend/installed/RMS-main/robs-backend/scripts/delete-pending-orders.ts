import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Connecting to database...');
    try {
        const pendingOrders = await prisma.order.findMany({
            where: { status: 'pending' }
        });

        console.log(`Found ${pendingOrders.length} pending orders.`);

        if (pendingOrders.length > 0) {
            const deleteResult = await prisma.order.deleteMany({
                where: { status: 'pending' }
            });
            console.log(`Successfully deleted ${deleteResult.count} pending orders.`);
        } else {
            console.log('No pending orders found to delete.');
        }

    } catch (error) {
        console.error('Error deleting pending orders:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
