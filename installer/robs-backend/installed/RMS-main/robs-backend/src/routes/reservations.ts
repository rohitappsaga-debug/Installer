import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { validate, validateQuery, validateParams, schemas } from '@/middleware/validation';
import { asyncHandler, AppError } from '@/middleware/errorHandler';
import prisma from '@/utils/database';
import { UserRole } from '@/types';

const router = Router();

// Get all reservations
router.get('/', authenticate, validateQuery(schemas.reservationQuery), asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, tableNumber, date } = req.query as any;
    const numericPage = Number(page) || 1;
    const numericLimit = Number(limit) || 10;
    const skip = (numericPage - 1) * numericLimit;

    const where: any = {};
    if (status) where.status = status;
    if (tableNumber) where.tableNumber = Number(tableNumber);
    if (date) where.date = new Date(date);

    const [reservations, total] = await Promise.all([
        prisma.reservation.findMany({
            where,
            skip,
            take: numericLimit,
            orderBy: { date: 'asc' },
            include: { table: true }
        }),
        prisma.reservation.count({ where }),
    ]);

    res.json({
        success: true,
        data: reservations,
        pagination: {
            page: numericPage,
            limit: numericLimit,
            total,
            totalPages: Math.ceil(total / numericLimit),
        },
    });
}));

// Create a new reservation
router.post('/', authenticate, validate(schemas.createReservation), asyncHandler(async (req, res) => {
    const { tableNumber, customerName, customerPhone, date, startTime, endTime } = req.body;

    // Check if table exists
    const table = await prisma.table.findUnique({
        where: { number: tableNumber },
    });

    if (!table) {
        throw new AppError('Table not found', 404);
    }

    // Check for overlapping reservations
    const overlapping = await prisma.reservation.findFirst({
        where: {
            tableNumber,
            date: new Date(date),
            status: 'pending',
            OR: [
                {
                    AND: [
                        { startTime: { lte: startTime } },
                        { endTime: { gt: startTime } }
                    ]
                },
                {
                    AND: [
                        { startTime: { lt: endTime } },
                        { endTime: { gte: endTime } }
                    ]
                },
                {
                    AND: [
                        { startTime: { gte: startTime } },
                        { endTime: { lte: endTime } }
                    ]
                }
            ]
        }
    });

    if (overlapping) {
        throw new AppError('This table is already reserved for the selected time slot', 400);
    }

    const reservation = await prisma.reservation.create({
        data: {
            tableNumber,
            customerName,
            customerPhone,
            date: new Date(date),
            startTime,
            endTime,
            status: 'pending'
        },
    });

    // If for today, update table metadata and emit socket
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const resDateStr = new Date(date).toISOString().split('T')[0];

    if (todayStr === resDateStr) {
        // If the table is currently free, we can show this as the "upcoming" reservation
        // Or if it's already reserved, we keep the most urgent one (handled by background task)
        // For better UX, let's update the table metadata regardless if it's free
        if (table.status === 'free') {
            await prisma.table.update({
                where: { number: tableNumber },
                data: {
                    reservedBy: customerName,
                    reservedTime: new Date(`${date}T${startTime}`)
                }
            });

            // Emit socket event for real-time update
            const io = req.app.get('io');
            io?.emit('table:status-changed', {
                tableNumber,
                status: 'free', // Status stays free, but metadata updated
                reservedBy: customerName,
                reservedTime: new Date(`${date}T${startTime}`)
            });
        }
    }

    // Log activity
    await prisma.activity_logs.create({
        data: {
            userId: (req as any).user.id,
            action: 'RESERVATION_CREATED',
            details: `Reservation created for Table ${tableNumber} on ${date} at ${startTime}`
        }
    });

    res.status(201).json({
        success: true,
        data: reservation,
        message: 'Reservation created successfully',
    });
}));

// Check-in to a reservation
router.patch('/:id/check-in', authenticate, authorize(UserRole.admin, UserRole.waiter), validateParams(schemas.uuidParam), asyncHandler(async (req, res) => {
    const { id } = req.params;

    const reservation = await prisma.reservation.findUnique({
        where: { id },
    });

    if (!reservation) {
        throw new AppError('Reservation not found', 404);
    }

    if (reservation.status !== 'pending') {
        throw new AppError(`Reservation is already ${reservation.status}`, 400);
    }

    // Check if table is already occupied
    const table = await prisma.table.findUnique({
        where: { number: reservation.tableNumber },
    });

    if (table?.status === 'occupied') {
        throw new AppError('Table is already occupied', 400);
    }

    // Update reservation and table status
    const [updatedReservation] = await prisma.$transaction([
        prisma.reservation.update({
            where: { id },
            data: { status: 'checked_in' }
        }),
        prisma.table.update({
            where: { number: reservation.tableNumber },
            data: { status: 'occupied' }
        })
    ]);

    // Log activity
    await prisma.activity_logs.create({
        data: {
            userId: (req as any).user.id,
            action: 'RESERVATION_CHECKIN',
            details: `Guest checked in for Table ${reservation.tableNumber}`
        }
    });

    res.json({
        success: true,
        data: updatedReservation,
        message: 'Checked in successfully',
    });
}));

// Cancel a reservation
router.delete('/:id', authenticate, authorize(UserRole.admin), validateParams(schemas.uuidParam), asyncHandler(async (req, res) => {
    const { id } = req.params;

    const reservation = await prisma.reservation.findUnique({
        where: { id },
    });

    if (!reservation) {
        throw new AppError('Reservation not found', 404);
    }

    // Cancel the reservation
    await prisma.reservation.update({
        where: { id },
        data: { status: 'cancelled' }
    });

    // Check if the table currently has this reservation metadata
    const table = await prisma.table.findUnique({
        where: { number: reservation.tableNumber }
    });

    if (table && table.reservedBy === reservation.customerName) {
        // Clear metadata and set status to free if it was marked as reserved
        const newStatus = table.status === 'reserved' ? 'free' : table.status;

        await prisma.table.update({
            where: { number: reservation.tableNumber },
            data: {
                status: newStatus,
                reservedBy: null,
                reservedTime: null
            }
        });

        // Broadcast the update via Socket.io
        const io = req.app.get('io');
        io?.emit('table:status-changed', {
            tableNumber: reservation.tableNumber,
            status: newStatus,
            reservedBy: null,
            reservedTime: null
        });
    }

    // Log activity
    await prisma.activity_logs.create({
        data: {
            userId: (req as any).user.id,
            action: 'RESERVATION_CANCELLED',
            details: `Reservation for Table ${reservation.tableNumber} cancelled by Admin`
        }
    });

    res.json({
        success: true,
        message: 'Reservation cancelled successfully',
    });
}));

export default router;
