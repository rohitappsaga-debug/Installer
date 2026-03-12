import prisma from './src/utils/database';

async function check() {
    try {
        const notifications = await prisma.notification.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        console.log('Recent Notifications:', JSON.stringify(notifications, null, 2));

        // Also check total count
        const count = await prisma.notification.count();
        console.log('Total Notifications:', count);
    } catch (error) {
        console.error('Error checking notifications:', error);
    } finally {
        await prisma.$disconnect();
    }
}

check();
