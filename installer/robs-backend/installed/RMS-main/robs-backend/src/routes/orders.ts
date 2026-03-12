import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { validate, validateQuery, validateParams, schemas } from '@/middleware/validation';
import { asyncHandler, AppError } from '@/middleware/errorHandler';
import prisma from '@/utils/database';
import { UserRole } from '@/types';
// Pusher removed in favor of Socket.io

const router = Router();

// Get all orders
router.get('/', authenticate, validateQuery(schemas.orderQuery), asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, tableNumber, dateFrom, dateTo } = req.query as any;
  const numericPage = Number(page) || 1;
  const numericLimit = Number(limit) || 10;
  const skip = (numericPage - 1) * numericLimit;

  const where: any = {};

  if (status) where.status = status;
  if (tableNumber) where.tableNumber = parseInt(tableNumber);
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: numericLimit,
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    success: true,
    data: orders.map((o: any) => ({
      ...o,
      status: String(o.status).replace(/_/g, '-'),
      total: Number(o.total),
      discountValue: o.discountValue !== null ? Number(o.discountValue) : null,
      items: o.orderItems,
    })),
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      totalPages: Math.ceil(total / numericLimit),
    },
  });
}));

// Get order by ID
router.get('/:id', authenticate, validateParams(schemas.uuidParam), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      orderItems: {
        include: {
          menuItem: true,
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      paymentTransactions: true,
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Calculate previous paid total for this table today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch parentOrderId using standard Prisma client
  // Prisma 5+ supports parentOrderId as a field if defined in schema.prisma
  const parentOrderId = order.parentOrderId;

  // Recursively find all ancestors for this sitting
  const previousOrders: any[] = [];
  let currentAncestorId = parentOrderId;

  while (currentAncestorId) {
    const currentAncestor = await prisma.order.findUnique({
      where: { id: currentAncestorId },
      include: {
        orderItems: { include: { menuItem: true } },
        paymentTransactions: true
      }
    });

    if (currentAncestor) {
      previousOrders.push(currentAncestor);
      currentAncestorId = currentAncestor.parentOrderId;
    } else {
      currentAncestorId = null;
    }
  }

  const previousPaidTotal = previousOrders.reduce((sum, o) => sum + Number(o.total), 0);

  res.json({
    success: true,
    data: {
      ...order,
      status: String(order.status).replace(/_/g, '-'),
      total: Number(order.total),
      discountValue: order.discountValue !== null ? Number(order.discountValue) : null,
      items: (order as any).orderItems,
      paymentTransactions: (order as any).paymentTransactions,
      previousPaidTotal,
      previousOrders,
    },
  });
}));

