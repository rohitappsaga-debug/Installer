import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate } from '@/middleware/auth';
import { validate, schemas } from '@/middleware/validation';
import { asyncHandler, AppError } from '@/middleware/errorHandler';
import prisma from '@/utils/database';
import { generateAccessToken, generateRefreshToken, verifyToken } from '@/utils/jwt';
import { UserRole } from '@/types';

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and return JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@restaurant.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     refreshToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', validate(schemas.login), asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.active) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }
  // ✅ ROLE VALIDATION
  if (user.role !== role) {
    throw new AppError(`Access denied. You are not authorized as ${role}`, 403);
  }


  // Generate JWT tokens
  const token = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      token,
      refreshToken,
    },
    message: 'Login successful',
  });
}));

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: User registration
 *     description: Register a new user and return JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@restaurant.com
 *               password:
 *                 type: string
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [admin, waiter, kitchen]
 *                 example: waiter
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: User already exists or invalid data
 */
router.post('/register', validate(schemas.createUser), asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('User already exists', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
  });

  const token = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const { password: _, ...userWithoutPassword } = user;

  res.status(201).json({
    success: true,
    data: {
      user: userWithoutPassword,
      token,
      refreshToken,
    },
    message: 'Registration successful',
  });
}));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     description: Get the currently authenticated user's information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
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

  res.json({
    success: true,
    data: user,
  });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token required', 400);
  }

  try {
    const decoded = verifyToken<{ userId: string }>(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    });

    if (!user || !user.active) {
      throw new AppError('User not found or inactive', 401);
    }

    // Generate new tokens
    const newToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        user,
      },
    });
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
}));

// Logout (client-side token removal, but we can add token blacklisting here)
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  // In a more sophisticated setup, you would add the token to a blacklist
  // For now, we'll just return success and let the client handle token removal

  res.json({
    success: true,
    message: 'Logout successful',
  });
}));

// Change password
router.post('/change-password', authenticate, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters long', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 12);

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedNewPassword },
  });

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
}));

export default router;
