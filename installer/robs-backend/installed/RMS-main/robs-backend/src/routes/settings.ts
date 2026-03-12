import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { validate, schemas } from '@/middleware/validation';
import { asyncHandler, AppError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import prisma from '@/utils/database';
import { UserRole } from '@/types';

const router = Router();

// Get settings (Authenticated users)
router.get('/', authenticate, asyncHandler(async (req, res) => {
  // Fetch all settings, ordered by last update
  let allSettings = await prisma.settings.findMany({
    orderBy: { updatedAt: 'desc' }
  });


  let settings;

  if (allSettings.length === 0) {
    // Create default settings if none exist
    settings = await prisma.settings.create({
      data: {
        taxRate: 5.00,
        taxEnabled: true,
        currency: '₹',
        restaurantName: 'Restaurant',
        discountPresets: [5, 10, 15, 20],
        printerConfig: {
          enabled: true,
          printerName: 'Kitchen Printer 1',
        },
        enabledPaymentMethods: ['cash', 'card', 'upi'],
        receiptFooter: 'Thank you for your business!',
      },
    });
  } else {
    // Use the most recently updated one
    settings = allSettings[0];

    // Cleanup duplicates if any
    if (allSettings.length > 1) {
      const idsToDelete = allSettings.slice(1).map(s => s.id);
      await prisma.settings.deleteMany({
        where: { id: { in: idsToDelete } }
      });
      logger.info(`Cleaned up ${idsToDelete.length} duplicate settings records`);
    }
  }

  res.json({
    success: true,
    data: settings,
  });
}));

// Update settings (Admin only)
router.put('/', authenticate, authorize(UserRole.admin), validate(schemas.updateSettings), asyncHandler(async (req, res) => {

  let settings = await prisma.settings.findFirst();

  if (!settings) {

    settings = await prisma.settings.create({
      data: req.body,
    });
  } else {

    settings = await prisma.settings.update({
      where: { id: settings.id },
      data: req.body,
    });
  }


  res.json({
    success: true,
    data: settings,
    message: 'Settings updated successfully',
  });
}));

// Get tax configuration (Admin only)
router.get('/tax', authenticate, authorize(UserRole.admin), asyncHandler(async (req, res) => {
  const settings = await prisma.settings.findFirst({
    select: {
      taxRate: true,
      currency: true,
    },
  });

  res.json({
    success: true,
    data: {
      taxRate: settings?.taxRate || 5.00,
      currency: settings?.currency || '₹',
    },
  });
}));

// Update tax rate (Admin only)
router.patch('/tax', authenticate, authorize(UserRole.admin), asyncHandler(async (req, res) => {
  const { taxRate, currency } = req.body;

  if (taxRate === undefined && currency === undefined) {
    throw new AppError('Tax rate or currency is required', 400);
  }

  let settings = await prisma.settings.findFirst();

  const updateData: any = {};
  if (taxRate !== undefined) updateData.taxRate = taxRate;
  if (currency !== undefined) updateData.currency = currency;

  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        taxRate: taxRate || 5.00,
        currency: currency || '₹',
        restaurantName: 'Restaurant',
        discountPresets: [5, 10, 15, 20],
        printerConfig: {
          enabled: true,
          printerName: 'Kitchen Printer 1',
        },
        enabledPaymentMethods: ['cash', 'card', 'upi'],
        receiptFooter: 'Thank you for your business!',
      },
    });
  } else {
    settings = await prisma.settings.update({
      where: { id: settings.id },
      data: updateData,
    });
  }

  res.json({
    success: true,
    data: settings,
    message: 'Tax configuration updated successfully',
  });
}));

// Get system info (Admin only)
router.get('/system', authenticate, authorize(UserRole.admin), asyncHandler(async (req, res) => {
  let dbStatus = 'Healthy';
  try {
    // Simple query to check connection
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbStatus = 'Error';
    logger.error('Database health check failed:', error);
  }


  res.json({
    success: true,
    data: {
      version: '1.0.0',
      lastBackup: 'Scheduled Daily (3:00 AM)', // Mocked for now as per plan
      databaseStatus: dbStatus,
      environment: process.env.NODE_ENV || 'development',
    },

  });
}));

export default router;