// Get orders by table number
router.get('/table/:tableNumber', authenticate, validateParams(schemas.tableNumberParam), asyncHandler(async (req, res) => {
  const { tableNumber } = req.params;

  const orders = await prisma.order.findMany({
    where: { tableNumber: parseInt(tableNumber) },
    include: {
      orderItems: {
        include: {
          menuItem: true,
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: orders,
  });
}));

// Create order
router.post('/', authenticate, authorize(UserRole.admin, UserRole.waiter), validate(schemas.createOrder), asyncHandler(async (req, res) => {
  const { tableNumber, items, discountType, discountValue, deliveryDetails } = req.body;

  // Check if table exists
  const table = await prisma.table.findUnique({
    where: { number: tableNumber },
  });

  if (!table) {
    throw new AppError('Table not found', 404);
  }

  if (table.status === 'occupied') {
    // Only allow if it's a primary grouped table that doesn't have an order yet
    const isNewGroupOrder = table.groupId && table.isPrimary && !table.currentOrderId;
    if (!isNewGroupOrder) {
      throw new AppError('Table is already occupied', 400);
    }
  }

  // Check if table is a secondary table in a group
  if (table.groupId && !table.isPrimary) {
    const primaryTable = await prisma.table.findFirst({
      where: { groupId: table.groupId, isPrimary: true }
    });
    throw new AppError(`This table is grouped with Table ${primaryTable?.number || '?'}. Please place the order from the main table.`, 400);
  }

  // Calculate total
  let total = 0;
  for (const item of items) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: item.menuItemId },
    });

    if (!menuItem || !menuItem.available) {
      throw new AppError(`Menu item ${item.menuItemId} not found or not available`, 400);
    }

    total += Number(menuItem.price) * item.quantity;
  }

  // Apply discount
  if (discountType && discountValue !== undefined) {
    // Defensive check: Ensure discountValue is not negative
    const safeDiscountValue = Math.max(0, Number(discountValue));

    if (discountType === 'percentage') {
      const percentage = Math.min(100, safeDiscountValue);
      total = total * (1 - percentage / 100);
    } else {
      total = Math.max(0, total - safeDiscountValue);
    }
  }

  // Create order with items
  const order = await prisma.order.create({
    data: {
      tableNumber,
      createdBy: req.user!.id,
      total,
      discountType,
      discountValue,
      orderItems: {
        create: items.map((item: any) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          notes: item.notes,
        })),
      },
      deliveryDetails: deliveryDetails ? {
        create: deliveryDetails
      } : undefined
    },
    include: {
      orderItems: {
        include: {
          menuItem: true,
        },
      },
    },
  });

  // Update table status
  if (table.groupId) {
    // Update all tables in the group
    await prisma.table.updateMany({
      where: { groupId: table.groupId },
      data: {
        status: 'occupied',
        currentOrderId: order.id,
      },
    });

    // Emit socket event for all tables in the group
    const io = req.app.get('io');
    const groupTables = await prisma.table.findMany({
      where: { groupId: table.groupId }
    });

    for (const gt of groupTables) {
      io?.emit('table:status-changed', {
        tableNumber: gt.number,
        status: 'occupied',
        currentOrderId: order.id,
        groupId: gt.groupId,
        isPrimary: gt.isPrimary
      });
    }
  } else {
    await prisma.table.update({
      where: { number: tableNumber },
      data: {
        status: 'occupied',
        currentOrderId: order.id,
      },
    });

    // Emit socket event
    const io = req.app.get('io');
    io?.emit('table:status-changed', {
      tableNumber: table.number,
      status: 'occupied',
      currentOrderId: order.id,
      groupId: table.groupId,
      isPrimary: table.isPrimary
    });
  }

  // Emit socket event
  const io = req.app.get('io');
  io?.emit('order:created', {
    ...order,
    status: String(order.status).replace(/_/g, '-'),
    total: Number(order.total),
    discountValue: order.discountValue !== null ? Number(order.discountValue) : null,
    items: (order as any).orderItems,
  });

  res.status(201).json({
    success: true,
    data: {
      ...order,
      status: String(order.status).replace(/_/g, '-'),
      total: Number(order.total),
      discountValue: order.discountValue !== null ? Number(order.discountValue) : null,
      items: (order as any).orderItems,
    },
    message: 'Order created successfully',
  });
}));

