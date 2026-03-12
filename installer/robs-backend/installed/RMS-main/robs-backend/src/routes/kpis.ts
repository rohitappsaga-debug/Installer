import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import prisma from '@/utils/database';
import { UserRole } from '@/types';

const router = Router();

// Get audit logs
router.get('/', authenticate, authorize(UserRole.admin), asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
        prisma.activity_logs.findMany({
            skip,
            take: Number(limit),
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, role: true } } }
        }),
        prisma.activity_logs.count()
    ]);

    res.json({
        success: true,
        data: logs,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
        }
    });
}));

export default router;
