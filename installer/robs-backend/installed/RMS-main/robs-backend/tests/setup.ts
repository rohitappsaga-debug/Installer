import { PrismaClient } from '../src/generated/client/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { execSync } from 'child_process';
import { join } from 'path';

// Force test env configuration
const TEST_DB_URL = 'postgresql://postgres:rohit5237@localhost:5432/restaurant_test_db?schema=public';
process.env.DATABASE_URL = TEST_DB_URL;
// Pusher removed in favor of Socket.io

// Test database setup
const pool = new Pool({ connectionString: TEST_DB_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Global test setup
beforeAll(async () => {
  // Reset the test database
  try {
    const isPrimaryWorker = process.env.JEST_WORKER_ID === '1' || !process.env.JEST_WORKER_ID;
    if (isPrimaryWorker) {
      execSync('npx prisma db push --force-reset', {
        stdio: 'inherit',
        env: {
          ...process.env,
          DATABASE_URL: TEST_DB_URL,
        },
      });
      // Seed test data
      execSync('npx prisma db seed', {
        stdio: 'inherit',
        env: {
          ...process.env,
          DATABASE_URL: TEST_DB_URL,
        },
      });
      // Clear baseline data that interferes with tests
      try { await prisma.orderItem.deleteMany(); } catch { }
      try { await prisma.order.deleteMany(); } catch { }
      try { await prisma.menuItem.deleteMany(); } catch { }
      try { await prisma.user.deleteMany(); } catch { }
      try { await prisma.table.deleteMany(); } catch { }
    }

    // All workers: wait until schema is ready
    for (let i = 0; i < 100; i++) {
      try {
        // Ensure core tables exist and seed ran
        await prisma.user.count();
        await prisma.menuItem.count();
        break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 100));
      }
    }
  } catch (error) {
    console.error('Test database setup failed:', error);
  }
});

// Clean up after each test
afterEach(async () => {
  // Clean up test data if needed
  try { await prisma.orderItem.deleteMany(); } catch { }
  try { await prisma.order.deleteMany(); } catch { }
  try { await prisma.notification.deleteMany(); } catch { }
  try { await prisma.menuItem.deleteMany(); } catch { }
  try { await prisma.category.deleteMany(); } catch { }
  try { await prisma.table.deleteMany(); } catch { }
  try { await prisma.user.deleteMany(); } catch { }
});

// Global cleanup
afterAll(async () => {
  await prisma.$disconnect();
});

// Export prisma for use in tests
export { prisma };