// Update order
router.put('/:id', authenticate, validateParams(schemas.uuidParam), validate(schemas.updateOrder), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Normalize possible status and ensure numeric fields are properly typed
  const data: any = { ...req.body };
  if (data.status) {
    data.status = String(data.status).replace(/-/g, '_').replace('in_progress', 'preparing');
  }

  // Permission: admin always; kitchen/waiter allowed if only status is updated
  const isAdmin = req.user?.role === 'admin';
  const isKitchen = req.user?.role === 'kitchen';
  const isWaiter = req.user?.role === 'waiter';
  const allowedWaiterFields = ['status', 'isPaid', 'paymentMethod'];
  const dataKeys = Object.keys(data);
  const onlyAllowedWaiterFields = dataKeys.every(k => allowedWaiterFields.includes(k));

  if (!isAdmin && !((isKitchen && dataKeys.length === 1 && dataKeys[0] === 'status') || (isWaiter && onlyAllowedWaiterFields))) {
    throw new AppError('Insufficient permissions', 403);
  }

  let order;
  try {
    order = await prisma.order.update({
      where: { id },
      data,
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
    });
  } catch (e: any) {
    throw new AppError('Order not found', 404);
  }

  // Emit socket event
  const io = req.app.get('io');
  io?.emit('order:updated', {
    ...order,
    status: String(order.status).replace(/_/g, '-'),
    total: Number(order.total),
    discountValue: order.discountValue !== null ? Number(order.discountValue) : null,
    items: (order as any).orderItems,
  });

  // Coerce Decimal fields to numbers for consistent test expectations
  const serialized: any = {
    ...order,
    status: String(order.status).replace(/_/g, '-'),
    total: Number(order.total),
    discountValue: order.discountValue !== null ? Number(order.discountValue) : null,
    items: (order as any).orderItems,
  };

  res.json({
    success: true,
    data: serialized,
    message: 'Order updated successfully',
  });
}));

// Delete order
router.delete('/:id', authenticate, authorize(UserRole.admin), validateParams(schemas.uuidParam), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Update table status
  await prisma.table.update({
    where: { number: order.tableNumber },
    data: {
      status: 'free',
      currentOrderId: null,
    },
  });

  // Emit socket event
  const io = req.app.get('io');
  io?.emit('order:deleted', { id });

  await prisma.order.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'Order deleted successfully',
  });
}));

// Update order status
router.patch('/:id/status', authenticate, authorize(UserRole.kitchen, UserRole.admin, UserRole.waiter), validateParams(schemas.uuidParam), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new AppError('Status is required', 400);
  }

  // Normalize status to match Prisma enum (e.g., in-progress -> preparing)
  const normalizedStatus = String(status).replace(/-/g, '_').replace('in_progress', 'preparing');
  const allowedStatuses = ['pending', 'preparing', 'ready', 'served', 'delivered', 'cancelled'];
  if (!allowedStatuses.includes(normalizedStatus)) {
    throw new AppError('Invalid status', 400);
  }

  // Update order status and its items in a transaction for consistency
  const [order] = await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: { status: normalizedStatus as any },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
    }),
    // If marking order as served, mark all items as served too
    ...(normalizedStatus === 'served' ? [
      prisma.orderItem.updateMany({
        where: {
          orderId: id,
          status: { notIn: ['cancelled'] }
        },
        data: { status: 'served' }
      })
    ] : [])
  ]);

  // If marking order as cancelled, free the table and clear its currentOrderId
  let tableUpdate: any = null;
  if (normalizedStatus === 'cancelled' && order.tableNumber) {
    tableUpdate = await prisma.table.update({
      where: { number: order.tableNumber },
      data: {
        status: 'free',
        currentOrderId: null
      }
    });
  }

  // Emit socket event
  const io = req.app.get('io');
  io?.emit('order:status-changed', {
    orderId: id,
    status: String(order.status).replace(/_/g, '-'),
    order: {
      ...order,
      status: String(order.status).replace(/_/g, '-'),
      total: Number(order.total),
      discountValue: order.discountValue !== null ? Number(order.discountValue) : null,
      items: (order as any).orderItems,
    },
    // If table was updated, broadcast that too
    table: tableUpdate ? {
      tableNumber: tableUpdate.number,
      status: tableUpdate.status,
      currentOrderId: tableUpdate.currentOrderId
    } : undefined
  });

  // If table was updated, also broadcast a specific table status-changed event for broader sync
  if (tableUpdate) {
    io?.emit('table:status-changed', {
      tableNumber: tableUpdate.number,
      status: tableUpdate.status,
      currentOrderId: null
    });
  }

  // NOTIFICATION LOGIC: If order is ready or cancelled (by kitchen), notify the waiter
  console.log(`[DEBUG] Checking notification logic. Status: ${normalizedStatus}, CreatedBy: ${order.createdBy}`);
  if ((normalizedStatus === 'ready' || normalizedStatus === 'cancelled') && order.createdBy) {
    try {
      console.log(`[DEBUG] Creating notification for user ${order.createdBy}`);
      // Create notification
      const notification = await prisma.notification.create({
        data: {
          type: normalizedStatus === 'ready' ? 'order' : 'alert',
          message: `Order #${order.orderNumber} for Table ${order.tableNumber} is ${normalizedStatus.toUpperCase()}`,
          userId: order.createdBy,
          read: false
        }
      });
      console.log('[DEBUG] Notification created:', notification.id);

      // Emit to specific user
      const io = req.app.get('io');
      console.log(`[DEBUG] Emitting notification:new to room ${order.createdBy}`);
      io?.to(order.createdBy).emit('notification:new', notification);
    } catch (error) {
      console.error('Failed to create notification:', error);
      // Don't fail the request if notification fails
    }
  }

  res.json({

    success: true,
    data: {
      ...order,
      status: String(order.status).replace(/_/g, '-'),
      total: Number(order.total),
      discountValue: order.discountValue !== null ? Number(order.discountValue) : null,
    },
    message: 'Order status updated successfully',
  });
}));

