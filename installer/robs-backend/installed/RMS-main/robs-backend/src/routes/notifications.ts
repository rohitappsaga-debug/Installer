import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { validate, validateQuery, validateParams, schemas } from '@/middleware/validation';
import { asyncHandler, AppError } from '@/middleware/errorHandler';
import prisma from '@/utils/database';
import { UserRole } from '@/types';

const router = Router();

// Test notification broadcast (Temporary Debugging)
router.get('/test-broadcast', asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const notification = {
    id: 'test-' + Date.now(),
    type: 'alert',
    message: 'TEST NOTIFICATION - ' + new Date().toLocaleTimeString(),
    userId: 'test-user',
    read: false,
    createdAt: new Date()
  };

  console.log('[DEBUG] Broadcasting test notification to "waiter" room');
  io?.to('waiter').emit('notification:new', notification);

  res.json({ success: true, message: 'Test notification broadcasted', notification });
}));

// Get all notifications for current user
router.get('/', authenticate, validateQuery(schemas.pagination), asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, type, read } = req.query as any;
  const numericPage = Number(page) || 1;
  const numericLimit = Number(limit) || 10;
  const skip = (numericPage - 1) * numericLimit;

  const where: any = { userId: req.user!.id };

  if (type) where.type = type;
  if (read !== undefined) where.read = String(read) === 'true' || read === true;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: numericLimit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
  ]);

  res.json({
    success: true,
    data: notifications,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      totalPages: Math.ceil(total / numericLimit),
    },
  });
}));

// Get notification by ID
router.get('/:id', authenticate, validateParams(schemas.uuidParam), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await prisma.notification.findFirst({
    where: {
      id,
      userId: req.user!.id,
    },
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  res.json({
    success: true,
    data: notification,
  });
}));

// Create notification (Admin only)
router.post('/', authenticate, authorize(UserRole.admin), validate(schemas.createNotification), asyncHandler(async (req, res) => {
  const notification = await prisma.notification.create({
    data: req.body,
  });

  res.status(201).json({
    success: true,
    data: notification,
    message: 'Notification created successfully',
  });
}));

// Mark notification as read
router.patch('/:id/read', authenticate, validateParams(schemas.uuidParam), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await prisma.notification.updateMany({
    where: {
      id,
      userId: req.user!.id,
    },
    data: { read: true },
  });

  if (notification.count === 0) {
    throw new AppError('Notification not found', 404);
  }

  res.json({
    success: true,
    message: 'Notification marked as read',
  });
}));

// Mark all notifications as read
router.patch('/read-all', authenticate, asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: {
      userId: req.user!.id,
      read: false,
    },
    data: { read: true },
  });

  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
}));

// Delete notification
router.delete('/:id', authenticate, validateParams(schemas.uuidParam), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await prisma.notification.deleteMany({
    where: {
      id,
      userId: req.user!.id,
    },
  });

  console.log(`[DEBUG] Delete Notification: ID=${id}, User=${req.user!.id}, Count=${notification.count}`);

  if (notification.count === 0) {
    // Check if notification exists at all (to distinguish between 404 and 403)
    const exists = await prisma.notification.findUnique({ where: { id } });
    console.log(`[DEBUG] Notification exists globally? ${exists ? 'YES' : 'NO'} (User: ${exists?.userId})`);

    // CHANGE: Return success even if not found (idempotent) to prevent UI errors for ghost/stale notifications
    // throw new AppError('Notification not found', 404);
  }

  res.json({
    success: true,
    message: 'Notification deleted successfully',
  });
}));

export default router;
