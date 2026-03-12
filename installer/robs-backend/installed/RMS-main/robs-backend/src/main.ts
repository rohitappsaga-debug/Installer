
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import net from 'net';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import fs from 'fs';
import { PORTS, getPort } from '@/config/ports';
import { findAvailablePort } from '@/utils/port-finder';

console.log('DEBUG: Imports complete. Starting application...');

import { connectDatabase, disconnectDatabase } from '@/utils/database';
import prisma from '@/utils/database';
import { logger, morganStream } from '@/utils/logger';
import { validateEnvironment, getJwtSecret } from '@/utils/env';
import { errorHandler } from '@/middleware/errorHandler';
import { notFound } from '@/middleware/notFound';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import tableRoutes from './routes/tables';
import menuRoutes from './routes/menu';
import orderRoutes from './routes/orders';
import notificationRoutes from './routes/notifications';
import settingsRoutes from '@/routes/settings';
import reportRoutes from '@/routes/reports';
import categoriesRoutes from '@/routes/categories';
import reservationRoutes from '@/routes/reservations';
import paymentRoutes from '@/routes/payments';

// Global Error Handling for Uncaught Exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ UNCAUGHT EXCEPTION! Shutting down...', error);
    logger.error('❌ UNCAUGHT EXCEPTION! Shutting down...', { error: error instanceof Error ? error.message : error, stack: error instanceof Error ? error.stack : undefined });

    // Give logger a moment to flush (if async) before exiting
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

