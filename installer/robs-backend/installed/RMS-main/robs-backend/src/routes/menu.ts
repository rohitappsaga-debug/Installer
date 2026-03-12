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
 * /api/menu:
 *   get:
 *     summary: Get all menu items
 *     description: Retrieve a paginated list of menu items with optional filtering
 *     tags: [Menu]
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
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *         description: Filter by availability
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name and description
 *     responses:
 *       200:
 *         description: Menu items retrieved successfully
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
 *                     $ref: '#/components/schemas/MenuItem'
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
router.get('/', authenticate, validateQuery(schemas.menuQuery), asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, categoryId, available, search } = req.query as any;
  const numericPage = Number(page) || 1;
  const numericLimit = Number(limit) || 10;
  const skip = (numericPage - 1) * numericLimit;

  const where: any = {};

  if (category) where.category = category;
  if (categoryId) where.categoryId = categoryId;
  if (available !== undefined) where.available = available === 'true';
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [menuItems, total] = await Promise.all([
    prisma.menuItem.findMany({
      where,
      skip,
      take: numericLimit,
      orderBy: { name: 'asc' },
      include: { categories: true }
    }),
    prisma.menuItem.count({ where }),
  ]);

  res.json({
    success: true,
    data: menuItems,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      totalPages: Math.ceil(total / numericLimit),
    },
  });
}));

// Get all categories (Proactive sync)
router.get('/categories/list', authenticate, asyncHandler(async (req, res) => {
  // 1. Get unique categories from menu items
  const menuCategories = await prisma.menuItem.findMany({
    select: { category: true },
    distinct: ['category'],
  });
  const categoryNames = menuCategories.map(c => c.category);

  // 2. Proactively ensure these exist in the categories table
  if (categoryNames.length > 0) {
    await prisma.categories.createMany({
      data: categoryNames.map(name => ({
        name,
        description: `Auto-generated category for ${name}`,
        isActive: true
      })),
      skipDuplicates: true,
    });
  }

  // 3. Get all categories from Categories table to return metadata (like IDs)
  const allCategories = await prisma.categories.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  });

  res.json({
    success: true,
    data: allCategories.map(c => c.name), // Keep backward compatibility
    categories: allCategories // Provide full objects for newer UI logic
  });
}));

// Get menu item by ID
router.get('/:id', authenticate, validateParams(schemas.uuidParam), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const menuItem = await prisma.menuItem.findUnique({
    where: { id },
    include: {
      categories: true,
      recipes: {
        include: {
          ingredients: true
        }
      },
      menuItemModifiers: true
    }
  });

  if (!menuItem) {
    throw new AppError('Menu item not found', 404);
  }

  res.json({
    success: true,
    data: menuItem,
  });
}));



// Create menu item (Admin only)
router.post('/', authenticate, authorize(UserRole.admin), validate(schemas.createMenuItem), asyncHandler(async (req, res) => {
  const { categoryId, category, ...rest } = req.body;
  let finalCategoryName = category;

  if (categoryId) {
    const cat = await prisma.categories.findUnique({ where: { id: categoryId } });
    if (!cat) throw new AppError('Invalid category ID', 400);
    finalCategoryName = cat.name;
  }

  const created = await prisma.menuItem.create({
    data: {
      ...rest,
      category: finalCategoryName, // Legacy support
      categoryId: categoryId || undefined
    },
  });

  res.status(201).json({
    success: true,
    data: { ...created, price: Number(created.price) },
    message: 'Menu item created successfully',
  });
}));

// Update menu item (Admin only)
router.put('/:id', authenticate, authorize(UserRole.admin), validateParams(schemas.uuidParam), validate(schemas.updateMenuItem), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { categoryId, category, ...rest } = req.body;

  const data: any = { ...rest };

  if (categoryId) {
    const cat = await prisma.categories.findUnique({ where: { id: categoryId } });
    if (!cat) throw new AppError('Invalid category ID', 400);
    data.categoryId = categoryId;
    data.categories = cat.name; // Keep synced
  } else if (category) {
    data.categories = category;
    // If only category name provided, try to find ID? 
    // Maybe better to just leave categoryId as is or null?
    // Let's look it up reverse map if possible, but names might duplicate.
    // For now, if categoryId not sent, we don't change categoryId unless we want to reset it?
    // If client sends ONLY category string, we might desync. 
    // But frontend will be updated to send categoryId.
    const cat = await prisma.categories.findUnique({ where: { name: category } });
    if (cat) data.categoryId = cat.id;
  }

  const menuItem = await prisma.menuItem.update({
    where: { id },
    data,
  });

  res.json({
    success: true,
    data: { ...menuItem, price: Number(menuItem.price) },
    message: 'Menu item updated successfully',
  });

}));

