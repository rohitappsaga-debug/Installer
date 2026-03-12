import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { validate, validateParams, schemas } from '@/middleware/validation';
import { asyncHandler, AppError } from '@/middleware/errorHandler';
import prisma from '@/utils/database';
import { UserRole } from '@/types';

const router = Router();

// Get all ingredients
router.get('/', authenticate, authorize(UserRole.admin, UserRole.manager, UserRole.kitchen), asyncHandler(async (req, res) => {
    const ingredients = await prisma.ingredients.findMany({
        orderBy: { name: 'asc' },
    });

    res.json({
        success: true,
        data: ingredients.map((i: any) => ({
            ...i,
            stock: Number(i.stock),
            minLevel: Number(i.minLevel)
        })),
    });
}));

// Create ingredient
router.post('/', authenticate, authorize(UserRole.admin, UserRole.manager), validate(schemas.createIngredient), asyncHandler(async (req, res) => {
    const { name, unit, stock, minLevel } = req.body;

    const exists = await prisma.ingredients.findUnique({ where: { name } });
    if (exists) throw new AppError('Ingredient with this name already exists', 400);

    const ingredient = await prisma.ingredients.create({
        data: { name, unit, stock, minLevel },
    });

    res.status(201).json({
        success: true,
        data: {
            ...ingredient,
            stock: Number(ingredient.stock),
            minLevel: Number(ingredient.minLevel)
        },
        message: 'Ingredient created successfully',
    });
}));

// Update ingredient
router.put('/:id', authenticate, authorize(UserRole.admin, UserRole.manager), validateParams(schemas.uuidParam), validate(schemas.updateIngredient), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    try {
        const ingredient = await prisma.ingredients.update({
            where: { id },
            data,
        });

        res.json({
            success: true,
            data: {
                ...ingredient,
                stock: Number(ingredient.stock),
                minLevel: Number(ingredient.minLevel)
            },
            message: 'Ingredient updated successfully',
        });
    } catch (e: any) {
        if (e.code === 'P2025') throw new AppError('Ingredient not found', 404);
        throw e;
    }
}));

// Delete ingredient
router.delete('/:id', authenticate, authorize(UserRole.admin), validateParams(schemas.uuidParam), asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.ingredients.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Ingredient deleted successfully',
        });
    } catch (e: any) {
        if (e.code === 'P2025') throw new AppError('Ingredient not found', 404);
        // Check for foreign key constraints? 
        // Logic: If used in recipe (Recipe model links ingredientId), delete might fail or cascade?
        // Prisma schema usually restricts or cascades.
        // If restrict: P2003 Foreign key constraint failed.
        if (e.code === 'P2003') throw new AppError('Cannot delete ingredient as it is being used in recipes', 400);
        throw e;
    }
}));


// Adjust stock (Manual)
router.post('/:id/adjust', authenticate, authorize(UserRole.admin, UserRole.manager, UserRole.kitchen), validateParams(schemas.uuidParam), validate(schemas.adjustStock), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity, type } = req.body;

    // Use transaction to ensure atomicity and revert if stock goes negative
    const updated = await prisma.$transaction(async (tx) => {
        const ingredient = await tx.ingredients.findUnique({ where: { id } });
        if (!ingredient) throw new AppError('Ingredient not found', 404);

        let updateData: any;
        const numQuantity = Number(quantity);

        if (type === 'restock' || type === 'correction') {
            // Assuming correction is an addition/adjustment. 
            // If valid input can be negative for correction, we should handle that, 
            // but schema likely asks for positive quantity.
            // We'll treat 'correction' as additive based on previous logic (newStock += quantity).
            updateData = { stock: { increment: numQuantity } };
        } else if (type === 'wastage') {
            updateData = { stock: { decrement: numQuantity } };
        } else {
            // Fallback (though validation schema likely catches this)
            throw new AppError('Invalid adjustment type', 400);
        }

        const result = await tx.ingredients.update({
            where: { id },
            data: updateData
        });

        if (Number(result.stock) < 0) {
            throw new AppError('Stock cannot be negative', 400);
        }

        return result;
    });

    res.json({
        success: true,
        data: {
            ...updated,
            stock: Number(updated.stock),
            minLevel: Number(updated.minLevel)
        },
        message: 'Stock adjusted successfully',
    });
}));

export default router;