// ADD ITEMS TO ORDER
router.post('/:id/items', authenticate, authorize(UserRole.admin, UserRole.waiter), validate(schemas.addOrderItems), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { items } = req.body; // Array of { menuItemId, quantity, notes }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('Items are required', 400);
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new AppError('Order not found', 404);

  // Calculate additional total
  let additionalTotal = 0;
  for (const item of items) {
    const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
    if (!menuItem) throw new AppError(`Menu item ${item.menuItemId} not found`, 404);
    if (!menuItem.available) throw new AppError(`Menu item ${menuItem.name} is currently unavailable`, 400);
    additionalTotal += Number(menuItem.price) * item.quantity;
  }

  // Apply existing discount if applicable
  let finalAdditionalTotal = additionalTotal;
  if (order.discountType === 'percentage' && order.discountValue !== null) {
    const percentage = Math.max(0, Math.min(100, Number(order.discountValue)));
    finalAdditionalTotal = additionalTotal * (1 - percentage / 100);
  }

  // CHECK IF ORDER IS PAID - If so, create a NEW order
  if (order.isPaid) {
    const newOrder = await prisma.order.create({
      data: {
        tableNumber: order.tableNumber,
        createdBy: req.user!.id,
        total: finalAdditionalTotal,
        discountType: order.discountType,
        discountValue: order.discountValue,
        orderItems: {
          create: items.map((item: any) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            notes: item.notes,
          }))
        }
      },
      include: {
        orderItems: { include: { menuItem: true } }
      }
    });

    // Re-occupy the table with the new order
    if (order.tableNumber) {
      await prisma.table.update({
        where: { number: order.tableNumber },
        data: {
          status: 'occupied',
          currentOrderId: newOrder.id
        }
      });
    }

    // Calculate previous paid total for this table today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const prevPaid = await prisma.order.findMany({
      where: {
        tableNumber: order.tableNumber,
        isPaid: true,
        id: { not: newOrder.id },
        createdAt: { gte: today }
      },
      include: {
        orderItems: { include: { menuItem: true } }
      }
    });
    // Link to current order as parent using standard Prisma update
    await prisma.order.update({
      where: { id: newOrder.id },
      data: { parentOrderId: order.id }
    });

    // Recursively find all ancestors for the response
    const allAncestors: any[] = [];
    let currentAncestorId = order.id;

    while (currentAncestorId) {
      const currentAncestor = await prisma.order.findUnique({
        where: { id: currentAncestorId },
        include: {
          orderItems: { include: { menuItem: true } },
          paymentTransactions: true
        }
      });

      if (currentAncestor) {
        allAncestors.push(currentAncestor);
        currentAncestorId = currentAncestor.parentOrderId;
      } else {
        currentAncestorId = null;
      }
    }

    const totalPrevPaid = allAncestors.reduce((sum, o) => sum + Number(o.total), 0);

    // Emit socket event
    const io = req.app.get('io');
    io?.emit('order:created', {
      ...newOrder,
      status: String(newOrder.status).replace(/_/g, '-'),
      total: Number(newOrder.total),
      items: (newOrder as any).orderItems,
      previousPaidTotal: totalPrevPaid,
      previousOrders: allAncestors
    });

    return res.json({
      success: true,
      data: {
        ...newOrder,
        status: String(newOrder.status).replace(/_/g, '-'),
        total: Number(newOrder.total),
        items: (newOrder as any).orderItems,
        previousPaidTotal: totalPrevPaid,
        previousOrders: allAncestors
      },
      message: 'New order created and linked to previous one'
    });
  }

  const updatedOrder = await prisma.order.update({
    where: { id: id },
    data: {
      total: { increment: finalAdditionalTotal },
      status: (['served', 'ready', 'delivered'].includes(order.status)) ? 'pending' : undefined,
      orderItems: {
        create: items.map((item: any) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          notes: item.notes,
        }))
      }
    },
    include: {
      orderItems: { include: { menuItem: true } }
    }
  });

  // Fetch session history for the update event
  const sessionAncestors: any[] = [];
  let currentSessAncestorId = updatedOrder.parentOrderId;

  while (currentSessAncestorId) {
    const currentSessAncestor = await prisma.order.findUnique({
      where: { id: currentSessAncestorId },
      include: {
        orderItems: { include: { menuItem: true } },
        paymentTransactions: true
      }
    });

    if (currentSessAncestor) {
      sessionAncestors.push(currentSessAncestor);
      currentSessAncestorId = currentSessAncestor.parentOrderId;
    } else {
      currentSessAncestorId = null;
    }
  }

  const sessionPrevTotal = sessionAncestors.reduce((sum, o) => sum + Number(o.total), 0);

  // Emit events
  const io = req.app.get('io');
  io?.emit('order:updated', {
    ...updatedOrder,
    previousPaidTotal: sessionPrevTotal,
    previousOrders: sessionAncestors
  });

  // No additional socket emit needed here as io?.emit('order:updated', ...) was already called above.

  res.json({
    success: true,
    data: {
      ...updatedOrder,
      status: String(updatedOrder.status).replace(/_/g, '-'),
      total: Number(updatedOrder.total),
      items: (updatedOrder as any).orderItems,
      previousPaidTotal: sessionPrevTotal,
      previousOrders: sessionAncestors
    }
  });
}));

