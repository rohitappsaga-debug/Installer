import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { validate, validateParams, schemas } from '@/middleware/validation';
import { asyncHandler, AppError } from '@/middleware/errorHandler';
import prisma from '@/utils/database';
import { UserRole } from '@/types';

const router = Router();

// Get all categories with auto-sync of legacy data
router.get('/', authenticate, asyncHandler(async (req, res) => {
    // 1. Fetch current category records
    const existingCategories = await prisma.categories.findMany({
        select: { name: true }
    });
    const existingNames = new Set(existingCategories.map(c => c.name));

    // 2. Fetch distinct categories from menu items (legacy strings)
    const menuItems = await prisma.menuItem.findMany({
        distinct: ['category'],
        select: { category: true }
    });

    // 3. Identify missing categories
    const missingCategories = menuItems
        .map(item => item.category)
        .filter(catName => catName && !existingNames.has(catName));

    // 4. Create missing categories if any
    if (missingCategories.length > 0) {
        await prisma.categories.createMany({
            data: missingCategories.map(name => ({
                name,
                description: 'Imported from legacy menu items',
                isActive: true
            })),
            skipDuplicates: true
        });
    }

    // 5. Critical Linkage: Ensure ALL menu items are linked to their category records by name
    const allCategories = await prisma.categories.findMany({ select: { id: true, name: true } });

    for (const cat of allCategories) {
        await prisma.menuItem.updateMany({
            where: {
                category: cat.name,
                OR: [
                    { categoryId: null },
                    { categoryId: { not: cat.id } }
                ]
            },
            data: { categoryId: cat.id }
        });
    }

    // 6. Return full list
    const categories = await prisma.categories.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: { menuItems: true }
            }
        }
    });

    res.json({
        success: true,
        data: categories
    });
}));

// Create category (Admin only)
router.post('/', authenticate, authorize(UserRole.admin), validate(schemas.createCategory), asyncHandler(async (req, res) => {
    const { name } = req.body;

    const existing = await prisma.categories.findUnique({
        where: { name }
    });

    if (existing) {
        throw new AppError('Category already exists', 400);
    }

    const category = await prisma.categories.create({
        data: req.body
    });

    res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully'
    });
}));

// Bulk create categories (Admin only)
router.post('/bulk', authenticate, authorize(UserRole.admin), validate(schemas.bulkCreateCategory), asyncHandler(async (req, res) => {
    const { categories } = req.body;

    // Check for duplicates in input
    const names = categories.map((c: any) => c.name);
    const uniqueNames = new Set(names);
    if (uniqueNames.size !== names.length) {
        throw new AppError('Duplicate category names in request', 400);
    }

    // Check if any category names already exist in DB
    const existingCategories = await prisma.categories.findMany({
        where: {
            name: { in: names }
        },
        select: { name: true }
    });

    if (existingCategories.length > 0) {
        const existingNames = existingCategories.map(c => c.name).join(', ');
        throw new AppError(`Categories with names ${existingNames} already exist`, 400);
    }

    // Creation
    const created = await prisma.categories.createMany({
        data: categories.map((c: any) => ({
            name: c.name,
            description: c.description || '',
            isActive: c.isActive !== undefined ? c.isActive : true
        })),
        skipDuplicates: true
    });

    res.status(201).json({
        success: true,
        data: created,
        message: `${created.count} categories created successfully`
    });
}));

// Update category (Admin only)
router.put('/:id', authenticate, authorize(UserRole.admin), validateParams(schemas.uuidParam), validate(schemas.updateCategory), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (name) {
        const existing = await prisma.categories.findUnique({
            where: { name }
        });
        if (existing && existing.id !== id) {
            throw new AppError('Category with this name already exists', 400);
        }
    }

    const category = await prisma.categories.update({
        where: { id },
        data: req.body
    });

    res.json({
        success: true,
        data: category,
        message: 'Category updated successfully'
    });
}));

// Delete category (Admin only)
router.delete('/:id', authenticate, authorize(UserRole.admin), validateParams(schemas.uuidParam), asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if items use this category
    const itemsCount = await prisma.menuItem.count({
        where: { categoryId: id }
    });

    if (itemsCount > 0) {
        throw new AppError('Cannot delete category with associated menu items. Reassign them first.', 400);
    }

    await prisma.categories.delete({
        where: { id }
    });

    res.json({
        success: true,
        message: 'Category deleted successfully'
    });
}));

export default router;
