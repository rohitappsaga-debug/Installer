import request from 'supertest';
import express, { Express } from 'express';
import { TestUtils } from './utils';
import { prisma } from './setup';

let app: Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  
  // Import and setup routes
  const authRoutes = await import('../src/routes/auth');
  const orderRoutes = await import('../src/routes/orders');
  
  app.use('/api/auth', authRoutes.default);
  app.use('/api/orders', orderRoutes.default);
  
  // Import error handler
  const { errorHandler } = await import('../src/middleware/errorHandler');
  app.use(errorHandler);
});

describe('Orders API', () => {
  let adminToken: string;
  let waiterToken: string;
  let kitchenToken: string;
  let adminUser: any;
  let waiterUser: any;
  let kitchenUser: any;
  let table: any;
  let menuItem: any;

  beforeEach(async () => {
    // Create test users
    adminUser = await TestUtils.createTestUser('admin');
    waiterUser = await TestUtils.createTestUser('waiter');
    kitchenUser = await TestUtils.createTestUser('kitchen');
    
    adminToken = TestUtils.generateJWT(adminUser);
    waiterToken = TestUtils.generateJWT(waiterUser);
    kitchenToken = TestUtils.generateJWT(kitchenUser);

    // Create test data
    table = await TestUtils.createTestTable(1);
    menuItem = await TestUtils.createTestMenuItem();
  });

  describe('GET /api/orders', () => {
    beforeEach(async () => {
      // Create test orders
      const order1 = await prisma.order.create({
        data: {
          tableNumber: 1,
          status: 'pending',
          total: 15.99,
          createdBy: waiterUser.id,
        },
      });

      await prisma.orderItem.create({
        data: {
          orderId: order1.id,
          menuItemId: menuItem.id,
          quantity: 1,
        },
      });

      const order2 = await prisma.order.create({
        data: {
          tableNumber: 2,
          status: 'ready',
          total: 31.98,
          createdBy: waiterUser.id,
        },
      });

      await prisma.orderItem.create({
        data: {
          orderId: order2.id,
          menuItemId: menuItem.id,
          quantity: 2,
        },
      });
    });

    it('should get all orders with valid token', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/orders?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('pending');
    });

    it('should filter orders by table number', async () => {
      const response = await request(app)
        .get('/api/orders?tableNumber=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].tableNumber).toBe(1);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/orders?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/orders');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/orders/:id', () => {
    let order: any;

    beforeEach(async () => {
      order = await prisma.order.create({
        data: {
          tableNumber: 1,
          status: 'pending',
          total: 15.99,
          createdBy: waiterUser.id,
        },
      });

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          menuItemId: menuItem.id,
          quantity: 1,
        },
      });
    });

    it('should get order by id with valid token', async () => {
      const response = await request(app)
        .get(`/api/orders/${order.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(order.id);
      expect(response.body.data.items).toHaveLength(1);
    });

    it('should fail with non-existent order id', async () => {
      const response = await request(app)
        .get('/api/orders/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Order not found');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get(`/api/orders/${order.id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/orders', () => {
    it('should create order with waiter token', async () => {
      const orderData = {
        tableNumber: 1,
        items: [
          {
            menuItemId: menuItem.id,
            quantity: 2,
            notes: 'Extra cheese',
          },
        ],
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${waiterToken}`)
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tableNumber).toBe(1);
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.items).toHaveLength(1);
    });

    it('should create order with admin token', async () => {
      const orderData = {
        tableNumber: 1,
        items: [
          {
            menuItemId: menuItem.id,
            quantity: 1,
          },
        ],
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tableNumber).toBe(1);
    });

    it('should fail with kitchen token (insufficient permissions)', async () => {
      const orderData = {
        tableNumber: 1,
        items: [
          {
            menuItemId: menuItem.id,
            quantity: 1,
          },
        ],
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${kitchenToken}`)
        .send(orderData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should fail without token', async () => {
      const orderData = {
        tableNumber: 1,
        items: [
          {
            menuItemId: menuItem.id,
            quantity: 1,
          },
        ],
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${waiterToken}`)
        .send({
          tableNumber: 1,
          // missing items
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with empty items array', async () => {
      const orderData = {
        tableNumber: 1,
        items: [],
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${waiterToken}`)
        .send(orderData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent menu item', async () => {
      const orderData = {
        tableNumber: 1,
        items: [
          {
            menuItemId: 'non-existent-id',
            quantity: 1,
          },
        ],
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${waiterToken}`)
        .send(orderData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/orders/:id', () => {
    let order: any;

    beforeEach(async () => {
      order = await prisma.order.create({
        data: {
          tableNumber: 1,
          status: 'pending',
          total: 15.99,
          createdBy: waiterUser.id,
        },
      });
    });

    it('should update order status with kitchen token', async () => {
      const updateData = {
        status: 'in-progress',
      };

      const response = await request(app)
        .put(`/api/orders/${order.id}`)
        .set('Authorization', `Bearer ${kitchenToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('in-progress');
    });

    it('should update order with admin token', async () => {
      const updateData = {
        status: 'ready',
        discountType: 'percentage',
        discountValue: 10,
      };

      const response = await request(app)
        .put(`/api/orders/${order.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ready');
      expect(response.body.data.discountType).toBe('percentage');
      expect(response.body.data.discountValue).toBe(10);
    });

    it('should fail with waiter token (insufficient permissions)', async () => {
      const updateData = {
        status: 'ready',
      };

      const response = await request(app)
        .put(`/api/orders/${order.id}`)
        .set('Authorization', `Bearer ${waiterToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent order id', async () => {
      const updateData = {
        status: 'ready',
      };

      const response = await request(app)
        .put('/api/orders/non-existent-id')
        .set('Authorization', `Bearer ${kitchenToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/orders/:id', () => {
    let order: any;

    beforeEach(async () => {
      order = await prisma.order.create({
        data: {
          tableNumber: 1,
          status: 'pending',
          total: 15.99,
          createdBy: waiterUser.id,
        },
      });
    });

    it('should delete order with admin token', async () => {
      const response = await request(app)
        .delete(`/api/orders/${order.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Order deleted successfully');

      // Verify order is deleted
      const deletedOrder = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(deletedOrder).toBeNull();
    });

    it('should fail with waiter token (insufficient permissions)', async () => {
      const response = await request(app)
        .delete(`/api/orders/${order.id}`)
        .set('Authorization', `Bearer ${waiterToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent order id', async () => {
      const response = await request(app)
        .delete('/api/orders/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
