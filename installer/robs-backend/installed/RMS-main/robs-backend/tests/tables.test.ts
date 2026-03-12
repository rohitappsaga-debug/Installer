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
  const tableRoutes = await import('../src/routes/tables');
  
  app.use('/api/auth', authRoutes.default);
  app.use('/api/tables', tableRoutes.default);
  
  // Import error handler
  const { errorHandler } = await import('../src/middleware/errorHandler');
  app.use(errorHandler);
});

describe('Tables API', () => {
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

  describe('GET /api/tables', () => {
    beforeEach(async () => {
      // Create test tables
      await TestUtils.createTestTable(1);
      await TestUtils.createTestTable(2);
      await TestUtils.createTestTable(3);
    });

    it('should get all tables with valid token', async () => {
      const response = await request(app)
        .get('/api/tables')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(3);
    });

    it('should filter tables by status', async () => {
      // Update one table to occupied
      await prisma.table.updateMany({
        where: { number: 1 },
        data: { status: 'occupied' },
      });

      const response = await request(app)
        .get('/api/tables?status=occupied')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('occupied');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/tables?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/tables');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tables/:id', () => {
    let table: any;

    beforeEach(async () => {
      table = await TestUtils.createTestTable(1);
    });

    it('should get table by id with valid token', async () => {
      const response = await request(app)
        .get(`/api/tables/${table.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(table.id);
      expect(response.body.data.number).toBe(1);
    });

    it('should fail with non-existent table id', async () => {
      const response = await request(app)
        .get('/api/tables/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Table not found');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get(`/api/tables/${table.id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/tables', () => {
    it('should create table with admin token', async () => {
      const tableData = {
        number: 5,
        capacity: 6,
        status: 'free',
      };

      const response = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(tableData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.number).toBe(5);
      expect(response.body.data.capacity).toBe(6);
      expect(response.body.data.status).toBe('free');
    });

    it('should fail with duplicate table number', async () => {
      await TestUtils.createTestTable(5);

      const tableData = {
        number: 5,
        capacity: 4,
        status: 'free',
      };

      const response = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(tableData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Table with this number already exists');
    });

    it('should fail with waiter token (insufficient permissions)', async () => {
      const tableData = {
        number: 6,
        capacity: 4,
        status: 'free',
      };

      const response = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${waiterToken}`)
        .send(tableData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should fail without token', async () => {
      const tableData = {
        number: 7,
        capacity: 4,
        status: 'free',
      };

      const response = await request(app)
        .post('/api/tables')
        .send(tableData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          number: 8,
          // missing capacity
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/tables/:id', () => {
    let table: any;

    beforeEach(async () => {
      table = await TestUtils.createTestTable(1);
    });

    it('should update table with admin token', async () => {
      const updateData = {
        capacity: 8,
        status: 'occupied',
      };

      const response = await request(app)
        .put(`/api/tables/${table.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.capacity).toBe(8);
      expect(response.body.data.status).toBe('occupied');
    });

    it('should fail with waiter token (insufficient permissions)', async () => {
      const updateData = {
        capacity: 6,
      };

      const response = await request(app)
        .put(`/api/tables/${table.id}`)
        .set('Authorization', `Bearer ${waiterToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent table id', async () => {
      const updateData = {
        capacity: 6,
      };

      const response = await request(app)
        .put('/api/tables/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/tables/:id', () => {
    let table: any;

    beforeEach(async () => {
      table = await TestUtils.createTestTable(1);
    });

    it('should delete table with admin token', async () => {
      const response = await request(app)
        .delete(`/api/tables/${table.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Table deleted successfully');

      // Verify table is deleted
      const deletedTable = await prisma.table.findUnique({
        where: { id: table.id },
      });
      expect(deletedTable).toBeNull();
    });

    it('should fail with waiter token (insufficient permissions)', async () => {
      const response = await request(app)
        .delete(`/api/tables/${table.id}`)
        .set('Authorization', `Bearer ${waiterToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent table id', async () => {
      const response = await request(app)
        .delete('/api/tables/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/tables/:id/status', () => {
    let table: any;

    beforeEach(async () => {
      table = await TestUtils.createTestTable(1);
    });

    it('should update table status with valid token', async () => {
      const response = await request(app)
        .patch(`/api/tables/${table.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'occupied' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('occupied');
    });

    it('should fail with invalid status', async () => {
      const response = await request(app)
        .patch(`/api/tables/${table.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid-status' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail without status', async () => {
      const response = await request(app)
        .patch(`/api/tables/${table.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Status is required');
    });

    it('should fail with non-existent table id', async () => {
      const response = await request(app)
        .patch('/api/tables/non-existent-id/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'occupied' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
