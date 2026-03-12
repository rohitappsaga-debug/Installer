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

describe('Order Lifecycle Granular', () => {
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

    it('1. should create an order and occupy table', async () => {
        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${waiterToken}`)
            .send({
                tableNumber: 1,
                items: [{ menuItemId: menuItem.id, quantity: 2 }]
            });

        expect(res.status).toBe(201);
        const tableStatus = await prisma.table.findUnique({ where: { number: 1 } });
        expect(tableStatus?.status).toBe('occupied');
    });

    it('2. should free table on payment', async () => {
        const order = await prisma.order.create({
            data: {
                tableNumber: 1,
                createdBy: waiterUser.id,
                total: 100,
                status: 'pending'
            }
        });

        await prisma.table.update({
            where: { number: 1 },
            data: { status: 'occupied', currentOrderId: order.id }
        });

        const res = await request(app)
            .post(`/api/payments/${order.id}/pay`)
            .set('Authorization', `Bearer ${waiterToken}`)
            .send({
                amount: 100,
                method: 'cash'
            });

        expect(res.status).toBe(200);
        const tableStatus = await prisma.table.findUnique({ where: { number: 1 } });
        expect(tableStatus?.status).toBe('free');
    });

    it('3. should create new order when adding items to paid order', async () => {
        const order = await prisma.order.create({
            data: {
                tableNumber: 1,
                createdBy: waiterUser.id,
                total: 100,
                status: 'pending',
                isPaid: true
            }
        });

        const res = await request(app)
            .post(`/api/orders/${order.id}/items`)
            .set('Authorization', `Bearer ${waiterToken}`)
            .send({
                items: [{ menuItemId: menuItem.id, quantity: 1 }]
            });

        expect(res.status).toBe(200);
        expect(res.body.data.id).not.toBe(order.id);
        const tableStatus = await prisma.table.findUnique({ where: { number: 1 } });
        expect(tableStatus?.status).toBe('occupied');
        expect(tableStatus?.currentOrderId).toBe(res.body.data.id);
    });
});