// Global Error Handling for Unhandled Rejections
process.on('unhandledRejection', (reason) => {
    console.error('❌ UNHANDLED REJECTION! Shutting down...', reason);
    logger.error('❌ UNHANDLED REJECTION! Shutting down...', { reason: reason instanceof Error ? reason.message : reason });

    // Give logger a moment to flush (if async) before exiting
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

// Validate environment variables on startup
try {
    console.log('DEBUG: Validating environment...');
    validateEnvironment();
    logger.info('✅ Environment variables validated');
} catch (error) {
    logger.error('❌ Environment validation failed:', error);
    process.exit(1);
}

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Restaurant Order Booking System API',
            version: '1.0.0',
            description: 'A comprehensive API for managing restaurant orders, tables, menu items, and real-time notifications',
            contact: {
                name: 'API Support',
                email: 'support@restaurant.com',
            },
        },
        servers: [
            {
                url: `http://localhost:${PORTS.BACKEND}`,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string', enum: ['admin', 'waiter', 'kitchen'] },
                        active: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Table: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        number: { type: 'integer' },
                        capacity: { type: 'integer' },
                        status: { type: 'string', enum: ['free', 'occupied', 'reserved'] },
                        reservedBy: { type: 'string', nullable: true },
                        reservedTime: { type: 'string', format: 'date-time', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                MenuItem: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        price: { type: 'number', format: 'float' },
                        category: { type: 'string' },
                        imageUrl: { type: 'string', nullable: true },
                        available: { type: 'boolean' },
                        preparationTime: { type: 'integer' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Order: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        tableNumber: { type: 'integer' },
                        status: { type: 'string', enum: ['pending', 'preparing', 'ready', 'served', 'delivered', 'cancelled'] },
                        total: { type: 'number', format: 'float' },
                        discountType: { type: 'string', enum: ['percentage', 'amount'], nullable: true },
                        discountValue: { type: 'number', nullable: true },
                        isPaid: { type: 'boolean' },
                        paymentMethod: { type: 'string', enum: ['cash', 'card', 'upi'], nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: { type: 'string' },
                        stack: { type: 'string' },
                    },
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: { type: 'object' },
                        message: { type: 'string' },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: [process.env.NODE_ENV === 'production' ? './dist/routes/*.js' : './src/routes/*.ts'], // Path to the API files
};

// Swagger will be initialized after port resolution
let swaggerSpec: any;


const app = express();
const server = createServer(app);

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: [
            process.env.SOCKET_CORS_ORIGIN || `http://localhost:${PORTS.FRONTEND}`,
            'http://localhost:5173', // Vite default port
            'http://localhost:4173', // Vite preview port
        ],
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Make io available to routes
app.set('io', io);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    xXssProtection: false,
}));

// CORS configuration
app.use(cors({
    origin: [
        process.env.CORS_ORIGIN || `http://localhost:${PORTS.FRONTEND}`,
        'http://localhost:3005', // Installer port (localhost)
        'http://127.0.0.1:3005', // Installer port (IP)
        'http://localhost:5173', // Vite default port
        'http://127.0.0.1:5173', // Vite default IP
        'http://localhost:4173', // Vite preview port
        'http://127.0.0.1:4173', // Vite preview IP
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '2000'), // limit each IP to 2000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'development',
});
app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', { stream: morganStream }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger documentation - setup after server starts or on first request
app.use('/api-docs', swaggerUi.serve, (req: any, res: any, next: any) => {
    if (!swaggerSpec) {
        const actualPort = (server.address() as net.AddressInfo)?.port || PORTS.BACKEND;
        const dynamicOptions = {
            ...swaggerOptions,
            definition: {
                ...swaggerOptions.definition,
                servers: [{ url: `http://localhost:${actualPort}`, description: 'Development server' }]
            }
        };
        swaggerSpec = swaggerJsdoc(dynamicOptions);
    }
    swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Restaurant API Documentation',
    })(req, res, next);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/payments', paymentRoutes);

// Health check for installer monitoring
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from the React frontend app
const frontendPath = path.join(__dirname, '../../robs-frontend/build');
const indexHtmlPath = path.join(frontendPath, 'index.html');

if (fs.existsSync(indexHtmlPath)) {
    app.use(express.static(frontendPath));
    // Handle React routing, return all requests to React app
    app.get('*', (req, res) => {
        res.sendFile(indexHtmlPath);
    });
} else {
    logger.warn(`⚠️ Frontend build not found at: ${frontendPath}`);
    logger.warn(`   Run "npm run build --workspace=robs-frontend" to build it.`);

    // Serve a friendly error page instead of crashing or returning 404/JSON
    app.get('*', (req, res) => {
        // If it's an API request, let it go to the 404 handler normally
        if (req.path.startsWith('/api')) {
            return res.status(404).json({
                success: false,
                error: 'API endpoint not found',
                help: 'The backend is running, but the frontend build is missing. Use /health or /api-docs to verify the API.'
            });
        }

        // For all other requests (browser), serve a helpful HTML page
        res.status(503).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Frontend Build Missing</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f4f7f6; color: #333; }
                    .card { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 500px; text-align: center; border-top: 5px solid #ff9800; }
                    h1 { margin-top: 0; color: #e65100; }
                    p { line-height: 1.6; }
                    code { background: #eee; padding: 0.2rem 0.4rem; border-radius: 4px; font-weight: bold; }
                    .footer { margin-top: 2rem; font-size: 0.9rem; color: #666; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>🛠️ Frontend Missing</h1>
                    <p>The backend server is running correctly, but the <strong>frontend build directory</strong> was not found.</p>
                    <p>To fix this, go to the project root and run:</p>
                    <p><code>npm run build --workspace=robs-frontend</code></p>
                    <div class="footer">Refreshing this page after the build finishes will launch the app.</div>
                </div>
            </body>
            </html>
        `);
    });
}

// Socket.io authentication middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        const { verifyToken } = await import('@/utils/jwt');
        const decoded = verifyToken(token);

        // Attach user info to socket
        socket.data.user = decoded;
        next();
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            logger.warn(`Socket authentication failed: Token expired for client ${socket.id}`);
            return next(new Error('Authentication error: Token expired'));
        }
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
    }
});

// Socket.io connection handling
io.on('connection', (socket) => {
    const user = socket.data.user;
    logger.info(`Client connected: ${socket.id}, User: ${user?.email}`);

    // Join user to their personal room for targeted notifications
    if (user && user.userId) {
        socket.join(user.userId);
        logger.info(`Client ${socket.id} joined user room: ${user.userId}`);
    }

    // Join user to their role-based room
    socket.on('join-role', (role: string) => {
        socket.join(role);
        logger.info(`Client ${socket.id} joined role: ${role}`);
    });

    // Join user to specific table room
    socket.on('join-table', (tableNumber: number) => {
        socket.join(`table-${tableNumber}`);
        logger.info(`Client ${socket.id} joined table: ${tableNumber}`);
    });

    // Handle manual user room join (fallback for token-based join)
    socket.on('join-user', (userId: string) => {
        socket.join(userId);
        logger.info(`Client ${socket.id} manually joined user room: ${userId}`);
    });

    // Handle order status updates
    socket.on('order-status-update', (data: { orderId: string; status: string }) => {
        socket.to('kitchen').emit('order-status-changed', data);
        socket.to('waiter').emit('order-status-changed', data);
        logger.info(`Order ${data.orderId} status updated to: ${data.status}`);
    });

    // Handle table status updates
    socket.on('table-status-update', (data: { tableNumber: number; status: string }) => {
        socket.to('waiter').emit('table-status-changed', data);
        socket.to('admin').emit('table-status-changed', data);
        logger.info(`Table ${data.tableNumber} status updated to: ${data.status}`);
    });

    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    server.close(async () => {
        logger.info('HTTP server closed');

        try {
            await disconnectDatabase();
            logger.info('Database disconnected');
            process.exit(0);
        } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    });
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server — resolved dynamically at runtime from process.env.PORT (or default 3000)
// findAvailablePort() will increment if the configured port is already in use

const startServer = async () => {
    console.log('DEBUG: startServer called');
    try {
        // Resolve which port to use — reads process.env.PORT, auto-increments if busy
        const PORT = await findAvailablePort(getPort('BACKEND'));
        // Expose the actual port so other parts of the process can read it
        process.env.PORT = String(PORT);

        // Connect to database
        console.log('DEBUG: Connecting to database...');
        await connectDatabase();
        console.log('DEBUG: Database connected.');

        // Start HTTP server — port is already confirmed free by findAvailablePort()
        console.log(`DEBUG: Attempting to listen on port ${PORT}...`);
        server.listen(PORT, '0.0.0.0', () => {
            logger.info(`=================================`);
            logger.info(`🚀 Server running on port ${PORT}`);
            logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
            logger.info(`📚 API Docs: http://localhost:${PORT}/api-docs`);
            logger.info(`=================================`);
        });

        // Handle server-level errors with clear, actionable messages
        server.on('error', (error: any) => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`❌ Port ${PORT} is already in use.`);
                logger.error(`   Stop the other process or change PORT in .env file.`);
                logger.error(`   To find the process: netstat -ano | findstr :${PORT}`);
                logger.error(`   To kill it: taskkill /F /PID <pid>`);
            } else if (error.code === 'EACCES') {
                logger.error(`❌ Permission denied for port ${PORT}.`);
                logger.error(`   Try using a port above 1024 or run with elevated privileges.`);
            } else {
                logger.error('❌ Server error:', error);
            }
            process.exit(1);
        });

        // Start background task for reservation status management
        setInterval(async () => {
            try {
                const now = new Date();
                const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                // Get settings for grace period
                const settings = await prisma.settings.findFirst();
                const gracePeriod = settings?.reservationGracePeriod || 15;

                // 1. Activate reservations: Set table status to 'reserved' if reservation is starting
                const activeReservations = await prisma.reservation.findMany({
                    where: {
                        date: today,
                        status: 'pending',
                        startTime: { lte: currentTime },
                        endTime: { gt: currentTime }
                    }
                });

                for (const res of activeReservations) {
                    const table = await prisma.table.findUnique({ where: { number: res.tableNumber } });
                    if (table && table.status === 'free') {
                        const updatedTable = await prisma.table.update({
                            where: { number: res.tableNumber },
                            data: {
                                status: 'reserved',
                                reservedBy: res.customerName,
                                reservedTime: now
                            }
                        });
                        // Emit socket event for real-time update
                        io.emit('table:status-changed', {
                            tableNumber: res.tableNumber,
                            status: 'reserved',
                            reservedBy: res.customerName,
                            reservedTime: now
                        });
                        logger.info(`Table ${res.tableNumber} status updated to RESERVED for guest ${res.customerName}`);
                    }
                }

                // 2. Expire reservations: Set table status to 'free' and reservation to 'expired' if guest didn't show up within grace period
                // Calculate the time threshold for expiration
                const expirationTime = new Date(now.getTime() - gracePeriod * 60000);
                const expTimeStr = `${String(expirationTime.getHours()).padStart(2, '0')}:${String(expirationTime.getMinutes()).padStart(2, '0')}`;

                const expiredReservations = await prisma.reservation.findMany({
                    where: {
                        date: { lte: today },
                        status: 'pending',
                        endTime: { lt: expTimeStr }
                    }
                });

                for (const res of expiredReservations) {
                    await prisma.$transaction([
                        prisma.reservation.update({
                            where: { id: res.id },
                            data: { status: 'expired' }
                        }),
                        prisma.table.updateMany({
                            where: {
                                number: res.tableNumber,
                                status: 'reserved'
                            },
                            data: {
                                status: 'free',
                                reservedBy: null,
                                reservedTime: null
                            }
                        })
                    ]);

                    // Emit socket event for real-time update
                    io.emit('table:status-changed', {
                        tableNumber: res.tableNumber,
                        status: 'free'
                    });

                    logger.info(`Reservation ${res.id} for Table ${res.tableNumber} EXPIRED`);
                }

            } catch (error) {
                logger.error('Error in reservation background task:', error);
                console.error('Reservation background task failed:', error); // Ensure it prints to stdout
            }
        }, 60000); // Run every minute
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export { app, server, io };
