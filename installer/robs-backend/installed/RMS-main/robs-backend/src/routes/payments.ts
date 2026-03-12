import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { validate, schemas } from '@/middleware/validation';
import { asyncHandler, AppError } from '@/middleware/errorHandler';
import prisma from '@/utils/database';
import { UserRole } from '@/types';
// Pusher removed in favor of Socket.io

const router = Router();

// Pay for an order
router.post('/:orderId/pay', authenticate, validate(schemas.payOrder), asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { amount, method, transactionId } = req.body;

    const order = await prisma.order.findUnique({
        where: { id: orderId }
    });

    if (!order) throw new AppError('Order not found', 404);
    if (order.isPaid) throw new AppError('Order is already paid', 400);

    // Create payment transaction
    const transaction = await prisma.payment_transactions.create({
        data: {
            orderId,
            amount,
            method,
            status: 'completed',
            transactionId
        }
    });

    // Update order status - mark as paid and free the table
    const updatedOrder = await prisma.$transaction(async (tx) => {
        const order = await tx.order.update({
            where: { id: orderId },
            data: {
                isPaid: true,
                paymentMethod: method
            },
            include: { orderItems: { include: { menuItem: true } } }
        });

        if (order.tableNumber) {
            const table = await tx.table.findUnique({
                where: { number: order.tableNumber }
            });

            if (table?.groupId) {
                // Free all tables in the group
                await tx.table.updateMany({
                    where: { groupId: table.groupId },
                    data: {
                        status: 'free',
                        currentOrderId: null
                    }
                });

                // Emit socket event for all tables in the group
                const io = req.app.get('io');
                const groupTables = await tx.table.findMany({
                    where: { groupId: table.groupId }
                });

                for (const gt of groupTables) {
                    io?.emit('table:status-changed', {
                        tableNumber: gt.number,
                        status: 'free',
                        currentOrderId: null,
                        groupId: null,
                        isPrimary: false
                    });
                }
            } else {
                await tx.table.update({
                    where: { number: order.tableNumber },
                    data: {
                        status: 'free',
                        currentOrderId: null
                    }
                });
            }
        }

        return order;
    });

    // Update daily sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const amountNum = Number(amount);
    await prisma.dailySales.upsert({
        where: { date: today },
        update: {
            totalSales: { increment: amountNum },
            totalOrders: { increment: 1 }
        },
        create: {
            date: today,
            totalSales: amountNum,
            totalOrders: 1,
            averageOrderValue: amountNum
        }
    });

    // Re-calculate average order value
    const salesRecord = await prisma.dailySales.findUnique({ where: { date: today } });
    if (salesRecord && salesRecord.totalOrders > 0) {
        await prisma.dailySales.update({
            where: { date: today },
            data: {
                averageOrderValue: Number(salesRecord.totalSales) / salesRecord.totalOrders
            }
        });
    }

    // Standardize order for frontend compatibility
    const standardizedOrder = {
        ...updatedOrder,
        status: String(updatedOrder.status).replace(/_/g, '-'),
        total: Number(updatedOrder.total),
        items: (updatedOrder as any).orderItems,
    };

    // Emit socket event
    const io = req.app.get('io');
    io?.emit('order:paid', standardizedOrder);
    // Table status is NOT changed here anymore

    res.json({
        success: true,
        data: { order: standardizedOrder, transaction },
        message: 'Payment processed successfully'

    });
}));

// Refund a transaction
router.post('/:transactionId/refund', authenticate, authorize(UserRole.admin), validate(schemas.refundTransaction), asyncHandler(async (req, res) => {
    const { transactionId } = req.params;

    const transaction = await prisma.payment_transactions.findUnique({
        where: { id: transactionId }
    });

    if (!transaction) throw new AppError('Transaction not found', 404);

    const updatedTransaction = await prisma.payment_transactions.update({
        where: { id: transactionId },
        data: { status: 'refunded' }
    });

    res.json({
        success: true,
        data: updatedTransaction,

        message: 'Transaction refunded successfully'
    });
}));

export default router;