// UPDATE ITEM STATUS
router.patch('/:orderId/items/:itemId/status', authenticate, authorize(UserRole.kitchen, UserRole.admin, UserRole.waiter), asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;
  const { status } = req.body;

  if (!status) throw new AppError('Status is required', 400);
  const normalizedStatus = String(status).replace(/-/g, '_').replace('in_progress', 'preparing');

  const orderItem = await prisma.orderItem.update({
    where: { id: itemId },
    data: { status: normalizedStatus as any },
    include: { menuItem: true }
  });

  // Check if ALL items are now ready/served/cancelled
  const allItems = await prisma.orderItem.findMany({ where: { orderId } });
  const allReady = allItems.every(i => ['ready', 'served', 'cancelled'].includes(i.status as string));

  // Also get the full order to sync frontend
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: { include: { menuItem: true } } }
  });

  if (!order) throw new AppError('Order not found', 404);

  let updatedOrder = order; // Default to current state

  if (allReady && order.status !== 'ready' && order.status !== 'served') {
    // Auto-update order status to READY
    updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'ready' },
      include: { orderItems: { include: { menuItem: true } } }
    });

    // NOTIFICATION LOGIC (Copied from status update route)
    const io = req.app.get('io');
    if (updatedOrder.createdBy) {
      try {
        const notification = await prisma.notification.create({
          data: {
            type: 'order',
            message: `Order #${updatedOrder.orderNumber || '??'} for Table ${updatedOrder.tableNumber} is READY`,
            userId: updatedOrder.createdBy,
            read: false
          }
        });

        // Emit to specific user
        io?.to(updatedOrder.createdBy).emit('notification:new', notification);
      } catch (error) {
        console.error('Failed to create notification:', error);
      }
    }

    // Emit order status change event
    io?.emit('order:status-changed', {
      orderId,
      status: 'ready',
      order: {
        ...updatedOrder,
        status: String(updatedOrder.status).replace(/_/g, '-'),
        total: Number(updatedOrder.total),
        items: (updatedOrder as any).orderItems
      }
    });
  } else {
    // Just emit the item status update if not completing the order
    const io = req.app.get('io');
    io?.emit('order:item-status-updated', {
      orderId,
      itemId,
      status: normalizedStatus,
      order: updatedOrder
    });
  }

  res.json({
    success: true,
    data: updatedOrder,
    message: allReady ? 'Item updated & Order marked Ready' : 'Item status updated'
  });
}));

