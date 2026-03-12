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
  const menuRoutes = await import('../src/routes/menu');
  
  app.use('/api/auth', authRoutes.default);
  app.use('/api/menu', menuRoutes.default);
  
  // Import error handler
  const { errorHandler } = await import('../src/middleware/errorHandler');
  app.use(errorHandler);
});

describe('Menu API', () => {
  let adminToken: string;
  let waiterToken: string;
  let adminUser: any;
  let waiterUser: any;

  beforeEach(async () => {
    // Create test users
    adminUser = await TestUtils.createTestUser('admin');
    waiterUser = await TestUtils.createTestUser('waiter');
    
    adminToken = TestUtils.generateJWT(adminUser);
    waiterToken = TestUtils.generateJWT(waiterUser);
  });

  describe('GET /api/menu', () => {
    beforeEach(async () => {
      // Create test menu items
      await TestUtils.createTestMenuItem();
      await prisma.menuItem.create({
        data: {
          name: 'Test Burger',
          description: 'A test burger',
          price: 12.99,
          category: 'main',
          available: false,
          preparationTime: 15,
        },
      });
      await prisma.menuItem.create({
        data: {
          name: 'Test Salad',
          description: 'A test salad',
          price: 8.99,
          category: 'appetizer',
          available: true,
          preparationTime: 10,
        },
      });
    });

    it('should get all menu items with valid token', async () => {
      const response = await request(app)
        .get('/api/menu')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter menu items by category', async () => {
      const response = await request(app)
        .get('/api/menu?category=main')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((item: any) => item.category === 'main')).toBe(true);
    });

    it('should filter menu items by availability', async () => {
      const response = await request(app)
        .get('/api/menu?available=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((item: any) => item.available === true)).toBe(true);
    });

    it('should search menu items by name', async () => {
      const response = await request(app)
        .get('/api/menu?search=Pizza')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toContain('Pizza');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/menu?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/menu');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/menu/:id', () => {
    let menuItem: any;

    beforeEach(async () => {
      menuItem = await TestUtils.createTestMenuItem();
    });

    it('should get menu item by id with valid token', async () => {
      const response = await request(app)
        .get(`/api/menu/${menuItem.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(menuItem.id);
      expect(response.body.data.name).toBe('Test Pizza');
    });

    it('should fail with non-existent menu item id', async () => {
      const response = await request(app)
        .get('/api/menu/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Menu item not found');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get(`/api/menu/${menuItem.id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/menu', () => {
    it('should create menu item with admin token', async () => {
      const menuData = {
        name: 'New Pizza',
        description: 'A new pizza',
        price: 18.99,
        category: 'main',
        available: true,
        preparationTime: 25,
      };

      const response = await request(app)
        .post('/api/menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(menuData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Pizza');
      expect(response.body.data.price).toBe(18.99);
      expect(response.body.data.category).toBe('main');
    });

    it('should fail with waiter token (insufficient permissions)', async () => {
      const menuData = {
        name: 'New Burger',
        description: 'A new burger',
        price: 14.99,
        category: 'main',
        available: true,
      };

      const response = await request(app)
        .post('/api/menu')
        .set('Authorization', `Bearer ${waiterToken}`)
        .send(menuData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should fail without token', async () => {
      const menuData = {
        name: 'New Salad',
        description: 'A new salad',
        price: 9.99,
        category: 'appetizer',
        available: true,
      };

      const response = await request(app)
        .post('/api/menu')
        .send(menuData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Incomplete Item',
          // missing price and category
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid price', async () => {
      const menuData = {
        name: 'Invalid Price Item',
        description: 'An item with invalid price',
        price: -5.99, // negative price
        category: 'main',
        available: true,
      };

      const response = await request(app)
        .post('/api/menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(menuData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/menu/:id', () => {
    let menuItem: any;

    beforeEach(async () => {
      menuItem = await TestUtils.createTestMenuItem();
    });

    it('should update menu item with admin token', async () => {
      const updateData = {
        name: 'Updated Pizza',
        price: 20.99,
        available: false,
      };

      const response = await request(app)
        .put(`/api/menu/${menuItem.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Pizza');
      expect(response.body.data.price).toBe(20.99);
      expect(response.body.data.available).toBe(false);
    });

    it('should fail with waiter token (insufficient permissions)', async () => {
      const updateData = {
        price: 16.99,
      };

      const response = await request(app)
        .put(`/api/menu/${menuItem.id}`)
        .set('Authorization', `Bearer ${waiterToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent menu item id', async () => {
      const updateData = {
        price: 16.99,
      };

      const response = await request(app)
        .put('/api/menu/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/menu/:id', () => {
    let menuItem: any;

    beforeEach(async () => {
      menuItem = await TestUtils.createTestMenuItem();
    });

    it('should delete menu item with admin token', async () => {
      const response = await request(app)
        .delete(`/api/menu/${menuItem.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Menu item deleted successfully');

      // Verify menu item is deleted
      const deletedMenuItem = await prisma.menuItem.findUnique({
        where: { id: menuItem.id },
      });
      expect(deletedMenuItem).toBeNull();
    });

    it('should fail with waiter token (insufficient permissions)', async () => {
      const response = await request(app)
        .delete(`/api/menu/${menuItem.id}`)
        .set('Authorization', `Bearer ${waiterToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent menu item id', async () => {
      const response = await request(app)
        .delete('/api/menu/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
