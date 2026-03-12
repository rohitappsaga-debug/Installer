import request from 'supertest';
import { Express } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from './setup';

export class TestUtils {
  static async createTestUser(role: 'admin' | 'waiter' | 'kitchen' = 'admin') {
    const baseEmail = `test-${role}@restaurant.com`;
    const existing = await prisma.user.findUnique({ where: { email: baseEmail } });
    if (!existing) {
      return await prisma.user.create({
        data: {
          name: `Test ${role}`,
          email: baseEmail,
          password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
          role,
          active: true,
        },
      });
    }
    // Create a second distinct user for the same role with a unique email
    const uniqueEmail = `test-${role}+${Date.now()}@restaurant.com`;
    return await prisma.user.create({
      data: {
        name: `Test ${role}`,
        email: uniqueEmail,
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role,
        active: true,
      },
    });
  }

  static async createTestTable(number: number = 1) {
    const table = await prisma.table.upsert({
      where: { number },
      update: {},
      create: {
        number,
        capacity: 4,
        status: 'free',
      },
    });
    if (number === 1) {
      await prisma.table.upsert({
        where: { number: 2 },
        update: {},
        create: { number: 2, capacity: 4, status: 'free' },
      });
    }
    return table;
  }

  static async createTestMenuItem() {
    const menuItem = await prisma.menuItem.create({
      data: {
        name: 'Test Pizza',
        description: 'A test pizza',
        price: 15.99,
        category: 'main',
        available: true,
        preparationTime: 20,
      },
    });
    return menuItem;
  }

  static generateJWT(user: any) {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '1h' }
    );
  }

  static async loginUser(app: Express, email: string, password: string) {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    
    return response.body.data.token;
  }

}