// REMOVE ITEM FROM ORDER
router.delete('/:orderId/items/:itemId', authenticate, authorize(UserRole.admin, UserRole.waiter), asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { menuItem: true }
  });

  if (!item) throw new AppError('Item not found', 404);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError('Order not found', 404);

  // Calculate reduction
  let reduction = Number(item.menuItem.price) * item.quantity;
  if (order.discountType === 'percentage' && order.discountValue !== null) {
    const percentage = Math.max(0, Math.min(100, Number(order.discountValue)));
    reduction = reduction * (1 - percentage / 100);
  }

  await prisma.orderItem.delete({ where: { id: itemId } });

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      total: { decrement: reduction }
    },
    include: { orderItems: { include: { menuItem: true } } }
  });

  // Emit socket event
  const io = req.app.get('io');
  io?.emit('order:updated', updatedOrder);

  // Pusher event removed

  res.json({
    success: true,
    data: updatedOrder,
    message: 'Item removed'
  });
}));

// UPDATE ITEM (quantity/notes)
router.put('/:orderId/items/:itemId', authenticate, authorize(UserRole.admin, UserRole.waiter), asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;
  const { quantity, notes } = req.body;

  const oldItem = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { menuItem: true }
  });

  if (!oldItem) throw new AppError('Item not found', 404);
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError('Order not found', 404);

  let totalDiff = 0;
  if (quantity !== undefined) {
    const price = Number(oldItem.menuItem.price);
    const diff = (quantity - oldItem.quantity) * price;
    totalDiff = diff;

    if (order.discountType === 'percentage' && order.discountValue !== null) {
      const percentage = Math.max(0, Math.min(100, Number(order.discountValue)));
      totalDiff = diff * (1 - percentage / 100);
    }
  }

  const updatedItem = await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      quantity: quantity !== undefined ? quantity : undefined,
      notes: notes !== undefined ? notes : undefined
    }
  });

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      total: { increment: totalDiff }
    },
    include: { orderItems: { include: { menuItem: true } } }
  });

  // Emit socket event
  const io = req.app.get('io');
  io?.emit('order:updated', updatedOrder);

  // No additional socket emit needed here as io?.emit('order:updated', ...) was already called above.

  res.json({
    success: true,
    data: updatedOrder,
    message: 'Item updated'
  });
}));

