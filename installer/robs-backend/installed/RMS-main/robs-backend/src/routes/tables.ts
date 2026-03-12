import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { validate, validateQuery, validateParams, schemas } from '@/middleware/validation';
import { asyncHandler, AppError } from '@/middleware/errorHandler';
import prisma from '@/utils/database';
import { UserRole } from '@/types';
// Pusher removed in favor of Socket.io

const router = Router();

/**
 * @swagger
 * /api/tables:
 *   get:
 *     summary: Get all tables
 *     description: Retrieve a paginated list of all tables
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [free, occupied, reserved]
 *         description: Filter by table status
 *     responses:
 *       200:
 *         description: Tables retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Table'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authenticate, validateQuery(schemas.tableQuery), asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query as any;
  const numericPage = Number(page) || 1;
  const numericLimit = Number(limit) || 10;
  const skip = (numericPage - 1) * numericLimit;

  const where = status ? { status } : {};

  const [tables, total] = await Promise.all([
    prisma.table.findMany({
      where,
      skip,
      take: numericLimit,
      orderBy: { number: 'asc' },
    }),
    prisma.table.count({ where }),
  ]);

  res.json({
    success: true,
    data: tables,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      totalPages: Math.ceil(total / numericLimit),
    },
  });
}));

// Get table by ID
router.get('/:id', authenticate, validateParams(schemas.uuidParam), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const table = await prisma.table.findUnique({
    where: { id },
  });

  if (!table) {
    throw new AppError('Table not found', 404);
  }

  res.json({
    success: true,
    data: table,
  });
}));

/**
 * @swagger
 * /api/tables:
 *   post:
 *     summary: Create a new table
 *     description: Create a new table (Admin only)
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - number
 *               - capacity
 *             properties:
 *               number:
 *                 type: integer
 *                 example: 5
 *                 description: Table number
 *               capacity:
 *                 type: integer
 *                 example: 4
 *                 description: Maximum number of people
 *               status:
 *                 type: string
 *                 enum: [free, occupied, reserved]
 *                 default: free
 *                 description: Table status
 *     responses:
 *       201:
 *         description: Table created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Table'
 *                 message:
 *                   type: string
 *                   example: Table created successfully
 *       400:
 *         description: Bad request (table number already exists)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden (Admin access required)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authenticate, authorize(UserRole.admin), validate(schemas.createTable), asyncHandler(async (req, res) => {
  const { number, capacity, status = 'free' } = req.body;

  // Check if table number already exists
  const existingTable = await prisma.table.findUnique({
    where: { number },
  });

  if (existingTable) {
    throw new AppError('Table with this number already exists', 400);
  }

  const table = await prisma.table.create({
    data: {
      number,
      capacity,
      status,
    },
  });

  res.status(201).json({
    success: true,
    data: table,
    message: 'Table created successfully',
  });
}));

// Bulk create tables (Admin only)
// Bulk create tables (Admin only)
router.post('/bulk', authenticate, authorize(UserRole.admin), validate(schemas.bulkTable), asyncHandler(async (req, res) => {
  const { tables } = req.body;

  const result = await prisma.table.createMany({
    data: tables.map((t: any) => ({
      number: t.number,
      capacity: t.capacity,
      status: t.status || 'free'
    })),
    skipDuplicates: true
  });

  res.status(201).json({
    success: true,
    data: result,
    message: `${result.count} tables created successfully`
  });
}));

// Update table (Admin, Waiter allowed for status updates)
router.put('/:id', authenticate, authorize(UserRole.admin, UserRole.waiter), validateParams(schemas.uuidParam), validate(schemas.updateTable), asyncHandler(async (req, res) => {

  const { id } = req.params;
  try {
    const table = await prisma.table.update({
      where: { id },
      data: req.body,
    });

    // Emit socket event
    const io = req.app.get('io');
    io?.emit('table:status-changed', {
      tableNumber: table.number,
      status: table.status,
      reservedBy: table.reservedBy,
      reservedTime: table.reservedTime,
      groupId: table.groupId,
      isPrimary: table.isPrimary
    });


    res.json({
      success: true,
      data: table,
      message: 'Table updated successfully',
    });
  } catch (e: any) {
    throw new AppError('Table not found', 404);
  }
}));

// Delete table (Admin only)
router.delete('/:id', authenticate, authorize(UserRole.admin), validateParams(schemas.uuidParam), asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.table.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Table deleted successfully',
    });
  } catch (e: any) {
    throw new AppError('Table not found', 404);
  }
}));

// Update table status
router.patch('/:id/status', authenticate, validateParams(schemas.uuidParam), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new AppError('Status is required', 400);
  }

  const allowed = ['free', 'occupied', 'reserved'];
  if (!allowed.includes(String(status))) {
    throw new AppError('Invalid status', 400);
  }

  try {
    const table = await prisma.table.update({
      where: { id },
      data: { status },
    });

    // Emit socket event
    const io = req.app.get('io');
    io?.emit('table:status-changed', {
      tableNumber: table.number,
      status: table.status,
      reservedBy: table.reservedBy,
      reservedTime: table.reservedTime,
      groupId: table.groupId,
      isPrimary: table.isPrimary
    });


    res.json({
      success: true,
      data: table,
      message: 'Table status updated successfully',
    });
  } catch (e: any) {
    throw new AppError('Table not found', 404);
  }
}));

// Group tables (Admin only)
router.post('/group', authenticate, authorize(UserRole.admin), validate(schemas.groupTables), asyncHandler(async (req, res) => {
  const { tableNumbers, primaryTableNumber } = req.body;
  const groupId = `group_${Date.now()}`;

  // Verify all tables exist and are free
  const tables = await prisma.table.findMany({
    where: { number: { in: tableNumbers } },
  });

  if (tables.length !== tableNumbers.length) {
    throw new AppError('One or more tables not found', 404);
  }

  const busyTables = tables.filter(t => t.status !== 'free' || t.groupId);
  if (busyTables.length > 0) {
    throw new AppError(`Tables ${busyTables.map(t => t.number).join(', ')} are not available for grouping`, 400);
  }

  if (!tableNumbers.includes(primaryTableNumber)) {
    throw new AppError('Primary table must be one of the grouped tables', 400);
  }

  // Update all tables in the group
  await prisma.$transaction(
    tables.map(t =>
      prisma.table.update({
        where: { id: t.id },
        data: {
          groupId,
          isPrimary: t.number === primaryTableNumber,
          status: 'occupied' // Linked tables become occupied
        }
      })
    )
  );

  // Emit socket event for each table
  const io = req.app.get('io');
  for (const t of tables) {
    io?.emit('table:status-changed', {
      tableNumber: t.number,
      status: 'occupied',
      groupId,
      isPrimary: t.number === primaryTableNumber
    });
  }

  res.status(200).json({
    success: true,
    message: 'Tables grouped successfully',
    data: { groupId }
  });
}));

// Ungroup tables (Admin only)
router.post('/ungroup/:groupId', authenticate, authorize(UserRole.admin), asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  const tables = await prisma.table.findMany({
    where: { groupId },
  });

  if (tables.length === 0) {
    throw new AppError('No tables found in this group', 404);
  }

  // Check if any table in the group has an active order
  const occupiedWithOrders = tables.filter(t => t.currentOrderId);
  if (occupiedWithOrders.length > 0) {
    throw new AppError('Cannot ungroup tables while there is an active order', 400);
  }

  // Reset grouping fields and set status to free
  await prisma.$transaction(
    tables.map(t =>
      prisma.table.update({
        where: { id: t.id },
        data: {
          groupId: null,
          isPrimary: false,
          status: 'free'
        }
      })
    )
  );

  // Emit socket event for each table
  const io = req.app.get('io');
  for (const t of tables) {
    io?.emit('table:status-changed', {
      tableNumber: t.number,
      status: 'free',
      groupId: null,
      isPrimary: false
    });
  }

  res.status(200).json({
    success: true,
    message: 'Tables ungrouped successfully'
  });
}));

export default router;
