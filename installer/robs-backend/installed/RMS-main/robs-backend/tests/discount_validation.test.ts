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

    app.use('/api/auth', authRoutes.default);
    app.use('/api/orders', orderRoutes.default);
    app.use('/api/payments', paymentRoutes.default);

    const { errorHandler } = await import('../src/middleware/errorHandler');
    app.use(errorHandler);
});

describe('Discount Validation API Tests', () => {
    let adminToken: string;
    let waiterToken: string;
    let adminUser: any;
    let waiterUser: any;
    let menuItem: any;

    beforeEach(async () => {
        adminUser = await TestUtils.createTestUser('admin');
        waiterUser = await TestUtils.createTestUser('waiter');
        adminToken = TestUtils.generateJWT(adminUser);
        waiterToken = TestUtils.generateJWT(waiterUser);
        await TestUtils.createTestTable(1);
        menuItem = await TestUtils.createTestMenuItem();
    });

    describe('POST /api/orders - Discount Validation', () => {
        it('should fail when discountValue is negative', async () => {
            const orderData = {
                tableNumber: 1,
                items: [{ menuItemId: menuItem.id, quantity: 1 }],
                discountType: 'amount',
                discountValue: -10,
            };

            const response = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${waiterToken}`)
                .send(orderData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('"discountValue" must be greater than or equal to 0');
        });

        it('should fail when percentage discountValue exceeds 100', async () => {
            const orderData = {
                tableNumber: 1,
                items: [{ menuItemId: menuItem.id, quantity: 1 }],
                discountType: 'percentage',
                discountValue: 101,
            };

            const response = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${waiterToken}`)
                .send(orderData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('"discountValue" must be less than or equal to 100');
        });

        it('should succeed with valid percentage discount (0-100)', async () => {
            const orderData = {
                tableNumber: 1,
                items: [{ menuItemId: menuItem.id, quantity: 1 }],
                discountType: 'percentage',
                discountValue: 50,
            };

            const response = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${waiterToken}`)
                .send(orderData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.discountValue).toBe(50);
        });

        it('should succeed with valid amount discount (positive)', async () => {
            const orderData = {
                tableNumber: 1,
                items: [{ menuItemId: menuItem.id, quantity: 1 }],
                discountType: 'amount',
                discountValue: 5,
            };

            const response = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${waiterToken}`)
                .send(orderData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.discountValue).toBe(5);
        });
    });

    describe('PUT /api/orders/:id - Discount Validation', () => {
        let order: any;

        beforeEach(async () => {
            order = await prisma.order.create({
                data: {
                    tableNumber: 1,
                    status: 'pending',
                    total: 100,
                    createdBy: waiterUser.id,
                },
            });
        });

        it('should fail to update with negative discountValue', async () => {
            const updateData = {
                discountValue: -5,
            };

            const response = await request(app)
                .put(`/api/orders/${order.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should fail to update with percentage > 100', async () => {
            const updateData = {
                discountType: 'percentage',
                discountValue: 150,
            };

            const response = await request(app)
                .put(`/api/orders/${order.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/payments - Payment Logic Bug Fix', () => {
        let order: any;
        let table: any;

        beforeEach(async () => {
            table = await prisma.table.create({
                data: { number: 10, capacity: 4, status: 'occupied' }
            });
            order = await prisma.order.create({
                data: {
                    tableNumber: 10,
                    status: 'ready',
                    total: 100,
                    createdBy: waiterUser.id,
                    isPaid: false
                },
            });
            await prisma.table.update({
                where: { number: 10 },
                data: { currentOrderId: order.id }
            });
        });

        it('should not mark order as served or free table after payment', async () => {
            const paymentData = {
                amount: 100,
                method: 'cash'
            };

            const response = await request(app)
                .post(`/api/payments/${order.id}/pay`)
                .set('Authorization', `Bearer ${waiterToken}`)
                .send(paymentData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Verify order is paid but still 'ready' (not served)
            const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
            expect(updatedOrder?.isPaid).toBe(true);
            expect(updatedOrder?.status).toBe('ready');

            // Verify table is still occupied
            const updatedTable = await prisma.table.findUnique({ where: { number: 10 } });
            expect(updatedTable?.status).toBe('occupied');
            expect(updatedTable?.currentOrderId).toBe(order.id);
        });
    });
});
