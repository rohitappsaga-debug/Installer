import request from 'supertest';
import express, { Express } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { TestUtils } from './utils';
import { prisma } from './setup';

// Import the app setup
let app: Express;

beforeAll(async () => {
  // Create Express app for testing
  app = express();
  app.use(express.json());

  // Import and setup routes
  const authRoutes = await import('../src/routes/auth');
  app.use('/api/auth', authRoutes.default);

  // Import error handler
  const { errorHandler } = await import('../src/middleware/errorHandler');
  app.use(errorHandler);
});

describe('Auth API', () => {
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await TestUtils.createTestUser('admin');
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test-admin@restaurant.com',
          password: 'password',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('test-admin@restaurant.com');
      expect(response.body.data.user.role).toBe('admin');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid@restaurant.com',
          password: 'password',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test-admin@restaurant.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should fail with inactive user', async () => {
      // Create inactive user
      await prisma.user.create({
        data: {
          name: 'Inactive User',
          email: 'inactive@restaurant.com',
          password: await bcrypt.hash('password', 10),
          role: 'admin',
          active: false,
        },
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@restaurant.com',
          password: 'password',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test-admin@restaurant.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New Waiter',
          email: 'newwaiter@restaurant.com',
          password: 'password123',
          role: 'waiter',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe('newwaiter@restaurant.com');
    });

    it('should fail if email already exists', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'First User',
          email: 'duplicate@restaurant.com',
          password: 'password123',
          role: 'waiter',
        });

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Second User',
          email: 'duplicate@restaurant.com',
          password: 'password123',
          role: 'waiter',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User already exists');
    });
  });

  describe('GET /api/auth/me', () => {
    let token: string;
    let user: any;

    beforeEach(async () => {
      user = await TestUtils.createTestUser('admin');
      token = TestUtils.generateJWT(user);
    });

    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(user.id);
      expect(response.body.data.email).toBe(user.email);
      expect(response.body.data.role).toBe(user.role);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied. No token provided.');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid token.');
    });

    it('should fail with expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Token expired.');
    });

    it('should fail with token for non-existent user', async () => {
      const tokenForNonExistentUser = jwt.sign(
        { userId: 'non-existent-id', email: 'nonexistent@restaurant.com', role: 'admin' },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenForNonExistentUser}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found or inactive.');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;
    let user: any;

    beforeEach(async () => {
      user = await TestUtils.createTestUser('admin');
      refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
