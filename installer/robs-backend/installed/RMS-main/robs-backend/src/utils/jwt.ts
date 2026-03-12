import jwt from 'jsonwebtoken';
import { getJwtSecret } from './env';
import { JWTPayload, User } from '@/types';

/**
 * Generate Access Token
 * @param user User object
 * @returns JWT access token string
 */
export const generateAccessToken = (user: Partial<User>): string => {
    const secret = getJwtSecret();
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role
        },
        secret,
        { expiresIn } as jwt.SignOptions
    );
};

/**
 * Generate Refresh Token
 * @param user User object
 * @returns JWT refresh token string
 */
export const generateRefreshToken = (user: Partial<User>): string => {
    const secret = getJwtSecret();
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    return jwt.sign(
        { userId: user.id },
        secret,
        { expiresIn } as jwt.SignOptions
    );
};

/**
 * Verify JWT Token
 * @param token JWT token string
 * @returns Decoded payload
 */
export const verifyToken = <T = JWTPayload>(token: string): T => {
    const secret = getJwtSecret();
    return jwt.verify(token, secret) as T;
};
