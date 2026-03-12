import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { logger } from '@/utils/logger';

declare global {
  var __prisma: PrismaClient | undefined;
}

// ---------------------------------------------------------------------------
// Internal factory — builds a fresh Pool + Adapter + PrismaClient for a given URL.
// Used both on initial startup and after an auto-heal re-provisions the DB user.
// ---------------------------------------------------------------------------
const buildPrismaClient = (dbUrl: string): PrismaClient => {
  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  } as any);
};

// Setup driver adapter for Prisma 7
const databaseUrl = process.env.DATABASE_URL?.replace(/^\"|\"$/g, '').trim();

if (!databaseUrl) {
  logger.error('DATABASE_URL is not defined in environment variables');
} else {
  logger.info(`DATABASE_URL connection string: ${databaseUrl.replace(/:[^:@]*@/, ':****@')}`);
}

// Prevent multiple instances of Prisma Client in development
let prisma: PrismaClient = globalThis.__prisma || buildPrismaClient(databaseUrl || '');

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

// Database connection helper
export const connectDatabase = async (): Promise<void> => {
  // Inner attempt logic — can be called for initial connect and after heal
  const attemptConnect = async (client: PrismaClient): Promise<void> => {
    await client.$connect();
    logger.info('Database connected successfully');
    await client.$queryRaw`SELECT 1`;
    logger.info('✅ Database readiness check passed');
  };

  try {
    await attemptConnect(prisma);
  } catch (error: any) {
    // If we reach here, reconnection failed
    console.error('❌ FATAL: Database connection failed:', error);
    logger.error('❌ Database connection failed:', error);
    logger.error('-> Check if your database container is running');
    logger.error('-> Verify DATABASE_URL in .env');
    logger.error('-> Ensure database server is accessible');
    process.exit(1);
  }
};

// Database disconnection helper
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Database disconnection failed:', error);
  }
};

// Health check helper
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

export default prisma;
