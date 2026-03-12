import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { validateQuery, schemas } from '@/middleware/validation';
import { asyncHandler, AppError } from '@/middleware/errorHandler';
import prisma from '@/utils/database';
import { UserRole } from '@/types';

const router = Router();

// Get daily sales report (Admin only)
router.get('/daily', authenticate, authorize(UserRole.admin), validateQuery(schemas.pagination), asyncHandler(async (req, res) => {
  const { page = 1, limit = 30 } = req.query as any;
  const skip = (page - 1) * limit;

  const [dailySales, total] = await Promise.all([
    prisma.dailySales.findMany({
      skip,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.dailySales.count(),
  ]);

  res.json({
    success: true,
    data: dailySales,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}));

// Get sales report by date range (Admin only)
router.get('/range', authenticate, authorize(UserRole.admin), asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query as any;

  if (!startDate || !endDate) {
    throw new AppError('Start date and end date are required', 400);
  }

  const dailySales = await prisma.dailySales.findMany({
    where: {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    orderBy: { date: 'asc' },
  });

  // Calculate totals
  const totals = dailySales.reduce(
    (acc, day) => ({
      totalSales: acc.totalSales + Number(day.totalSales),
      totalOrders: acc.totalOrders + day.totalOrders,
    }),
    { totalSales: 0, totalOrders: 0 }
  );

  const averageOrderValue = totals.totalOrders > 0 ? Number(totals.totalSales) / totals.totalOrders : 0;

  res.json({
    success: true,
    data: {
      dailySales,
      summary: {
        ...totals,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        daysCount: dailySales.length,
      },
    },
  });
}));

// Get top selling items (Admin only)
router.get('/top-items', authenticate, authorize(UserRole.admin), asyncHandler(async (req, res) => {
  const { limit = 10, startDate, endDate } = req.query as any;

  const whereClause: any = {};
  
  if (startDate && endDate) {
    whereClause.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const topItems = await prisma.orderItem.groupBy({
    by: ['menuItemId'],
    where: {
      order: whereClause,
    },
    _sum: {
      quantity: true,
    },
    _count: {
      id: true,
    },
    orderBy: {
      _sum: {
        quantity: 'desc',
      },
    },
    take: parseInt(limit),
  });

  // Get menu item details
  const menuItemIds = topItems.map(item => item.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds } },
    select: {
      id: true,
      name: true,
      category: true,
      price: true,
    },
  });

  // Combine data
  const result = topItems.map(item => {
    const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
    return {
      menuItem,
      totalQuantity: item._sum.quantity || 0,
      totalOrders: item._count.id,
      totalRevenue: (item._sum.quantity || 0) * Number(menuItem?.price || 0),
    };
  });

  res.json({
    success: true,
    data: result,
  });
}));

// Get sales summary (Admin only)
router.get('/summary', authenticate, authorize(UserRole.admin), asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Today's sales
  const todaySales = await prisma.dailySales.findUnique({
    where: { date: startOfDay },
  });

  // This week's sales
  const weekSales = await prisma.dailySales.aggregate({
    where: {
      date: { gte: startOfWeek },
    },
    _sum: {
      totalSales: true,
      totalOrders: true,
    },
    _count: {
      id: true,
    },
  });

  // This month's sales
  const monthSales = await prisma.dailySales.aggregate({
    where: {
      date: { gte: startOfMonth },
    },
    _sum: {
      totalSales: true,
      totalOrders: true,
    },
    _count: {
      id: true,
    },
  });

  // Active tables
  const activeTables = await prisma.table.count({
    where: { status: 'occupied' },
  });

  // Total tables
  const totalTables = await prisma.table.count();

  // Pending orders
  const pendingOrders = await prisma.order.count({
    where: { status: 'pending' },
  });

  res.json({
    success: true,
    data: {
      today: {
        sales: Number(todaySales?.totalSales || 0),
        orders: todaySales?.totalOrders || 0,
        averageOrderValue: todaySales?.averageOrderValue || 0,
      },
      week: {
        sales: Number(weekSales._sum.totalSales || 0),
        orders: weekSales._sum.totalOrders || 0,
        days: weekSales._count.id,
        averageOrderValue: weekSales._sum.totalOrders ? Number(weekSales._sum.totalSales || 0) / weekSales._sum.totalOrders : 0,
      },
      month: {
        sales: Number(monthSales._sum.totalSales || 0),
        orders: monthSales._sum.totalOrders || 0,
        days: monthSales._count.id,
        averageOrderValue: monthSales._sum.totalOrders ? Number(monthSales._sum.totalSales || 0) / monthSales._sum.totalOrders : 0,
      },
      tables: {
        active: activeTables,
        total: totalTables,
        occupancyRate: totalTables > 0 ? (activeTables / totalTables) * 100 : 0,
      },
      orders: {
        pending: pendingOrders,
      },
    },
  });
}));

export default router;
