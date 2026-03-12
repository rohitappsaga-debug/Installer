import request from 'supertest';
import express, { Express } from 'express';
import prisma from '../src/utils/database';
import { TestUtils } from './utils';

describe('Category Routes', () => {
    let app: Express;
    let adminToken: string;
    let waiterToken: string;

    beforeAll(async () => {
        app = express();
        app.use(express.json());

        // Import routes
        const authRoutes = await import('../src/routes/auth');
        const categoryRoutes = await import('../src/routes/categories');

        // Mount routes
        app.use('/api/auth', authRoutes.default);
        app.use('/api/categories', categoryRoutes.default);

        // Error handler
        const { errorHandler } = await import('../src/middleware/errorHandler');
        app.use(errorHandler);

        // Create users
        const admin = await TestUtils.createTestUser('admin');
        adminToken = TestUtils.generateJWT(admin);

        const waiter = await TestUtils.createTestUser('waiter');
        waiterToken = TestUtils.generateJWT(waiter);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('GET /api/categories', () => {
        it('should return empty list initially', async () => {
            const res = await request(app)
                .get('/api/categories')
                .set('Authorization', `Bearer ${waiterToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual([]);
        });
    });

    describe('POST /api/admin/categories', () => {
        it('should allow admin to create category', async () => {
            const res = await request(app)
                .post('/api/admin/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Starters',
                    description: 'Delicious starters',
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Starters');
        });

        it('should prevent duplicate category name', async () => {
            const res = await request(app)
                .post('/api/admin/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Starters',
                });

            expect(res.status).toBe(400); // 400 or 409 depending on implementation
        });

        it('should deny non-admin', async () => {
            const res = await request(app)
                .post('/api/admin/categories')
                .set('Authorization', `Bearer ${waiterToken}`)
                .send({
                    name: 'Drinks',
                });

            expect(res.status).toBe(403);
        });
    });

    describe('DELETE /api/admin/categories/:id', () => {
        let categoryId: string;

        beforeEach(async () => {
            // Create a cat for deletion
            const cat = await prisma.category.create({
                data: { name: 'ToDelete' }
            });
            categoryId = cat.id;
        });

        it('should delete empty category', async () => {
            const res = await request(app)
                .delete(`/api/admin/categories/${categoryId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);

            const check = await prisma.category.findUnique({ where: { id: categoryId } });
            expect(check).toBeNull();
        });

        it('should prevent deletion if items exist', async () => {
            // Create a persistent category and item for this test
            const cat = await prisma.category.create({ data: { name: 'WithItems' } });
            await prisma.menuItem.create({
                data: {
                    name: 'Item1',
                    price: 100,
                    category: 'WithItems',
                    categoryId: cat.id
                }
            });

            const res = await request(app)
                .delete(`/api/admin/categories/${cat.id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('associated menu items');

            // Cleanup
            await prisma.menuItem.deleteMany({ where: { category: 'WithItems' } });
            await prisma.category.delete({ where: { id: cat.id } });
        });
    });
});
