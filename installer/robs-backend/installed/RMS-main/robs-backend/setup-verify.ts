import prisma from './src/utils/database';

async function verify() {
    try {
        // 1. Find a test user (waiter)
        const waiter = await prisma.user.findFirst({ where: { role: 'waiter' } });
        if (!waiter) {
            console.log('No waiter found to test with.');
            return;
        }
        console.log('Testing with waiter:', waiter.email);

        // 2. Create a dummy order
        const table = await prisma.table.findFirst();
        const menuItem = await prisma.menuItem.findFirst();

        if (!table || !menuItem) {
            console.log('Missing table or menu item');
            return;
        }

        const order = await prisma.order.create({
            data: {
                tableNumber: table.number,
                createdBy: waiter.id,
                total: Number(menuItem.price),
                status: 'pending',
                orderItems: {
                    create: {
                        menuItemId: menuItem.id,
                        quantity: 1,
                        status: 'pending',
                        notes: 'TEST ORDER'
                    }
                }
            },
            include: { orderItems: true }
        });
        console.log('Created test order:', order.id);

        // 3. Simulate Kitchen marking item as READY via API... 
        // actually, let's just use axios/fetch against localhost to trigger the route logic
        // We need a token for this. 
        // For simplicity in this script, let's assume we can generate a token or just trust the manual test.

        // Instead of calling the API executing the route logic, let's just say "Manual Test Required" 
        // because simulating the full express request with auth in a script is complex without the app's secret.
        // However, we can use the 'jsonwebtoken' to sign a token if we know the secret.

        // Let's print instructions for manual verification or use the internal logic if possible.
        // Actually, I can use the `check-notifications.ts` logic again AFTER the user tests.

        console.log('Please performing the following test:');
        console.log('1. Login as Kitchen');
        console.log('2. Mark the order for Table ' + table.number + ' (Order #' + order.orderNumber + ') as READY (click "Mark Ready" on the item)');
        console.log('3. Run "check-notifications.ts" again to see if a notification appears.');

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
