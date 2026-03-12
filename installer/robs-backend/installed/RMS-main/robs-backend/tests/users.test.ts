import request from 'supertest';
import express, { Express } from 'express';
import bcrypt from 'bcryptjs';
import { TestUtils } from './utils';
import { prisma } from './setup';

let app: Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  
  // Import and setup routes
  const authRoutes = await import('../src/routes/auth');
  const userRoutes = await import('../src/routes/users');
  
  app.use('/api/auth', authRoutes.default);
  app.use('/api/users', userRoutes.default);
  
  // Import error handler
  const { errorHandler } = await import('../src/middleware/errorHandler');
  app.use(errorHandler);
});

describe('Users API', () => {
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

  describe('GET /api/users', () => {
    beforeEach(async () => {
      // Create additional test users
      await TestUtils.createTestUser('kitchen');
      await TestUtils.createTestUser('waiter');
    });

    it('should get all users with admin token', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(4); // admin, waiter, kitchen, waiter
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/users?role=waiter')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((user: any) => user.role === 'waiter')).toBe(true);
    });

    it('should filter users by active status', async () => {
      // Create inactive user
      await prisma.user.create({
        data: {
          name: 'Inactive User',
          email: 'inactive@restaurant.com',
          password: await bcrypt.hash('password', 10),
          role: 'waiter',
          active: false,
        },
      });

      const response = await request(app)
        .get('/api/users?active=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.every((user: any) => user.active === true)).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should fail with waiter token (insufficient permissions)', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${waiterToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id with admin token', async () => {
      const response = await request(app)
        .get(`/api/users/${waiterUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(waiterUser.id);
      expect(response.body.data.email).toBe(waiterUser.email);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should get own user with waiter token', async () => {
      const response = await request(app)
        .get(`/api/users/${waiterUser.id}`)
        .set('Authorization', `Bearer ${waiterToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(waiterUser.id);
    });

    it('should fail getting other user with waiter token', async () => {
      const response = await request(app)
        .get(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${waiterToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should fail with non-existent user id', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get(`/api/users/${waiterUser.id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/users', () => {
    it('should create user with admin token', async () => {
      const userData = {
        name: 'New Waiter',
        email: 'new-waiter@restaurant.com',
        password: 'password123',
        role: 'waiter',
        active: true,
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Waiter');
      expect(response.body.data.email).toBe('new-waiter@restaurant.com');
      expect(response.body.data.role).toBe('waiter');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should fail with waiter token (insufficient permissions)', async () => {
      const userData = {
        name: 'New User',
        email: 'new-user@restaurant.com',
        password: 'password123',
        role: 'waiter',
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${waiterToken}`)
        .send(userData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail without token', async () => {
      const userData = {
        name: 'New User',
        email: 'new-user@restaurant.com',
        password: 'password123',
        role: 'waiter',
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        name: 'Duplicate User',
        email: waiterUser.email, // Use existing email
        password: 'password123',
        role: 'waiter',
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User with this email already exists');
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Incomplete User',
          // missing email, password, role
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid email format', async () => {
      const userData = {
        name: 'Invalid Email User',
        email: 'invalid-email',
        password: 'password123',
        role: 'waiter',
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid role', async () => {
      const userData = {
        name: 'Invalid Role User',
        email: 'invalid-role@restaurant.com',
        password: 'password123',
        role: 'invalid-role',
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user with admin token', async () => {
      const updateData = {
        name: 'Updated Waiter',
        role: 'kitchen',
        active: false,
      };

      const response = await request(app)
        .put(`/api/users/${waiterUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Waiter');
      expect(response.body.data.role).toBe('kitchen');
      expect(response.body.data.active).toBe(false);
    });

    it('should update own user with waiter token', async () => {
      const updateData = {
        name: 'Updated Self',
      };

      const response = await request(app)
        .put(`/api/users/${waiterUser.id}`)
        .set('Authorization', `Bearer ${waiterToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Self');
    });

    it('should fail updating other user with waiter token', async () => {
      const updateData = {
        name: 'Unauthorized Update',
      };

      const response = await request(app)
        .put(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${waiterToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent user id', async () => {
      const updateData = {
        name: 'Updated User',
      };

      const response = await request(app)
        .put('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user with admin token', async () => {
      const response = await request(app)
        .delete(`/api/users/${waiterUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deleted successfully');

      // Verify user is deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: waiterUser.id },
      });
      expect(deletedUser).toBeNull();
    });

    it('should fail with waiter token (insufficient permissions)', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${waiterToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent user id', async () => {
      const response = await request(app)
        .delete('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
