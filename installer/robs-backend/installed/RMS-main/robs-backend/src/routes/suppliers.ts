import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { validate, validateParams, schemas } from '@/middleware/validation';
import { asyncHandler, AppError } from '@/middleware/errorHandler';
import prisma from '@/utils/database';
import { UserRole } from '@/types';

const router = Router();

// --- Suppliers ---

// Get all suppliers
router.get('/', authenticate, authorize(UserRole.admin, UserRole.manager), asyncHandler(async (req, res) => {
    const suppliers = await prisma.suppliers.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { purchase_orders: true } } }
    });
    res.json({ success: true, data: suppliers });
}));

// Create supplier
router.post('/', authenticate, authorize(UserRole.admin, UserRole.manager), validate(schemas.createSupplier), asyncHandler(async (req, res) => {
    const supplier = await prisma.suppliers.create({ data: req.body });
    res.status(201).json({ success: true, data: supplier });
}));

// Update supplier
router.put('/:id', authenticate, authorize(UserRole.admin, UserRole.manager), validateParams(schemas.uuidParam), validate(schemas.updateSupplier), asyncHandler(async (req, res) => {
    const supplier = await prisma.suppliers.update({
        where: { id: req.params.id },
        data: req.body
    });
    res.json({ success: true, data: supplier });
}));

// Delete supplier
router.delete('/:id', authenticate, authorize(UserRole.admin), validateParams(schemas.uuidParam), asyncHandler(async (req, res) => {
    await prisma.suppliers.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Supplier deleted' });
}));

// --- Purchase Orders ---

// Get POs
router.get('/orders', authenticate, authorize(UserRole.admin, UserRole.manager), asyncHandler(async (req, res) => {
    const pos = await prisma.purchase_orders.findMany({
        include: { suppliers: true, purchase_order_items: { include: { ingredients: true } } },
        orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: pos });
}));

// Create PO
router.post('/orders', authenticate, authorize(UserRole.admin, UserRole.manager), validate(schemas.createPO), asyncHandler(async (req, res) => {
    const { supplierId, items } = req.body; // items: [{ ingredientId, quantity, unitCost }]

    const result = await prisma.$transaction(async (tx) => {
        let totalCost = 0;
        const poItems = [];

        for (const item of items) {
            const cost = Number(item.quantity) * Number(item.unitCost);
            totalCost += cost;
            poItems.push({
                ingredientId: item.ingredientId,
                quantity: item.quantity,
                unitCost: item.unitCost
            });
        }

        const po = await tx.purchase_orders.create({
            data: {
                supplierId,
                totalCost,
                status: 'pending',
                purchase_order_items: { create: poItems }
            },
            include: { purchase_order_items: true }
        });

        // Log activity
        await tx.activity_logs.create({
            data: {
                userId: req.user!.id,
                action: 'Created Purchase Order',
                details: `PO ${po.id} for Supplier ${supplierId}. Total: ${totalCost}`
            }
        });

        return po;
    });

    res.status(201).json({ success: true, data: result });
}));

// Receive PO
router.post('/orders/:id/receive', authenticate, authorize(UserRole.admin, UserRole.manager), validateParams(schemas.uuidParam), asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await prisma.$transaction(async (tx) => {
        const po = await tx.purchase_orders.findUnique({
            where: { id },
            include: { purchase_order_items: true }
        });

        if (!po) throw new AppError('PO not found', 404);
        if (po.status !== 'pending') throw new AppError('PO already processed', 400);

        // Update items stock
        for (const item of po.purchase_order_items) {
            await tx.ingredients.update({
                where: { id: item.ingredientId },
                data: { stock: { increment: item.quantity } }
            });
        }

        const updatedPo = await tx.purchase_orders.update({
            where: { id },
            data: { status: 'received' }
        });

        // Log activity
        await tx.activity_logs.create({
            data: {
                userId: req.user!.id,
                action: 'Received Purchase Order',
                details: `PO ${id} received. Stock updated.`
            }
        });

        return updatedPo;
    });

    res.json({ success: true, data: result });
}));

export default router;