// Delete menu item (Admin only)
router.delete('/:id', authenticate, authorize(UserRole.admin), validateParams(schemas.uuidParam), asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.menuItem.delete({
      where: { id },
    });
    res.json({
      success: true,
      message: 'Menu item deleted successfully',
    });
  } catch (e: any) {
    // Record not found
    throw new AppError('Menu item not found', 404);
  }
}));

// Toggle menu item availability
router.patch('/:id/availability', authenticate, authorize(UserRole.admin, UserRole.kitchen), validateParams(schemas.uuidParam), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const menuItem = await prisma.menuItem.findUnique({
    where: { id },
  });

  if (!menuItem) {
    throw new AppError('Menu item not found', 404);
  }

  const updatedMenuItem = await prisma.menuItem.update({
    where: { id },
    data: { available: !menuItem.available },
  });

  // Broadcast the change via Socket.io
  const io = req.app.get('io');
  io?.emit('menu:item-updated', updatedMenuItem);

  res.json({
    success: true,
    data: updatedMenuItem,
    message: `Menu item ${updatedMenuItem.available ? 'enabled' : 'disabled'} successfully`,
  });
}));




// Add recipe to menu item (Admin/Manager)
router.post('/:id/recipe', authenticate, authorize(UserRole.admin, UserRole.manager), validateParams(schemas.uuidParam), validate(schemas.createRecipe), asyncHandler(async (req, res) => {
  const { id } = req.params; // menuItemId from URL
  const { ingredientId, quantity } = req.body;

  // Verify menu item exists
  const menuItem = await prisma.menuItem.findUnique({ where: { id } });
  if (!menuItem) throw new AppError('Menu item not found', 404);

  // Verify ingredient exists
  const ingredient = await prisma.ingredients.findUnique({ where: { id: ingredientId } });
  if (!ingredient) throw new AppError('Ingredient not found', 404);

  // Check if recipe exists (prevent duplicate pair)
  const existing = await prisma.recipes.findFirst({
    where: { menuItemId: id, ingredientId }
  });
  if (existing) throw new AppError('Recipe for this ingredient already exists', 400);

  const recipe = await prisma.recipes.create({
    data: {
      menuItemId: id,
      ingredientId,
      quantity
    },
    include: { ingredients: true }
  });

  res.status(201).json({
    success: true,
    data: {
      ...recipe,
      quantity: Number(recipe.quantity),
      ingredient: {
        ...recipe.ingredients,
        stock: Number(recipe.ingredients.stock)
      }
    },
    message: 'Recipe added successfully',
  });
}));

// Remove recipe
router.delete('/recipe/:recipeId', authenticate, authorize(UserRole.admin, UserRole.manager), asyncHandler(async (req, res) => {
  const { recipeId } = req.params;

  try {
    await prisma.recipes.delete({ where: { id: recipeId } });
    res.json({ success: true, message: 'Recipe removed successfully' });
  } catch (e: any) {
    if (e.code === 'P2025') throw new AppError('Recipe not found', 404);
    throw e;
  }
}));

// Add modifier to menu item (Admin/Manager)
router.post('/:id/modifiers', authenticate, authorize(UserRole.admin, UserRole.manager), validateParams(schemas.uuidParam), validate(schemas.createModifier), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, price, available } = req.body;

  const menuItem = await prisma.menuItem.findUnique({ where: { id } });
  if (!menuItem) throw new AppError('Menu item not found', 404);

  const modifier = await prisma.menu_item_modifiers.create({
    data: {
      menuItemId: id,
      name,
      price,
      available
    }
  });

  res.status(201).json({
    success: true,
    data: modifier,
    message: 'Modifier added successfully'
  });
}));

// Remove modifier (Admin/Manager)
router.delete('/modifiers/:modifierId', authenticate, authorize(UserRole.admin, UserRole.manager), asyncHandler(async (req, res) => {
  const { modifierId } = req.params;

  try {
    await prisma.menu_item_modifiers.delete({ where: { id: modifierId } });
    res.json({ success: true, message: 'Modifier removed successfully' });
  } catch (e: any) {
    if (e.code === 'P2025') throw new AppError('Modifier not found', 404);
    throw e;
  }
}));

export default router;
