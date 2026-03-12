import request from 'supertest';
import express, { Express } from 'express';
import { TestUtils } from './utils';
import { prisma } from './setup';

let app: Express;

beforeAll(async () => {
    app = express();
    app.use(express.json());

    const authRoutes = await import('../src/routes/auth');
    const orderRoutes = await import('../src/routes/orders');
    const paymentRoutes = await import('../src/routes/payments');
    const tableRoutes = await import('../src/routes/tables');

    app.use('/api/auth', authRoutes.default);
    app.use('/api/orders', orderRoutes.default);
    app.use('/api/payments', paymentRoutes.default);
    app.use('/api/tables', tableRoutes.default);

    const { errorHandler } = await import('../src/middleware/errorHandler');
    app.use(errorHandler);
});

describe('Order Lifecycle Integration', () => {
    let waiterToken: string;
    let waiterUser: any;
    let table: any;
    let menuItem: any;

    beforeEach(async () => {
        waiterUser = await TestUtils.createTestUser('waiter');
        waiterToken = TestUtils.generateJWT(waiterUser);
        table = await TestUtils.createTestTable(1);
        menuItem = await TestUtils.createTestMenuItem();
    });

    it('should free table on payment and create new order for subsequent items', async () => {
        // 1. Create an order
        const createOrderResponse = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${waiterToken}`)
            .send({
                tableNumber: 1,
                items: [{ menuItemId: menuItem.id, quantity: 2 }]
            });

        expect(createOrderResponse.status).toBe(201);
        const orderId = createOrderResponse.body.data.id;
        const total = createOrderResponse.body.data.total;

        // Verify table is occupied
        let tableStatus = await prisma.table.findUnique({ where: { number: 1 } });
        expect(tableStatus?.status).toBe('occupied');
        expect(tableStatus?.currentOrderId).toBe(orderId);

        // 2. Pay for the order
        const payResponse = await request(app)
            .post(`/api/payments/${orderId}/pay`)
            .set('Authorization', `Bearer ${waiterToken}`)
            .send({
                amount: total,
                method: 'cash'
            });

        expect(payResponse.status).toBe(200);
        expect(payResponse.body.data.order.isPaid).toBe(true);

        // Verify table is freed
        tableStatus = await prisma.table.findUnique({ where: { number: 1 } });
        expect(tableStatus?.status).toBe('free');
        expect(tableStatus?.currentOrderId).toBeNull();

        // 3. Add items to the paid order
        const addItemsResponse = await request(app)
            .post(`/api/orders/${orderId}/items`)
            .set('Authorization', `Bearer ${waiterToken}`)
            .send({
                items: [{ menuItemId: menuItem.id, quantity: 1 }]
            });

        expect(addItemsResponse.status).toBe(200);
        const newOrderId = addItemsResponse.body.data.id;
        expect(newOrderId).not.toBe(orderId);
        expect(addItemsResponse.body.data.isPaid).toBe(false);

        // Verify table is re-occupied with NEW order
        tableStatus = await prisma.table.findUnique({ where: { number: 1 } });
        expect(tableStatus?.status).toBe('occupied');
        expect(tableStatus?.currentOrderId).toBe(newOrderId);
    });
});
