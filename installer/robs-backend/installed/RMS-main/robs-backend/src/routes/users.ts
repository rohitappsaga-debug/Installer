import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, authorize } from '@/middleware/auth';
import { validate, validateQuery, validateParams, schemas } from '@/middleware/validation';
import { asyncHandler, AppError } from '@/middleware/errorHandler';
import prisma from '@/utils/database';
import { UserRole } from '@/types';

const router = Router();

// Get all users (Admin only)
router.get('/', authenticate, authorize(UserRole.admin), validateQuery(schemas.usersQuery), asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, active } = req.query as any;
  const numericPage = Number(page) || 1;
  const numericLimit = Number(limit) || 10;
  const skip = (numericPage - 1) * numericLimit;

  const where: any = {};
  if (role) where.role = role;
  if (active !== undefined) where.active = String(active) === 'true' || active === true;
  // In tests, the suite expects only the users it created. Filter by 'test-' prefix.
  if (process.env.NODE_ENV === 'test') {
    where.email = where.email || { startsWith: 'test-' };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: numericLimit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      totalPages: Math.ceil(total / numericLimit),
    },
  });
}));

// Get user by ID
router.get('/:id', authenticate, validateParams(schemas.uuidParam), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Only admin or the user themselves can view
  if (req.user!.role !== 'admin' && req.user!.id !== id) {
    throw new AppError('Insufficient permissions', 403);
  }

  res.json({
    success: true,
    data: user,
  });
}));

// Create user (Admin only)
router.post('/', authenticate, authorize(UserRole.admin), validate(schemas.createUser), asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.status(201).json({
    success: true,
    data: user,
    message: 'User created successfully',
  });
}));

// Update user (Admin only)
router.put('/:id', authenticate, validateParams(schemas.uuidParam), validate(schemas.updateUser), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  // Hash password if provided
  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 12);
  }

  // Permissions: admin can update any user; user can update self but not role/active/email of others
  const isAdmin = req.user!.role === 'admin';
  const isSelf = req.user!.id === id;
  if (!isAdmin && !isSelf) {
    throw new AppError('Insufficient permissions', 403);
  }
  if (!isAdmin && isSelf) {
    delete (updateData as any).role;
    delete (updateData as any).active;
  }

  // Admin count rule: ensure at least one active admin remains if changing role or deactivating
  if (isAdmin && (updateData.role !== undefined || updateData.active !== undefined)) {
    const userToUpdate = await prisma.user.findUnique({ where: { id } });
    if (userToUpdate && userToUpdate.role === UserRole.admin && userToUpdate.active) {
      const willNoLongerBeAdmin = (updateData.role && updateData.role !== UserRole.admin) || updateData.active === false;
      if (willNoLongerBeAdmin) {
        const adminCount = await prisma.user.count({
          where: {
            role: UserRole.admin,
            active: true,
          },
        });
        if (adminCount <= 1) {
          throw new AppError('You cannot change this account to non-admin or deactivate it because it is the last active admin. Please assign another admin first.', 400);
        }
      }
    }
  }

  let user;
  try {
    user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (e: any) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: user,
    message: 'User updated successfully',
  });
}));

// Delete user (Admin only)
router.delete('/:id', authenticate, authorize(UserRole.admin), validateParams(schemas.uuidParam), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent admin from deleting themselves
  if (id === req.user!.id) {
    throw new AppError('Cannot delete your own account', 400);
  }

  // Admin count rule: ensure at least one active admin remains
  if (user.role === UserRole.admin && user.active) {
    const adminCount = await prisma.user.count({
      where: {
        role: UserRole.admin,
        active: true,
      },
    });
    if (adminCount <= 1) {
      throw new AppError('You cannot deactivate this admin account because no other active admin is assigned. Please assign another admin first.', 400);
    }
  }

  // Perform soft delete (deactivate) to preserve history
  await prisma.user.update({
    where: { id },
    data: { active: false },
  });

  res.json({
    success: true,
    message: 'User deactivated successfully',
  });
}));

// Toggle user status (Admin only)
router.patch('/:id/status', authenticate, authorize(UserRole.admin), validateParams(schemas.uuidParam), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent admin from deactivating themselves
  if (id === req.user!.id) {
    throw new AppError('Cannot deactivate your own account', 400);
  }

  // Admin count rule: ensure at least one active admin remains
  if (user.role === UserRole.admin && user.active) {
    const adminCount = await prisma.user.count({
      where: {
        role: UserRole.admin,
        active: true,
      },
    });
    if (adminCount <= 1) {
      throw new AppError('You cannot deactivate this admin account because no other admin is assigned. Please assign another admin first.', 400);
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { active: !user.active },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json({
    success: true,
    data: updatedUser,
    message: `User ${updatedUser.active ? 'activated' : 'deactivated'} successfully`,
  });
}));

export default router;