// SPLIT ORDER
router.post('/split', authenticate, authorize(UserRole.admin, UserRole.waiter), validate(schemas.splitOrder), asyncHandler(async (req, res) => {
  const { items, targetTableNumber } = req.body;

  const targetTable = await prisma.table.findUnique({ where: { number: targetTableNumber } });
  if (!targetTable || targetTable.status !== 'free') throw new AppError('Target table is not available', 400);

  // Create new order
  const firstItem = await prisma.orderItem.findUnique({ where: { id: items[0].itemId }, include: { order: true } });
  if (!firstItem) throw new AppError('Item not found', 404);

  const newOrder = await prisma.order.create({
    data: {
      tableNumber: targetTableNumber,
      createdBy: req.user!.id,
      total: 0, // Will calculate below
      status: firstItem.order.status
    }
  });

  let newTotal = 0;
  for (const splitItem of items) {
    const item = await prisma.orderItem.findUnique({ where: { id: splitItem.itemId }, include: { menuItem: true } });
    if (!item) continue;

    const price = Number(item.menuItem.price);
    const amount = price * splitItem.quantity;
    newTotal += amount;

    if (splitItem.quantity >= item.quantity) {
      // Move entire item
      await prisma.orderItem.update({
        where: { id: splitItem.itemId },
        data: { orderId: newOrder.id }
      });
    } else {
      // Split item
      await prisma.orderItem.create({
        data: {
          orderId: newOrder.id,
          menuItemId: item.menuItemId,
          quantity: splitItem.quantity,
          notes: item.notes,
          status: item.status
        }
      });
      await prisma.orderItem.update({
        where: { id: splitItem.itemId },
        data: { quantity: { decrement: splitItem.quantity } }
      });
    }
  }

  // Update new order total
  await prisma.order.update({
    where: { id: newOrder.id },
    data: { total: newTotal }
  });

  // Update old order total (re-calculate for simplicity)
  const oldOrder = await prisma.order.findUnique({
    where: { id: firstItem.orderId },
    include: { orderItems: { include: { menuItem: true } } }
  });
  if (oldOrder) {
    const oldTotal = oldOrder.orderItems.reduce((acc, it) => acc + Number(it.menuItem.price) * it.quantity, 0);
    await prisma.order.update({ where: { id: oldOrder.id }, data: { total: oldTotal } });
  }

  // Update target table
  await prisma.table.update({ where: { number: targetTableNumber }, data: { status: 'occupied', currentOrderId: newOrder.id } });

  res.json({ success: true, data: { newOrderId: newOrder.id }, message: 'Order split successfully' });
}));

// MERGE ORDER
router.post('/merge', authenticate, authorize(UserRole.admin, UserRole.waiter), validate(schemas.mergeOrder), asyncHandler(async (req, res) => {
  const { sourceTableNumber, targetTableNumber } = req.body;

  const sourceTable = await prisma.table.findUnique({ where: { number: sourceTableNumber } });
  const targetTable = await prisma.table.findUnique({ where: { number: targetTableNumber } });

  if (!sourceTable || !sourceTable.currentOrderId) throw new AppError('Source table has no active order', 400);
  if (!targetTable || !targetTable.currentOrderId) throw new AppError('Target table has no active order', 400);

  const sourceId = sourceTable.currentOrderId;
  const targetId = targetTable.currentOrderId;

  // Move all items from source to target
  await prisma.orderItem.updateMany({
    where: { orderId: sourceId },
    data: { orderId: targetId }
  });

  // Re-calculate target order total
  const targetOrder = await prisma.order.findUnique({
    where: { id: targetId },
    include: { orderItems: { include: { menuItem: true } } }
  });
  if (targetOrder) {
    const newTotal = targetOrder.orderItems.reduce((acc, it) => acc + Number(it.menuItem.price) * it.quantity, 0);
    await prisma.order.update({ where: { id: targetId }, data: { total: newTotal } });
  }

  // Delete source order and free table
  await prisma.order.delete({ where: { id: sourceId } });
  await prisma.table.update({
    where: { number: sourceTableNumber },
    data: { status: 'free', currentOrderId: null }
  });

  res.json({ success: true, message: 'Orders merged successfully' });
}));

// HOLD ORDER
router.post('/:id/hold', authenticate, authorize(UserRole.admin, UserRole.waiter), validate(schemas.holdOrder), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { hold } = req.body;

  await prisma.order.update({
    where: { id },
    data: { holdStatus: hold }
  });

  res.json({ success: true, message: `Order ${hold ? 'put on hold' : 'released from hold'}` });
}));

export default router;
