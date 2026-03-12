
import { Request, Response } from 'express';
import { checkSystemRequirements } from './services/systemCheck';
import { checkPostgresInstalled, installPostgres, robustProvisionPostgres, checkPrivileges, ensurePostgresRunning, checkDatabaseReadiness } from './services/postgres';
import { writeEnv } from './services/envWriter';
import { runShellCommand } from './services/commandRunner';
import { PORTS } from '../config/ports';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Client } from 'pg';
import { pipeline } from 'stream/promises';

// --- System Check ---
export const getSystemRequirements = async (req: Request, res: Response) => {
    const results = await checkSystemRequirements();
    res.setHeader('Cache-Control', 'no-store');
    res.json(results);
};


// --- Database Controllers ---

/**
 * Robustly performs PostgreSQL setup following the 11-step strict sequence.
 */
async function performPostgresSetup(
    options: { database?: string; user?: string; password?: string; rootUser?: string; rootPassword?: string },
    onLog?: (msg: string) => void
) {
    const MAX_RETRIES = 3;
    const dbName = 'rms'; // Enforcement: Always use 'rms'
    const dbUser = 'postgres'; // Enforcement: Always use 'postgres'
    const dbPassword = 'root'; // Enforcement: Always use 'root'

    let attempt = 1;
    while (attempt <= MAX_RETRIES) {
        try {
            onLog?.(`[START] Database setup attempt ${attempt}/${MAX_RETRIES}`);

            // STEP 1: Detect PostgreSQL
            let pgStatus = await checkPostgresInstalled(onLog);

            // STEP 2: Automatic PostgreSQL Installation
            if (!pgStatus.installed) {
                onLog?.('[INSTALL] PostgreSQL not found. Starting automatic installation...');
                const installRes = await installPostgres(onLog);
                if (!installRes.ok) {
                    throw new Error(`Installation failed: ${installRes.message}`);
                }
                pgStatus = await checkPostgresInstalled(onLog);
            } else {
                onLog?.(`[CHECK] PostgreSQL installed: ${pgStatus.version || 'Detected'}`);
            }

            // STEP 3: Ensure PostgreSQL Service Running
            onLog?.('[START] Ensuring PostgreSQL service is running...');
            const isRunning = await ensurePostgresRunning(onLog);
            if (!isRunning) {
                throw new Error('PostgreSQL service could not be started.');
            }

            // STEP 4: Automatic Setup (Reset password and create DB)
            onLog?.('[CONFIG] Configuring database credentials and "rms" database...');
            const provisionOk = await robustProvisionPostgres(onLog);
            if (!provisionOk) {
                throw new Error('Failed to provision database/reset credentials.');
            }

            // STEP 5: Generate .env Automatically
            onLog?.('[CONFIG] Generating .env with optimized credentials...');
            const dbUrl = `postgresql://${dbUser}:${dbPassword}@localhost:5432/${dbName}?schema=public`;
            await writeEnv({
                DATABASE_URL: dbUrl,
                DB_HOST: 'localhost',
                DB_PORT: '5432',
                DB_NAME: dbName,
                DB_USER: dbUser,
                DB_PASSWORD: dbPassword
            });

            // STEP 6: Database Readiness Check
            const isConnected = await checkDatabaseReadiness({
                host: 'localhost',
                port: 5432,
                user: dbUser,
                password: dbPassword,
                database: dbName
            }, onLog);

            if (!isConnected) {
                onLog?.('[ERROR] Connection verification failed. Will retry credential reset.');
                throw new Error('Connection verification failed after setup.');
            }

            onLog?.('[SUCCESS] Database is ready and connected!');
            return {
                ok: true,
                code: 'SUCCESS',
                message: 'PostgreSQL setup complete.',
                credentials: { host: 'localhost', port: 5432, database: dbName, user: dbUser, password: dbPassword }
            };

        } catch (error: any) {
            onLog?.(`[RETRY] Attempt ${attempt} failed: ${error.message}`);
            if (attempt >= MAX_RETRIES) {
                onLog?.('[FATAL] Maximum retries reached. Setup failed.');
                throw error;
            }
            attempt++;
            // Wait before retry
            await new Promise(r => setTimeout(r, 3000));
        }
    }
    throw new Error('Setup failed unexpectedly.');
}

export const getDatabaseStatus = async (req: Request, res: Response) => {
    const status = await checkPostgresInstalled();
    res.json({
        ok: true,
        installed: status.installed,
        version: status.version
    });
};

export const autoSetupPostgres = async (req: Request, res: Response) => {
    try {
        const result = await performPostgresSetup(req.body);
        return res.json(result);
    } catch (error: any) {
        return res.json({
            ok: false,
            code: error.code || 'INSTALLATION_ERROR',
            message: error.message || 'Database setup failed after retries.'
        });
    }
};

export const autoSetupPostgresStream = async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendLog = (message: string) => {
        res.write(`data: ${JSON.stringify({ type: 'log', message })}\n\n`);
    };

    try {
        const result = await performPostgresSetup(req.query, sendLog);
        res.write(`data: ${JSON.stringify({ type: 'complete', ...result })}\n\n`);
        res.end();
    } catch (error: any) {
        res.write(`data: ${JSON.stringify({
            type: 'error',
            message: error.message || 'Setup failed.'
        })}\n\n`);
        res.end();
    }
};

export const autoInstallDatabase = async (req: Request, res: Response) => {
    return autoSetupPostgres(req, res);
};

export const configureDatabase = async (req: Request, res: Response) => {
    const { host, port, user, password, database } = req.body;

    // STEP 6: Database Readiness Check
    const isConnected = await checkDatabaseReadiness({
        host: host || 'localhost',
        port: port || 5432,
        user: user || 'postgres',
        password: password || 'root',
        database: database || 'rms'
    });

    if (isConnected) {
        const dbUrl = `postgresql://${user || 'postgres'}:${password || 'root'}@${host || 'localhost'}:${port || 5432}/${database || 'rms'}?schema=public`;
        await writeEnv({
            DATABASE_URL: dbUrl,
            DB_HOST: host || 'localhost',
            DB_PORT: (port || 5432).toString(),
            DB_NAME: database || 'rms',
            DB_USER: user || 'postgres',
            DB_PASSWORD: password || 'root'
        });

        res.json({ success: true, message: 'Database configured and connected.' });
    } else {
        res.json({ ok: false, error: 'Connection failed. Please check your credentials.' });
    }
};

// ... remaining controllers ...


// --- App Settings ---
export const getAppSettings = async (req: Request, res: Response) => {
    const envFilePath = path.join(process.cwd(), '.env');
    const settings = {
        appName: 'Restaurant System',
        appUrl: 'http://localhost:3000'
    };

    if (fs.existsSync(envFilePath)) {
        const content = fs.readFileSync(envFilePath, 'utf-8');
        const lines = content.split(/\r?\n/);
        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx > 0) {
                const key = trimmed.substring(0, eqIdx).trim();
                const val = trimmed.substring(eqIdx + 1).trim();
                if (key === 'APP_NAME') settings.appName = val;
                if (key === 'APP_URL') settings.appUrl = val;
            }
        });
    }

    res.json(settings);
};

export const saveAppSettings = async (req: Request, res: Response) => {
    const { appName, appUrl, adminEmail, adminPassword, jwtSecret, pusherAppId, pusherKey, pusherSecret, pusherCluster } = req.body;

    const finalJwtSecret = jwtSecret || crypto.randomBytes(32).toString('hex');

    // Remove trailing slash if present for consistency
    const cleanAppUrl = appUrl.replace(/\/$/, '');

    const envUpdates: Record<string, string> = {
        APP_NAME: appName,
        APP_URL: cleanAppUrl,
        FRONTEND_URL: cleanAppUrl,
        VITE_API_BASE_URL: `${cleanAppUrl}/api`,
        ADMIN_EMAIL: adminEmail,
        JWT_SECRET: finalJwtSecret,
        PORT: PORTS.BACKEND.toString(),
    };

    // If it's a real domain, use it for CORS, otherwise use localhost
    const isLocalhost = cleanAppUrl.includes('localhost') || cleanAppUrl.includes('127.0.0.1');

    if (!isLocalhost) {
        envUpdates.CORS_ORIGIN = cleanAppUrl;
        envUpdates.SOCKET_CORS_ORIGIN = cleanAppUrl;
    } else {
        envUpdates.CORS_ORIGIN = `http://localhost:${PORTS.FRONTEND}`;
        envUpdates.SOCKET_CORS_ORIGIN = `http://localhost:${PORTS.FRONTEND}`;
    }

    if (pusherAppId && pusherKey && pusherSecret && pusherCluster) {
        envUpdates.PUSHER_APP_ID = pusherAppId;
        envUpdates.PUSHER_KEY = pusherKey;
        envUpdates.PUSHER_SECRET = pusherSecret;
        envUpdates.PUSHER_CLUSTER = pusherCluster;
    }

    await writeEnv(envUpdates);

    const adminCreds = { email: adminEmail, password: adminPassword };
    fs.writeFileSync(path.join(process.cwd(), '.admin-setup.json'), JSON.stringify(adminCreds));

    res.json({ success: true });
};


// --- Installation ---
export const startInstallation = async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendLog = (data: string) => {
        res.write(`data: ${JSON.stringify({ type: 'log', message: data })}\n\n`);
    };

    const sendStatus = (step: string, status: 'pending' | 'running' | 'success' | 'error') => {
        res.write(`data: ${JSON.stringify({ type: 'status', step, status })}\n\n`);
    };

    // Reload env
    const envFilePath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envFilePath)) {
        const lines = fs.readFileSync(envFilePath, 'utf-8').split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx > 0) {
                const key = trimmed.substring(0, eqIdx).trim();
                const val = trimmed.substring(eqIdx + 1).trim();
                process.env[key] = val;
            }
        }
    }

    try {
        // Extraction already completed during verifyLicense.
        // We just mark it as success here to satisfy the UI.
        sendStatus('extract', 'running');
        sendLog('Extracting software package... (already completed in background)');
        sendStatus('extract', 'success');

        // The RMS workspace root and robs-backend paths
        const installedDir = path.resolve(__dirname, '..', '..', '..', 'installed');
        let rmsRoot = '';
        if (fs.existsSync(installedDir)) {
            const items = fs.readdirSync(installedDir);
            for (const item of items) {
                const fullPath = path.join(installedDir, item);
                if (fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'package.json'))) {
                    rmsRoot = fullPath;
                    break;
                }
            }
        }

        if (!rmsRoot) {
            throw new Error('Could not find extracted project root in installed folder.');
        }

        const rmsBackend = path.join(rmsRoot, 'robs-backend');
        const mainEnvPath = path.join(rmsBackend, '.env');

        sendStatus('dependencies', 'running');
        sendLog('Installing workspace dependencies (this may take a few minutes)...');
        // Install from workspace root so Prisma v7 is properly hoisted in RMS/node_modules
        await runShellCommand('npm', ['install', '--ignore-scripts', '--loglevel=error'], sendLog, rmsRoot);
        sendStatus('dependencies', 'success');

        sendStatus('database', 'running');
        sendLog('Configuring PostgreSQL robustly (Step 1-6)...');

        // This handles Step 1 to 6: Detect, Install, Run, Provision, .env, Verify Connection
        await performPostgresSetup({}, sendLog);

        sendLog('Copying environment config to main application...');
        fs.copyFileSync(envFilePath, mainEnvPath);

        const rmsFrontend = path.join(rmsRoot, 'robs-frontend');
        const frontendEnvPath = path.join(rmsFrontend, '.env');
        if (fs.existsSync(rmsFrontend)) {
            fs.copyFileSync(envFilePath, frontendEnvPath);
        }

        sendLog('Application URL configured successfully');

        sendLog('[INIT] Creating required tables');
        // Use the installed Prisma v7 from workspace root node_modules
        const prismaBin = path.join(rmsRoot, 'node_modules', '.bin', 'prisma');

        try {
            await runShellCommand(prismaBin, ['generate'], sendLog, rmsBackend);
            await runShellCommand(prismaBin, ['migrate', 'deploy'], sendLog, rmsBackend);
            sendLog('[OK] Tables created successfully');
        } catch (migError: any) {
            sendLog(`[RETRY] Migration failed: ${migError.message}. Re-verifying database...`);
            // Attempt one clean re-provision if migration fails (often fixes schema mismatches)
            await robustProvisionPostgres(sendLog);
            await runShellCommand(prismaBin, ['generate'], sendLog, rmsBackend);
            await runShellCommand(prismaBin, ['migrate', 'deploy'], sendLog, rmsBackend);
            sendLog('[OK] Tables created successfully');
        }

        sendStatus('database', 'success');

        const configuredAppUrl = process.env.APP_URL || 'http://localhost:3000';
        sendLog(`App URL configured successfully: ${configuredAppUrl}`);

        sendStatus('seeding', 'running');
        sendLog('[INIT] Checking default admin user');

        // Read admin credentials from the wizard
        const adminSetupPath = path.join(process.cwd(), '.admin-setup.json');
        let adminEmail = 'admin@restaurant.com';
        let adminPassword = 'password123';
        if (fs.existsSync(adminSetupPath)) {
            const creds = JSON.parse(fs.readFileSync(adminSetupPath, 'utf-8'));
            adminEmail = creds.email || adminEmail;
            adminPassword = creds.password || adminPassword;
            fs.unlinkSync(adminSetupPath);
        }

        // Overwrite the extracted seed.ts with a clean, production-ready version
        const seedPath = path.join(rmsBackend, 'prisma', 'seed.ts');
        const cleanSeed = `import 'dotenv/config';
import { PrismaClient, UserRole, TableStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('🌱 Starting clean database seeding...');

  // 1. Create Admin User from installer wizard credentials
  const adminEmail = ${JSON.stringify(adminEmail)};
  const adminPassword = ${JSON.stringify(adminPassword)};
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: UserRole.admin,
        active: true,
      },
    });
    console.log('[OK] Admin user created');
  } else {
    console.log('[INFO] Admin user already exists');
  }

  // 2. Create 10 Tables
  const tableConfigs = [
    { number: 1, capacity: 2 },
    { number: 2, capacity: 4 },
    { number: 3, capacity: 4 },
    { number: 4, capacity: 6 },
    { number: 5, capacity: 2 },
    { number: 6, capacity: 4 },
    { number: 7, capacity: 8 },
    { number: 8, capacity: 2 },
    { number: 9, capacity: 4 },
    { number: 10, capacity: 6 },
  ];
  for (const t of tableConfigs) {
    await prisma.table.upsert({
      where: { number: t.number },
      update: {},
      create: { number: t.number, capacity: t.capacity, status: TableStatus.free },
    });
  }
  console.log('✅ 10 Tables created');

  // 3. Create Menu Items
  const menuItems = [
    { name: 'Margherita Pizza', category: 'Pizza', price: 299, description: 'Classic tomato and mozzarella', preparationTime: 15 },
    { name: 'Pepperoni Pizza', category: 'Pizza', price: 399, description: 'Loaded with pepperoni', preparationTime: 15 },
    { name: 'Caesar Salad', category: 'Salads', price: 199, description: 'Fresh romaine lettuce with Caesar dressing', preparationTime: 10 },
    { name: 'Chicken Burger', category: 'Burgers', price: 249, description: 'Grilled chicken with special sauce', preparationTime: 12 },
    { name: 'Veg Burger', category: 'Burgers', price: 199, description: 'Veggie patty with fresh vegetables', preparationTime: 10 },
    { name: 'Pasta Carbonara', category: 'Pasta', price: 349, description: 'Creamy pasta with bacon', preparationTime: 18 },
    { name: 'Grilled Chicken', category: 'Mains', price: 449, description: 'Tender grilled chicken with herbs', preparationTime: 20 },
    { name: 'Fish & Chips', category: 'Mains', price: 399, description: 'Crispy fried fish with fries', preparationTime: 15 },
    { name: 'Chocolate Brownie', category: 'Desserts', price: 149, description: 'Warm chocolate brownie with ice cream', preparationTime: 8 },
    { name: 'Tiramisu', category: 'Desserts', price: 199, description: 'Classic Italian dessert', preparationTime: 5 },
    { name: 'Coke', category: 'Beverages', price: 49, description: 'Chilled soft drink', preparationTime: 2 },
    { name: 'Fresh Orange Juice', category: 'Beverages', price: 99, description: 'Freshly squeezed orange juice', preparationTime: 5 },
  ];
  for (const item of menuItems) {
    await prisma.menuItem.create({ data: { ...item, available: true } });
  }
  console.log('✅ Menu items created:', menuItems.length);

  // 4. Create Settings
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      taxRate: 5.00,
      currency: '₹',
      restaurantName: 'My Restaurant',
      discountPresets: [5, 10, 15, 20],
      printerConfig: { enabled: false, printerName: '' },
    },
  });
  console.log('✅ Settings created');

  console.log('🎉 Clean database seeding completed!');
  console.log('\\n🔑 Admin Login: ' + ${JSON.stringify(adminEmail)});
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;
        fs.writeFileSync(seedPath, cleanSeed);
        sendLog('Replaced seed.ts with clean production version.');

        await runShellCommand('npm', ['run', 'db:seed'], sendLog, rmsBackend);
        sendStatus('seeding', 'success');

        sendStatus('build', 'running');
        sendLog('Building main application...');
        await runShellCommand('npm', ['run', 'build'], sendLog, rmsBackend);
        sendStatus('build', 'success');

        fs.writeFileSync(path.join(process.cwd(), 'installed.lock'), 'INSTALLED');
        sendLog('Installation completed successfully!');
        res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
        res.end();

    } catch (error: any) {
        sendLog(`ERROR: ${error.message}`);
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
    }
};


async function downloadSoftware(downloadUrl: string, destPath: string, licenseKey: string, domain: string) {
    console.log(`DEBUG: Starting streaming download from ${downloadUrl}`);

    // If it's our central backend download route, it expects a POST with license_key and domain
    const isProxyRoute = downloadUrl.includes('/api/download-rms') || downloadUrl.includes('/api/download-product');

    const options: RequestInit = isProxyRoute ? {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/zip, application/json',
        },
        body: JSON.stringify({
            license_key: licenseKey,
            domain: domain
        })
    } : {
        method: 'GET',
        headers: {
            'Accept': 'application/zip, application/json'
        }
    };

    // We can use native fetch available in Node.js 18+
    const response = await fetch(downloadUrl, options);

    if (!response.ok) {
        let errorMessage = `Download failed with status ${response.status}: ${response.statusText}`;
        try {
            const data = await response.json() as any;
            errorMessage = data.message || data.error || errorMessage;
        } catch (e) {
            // Ignore parse error
        }
        throw new Error(errorMessage);
    }

    if (!response.body) {
        throw new Error('No response body from download server');
    }

    const fileStream = fs.createWriteStream(destPath);
    const { Readable } = require('stream');

    console.log('Download started');

    // Add a simple progress log for demonstration. Realistic progress would listen to stream data.
    const reader = response.body.getReader();
    const stream = new ReadableStream({
        start(controller) {
            function push() {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        controller.close();
                        return;
                    }
                    controller.enqueue(value);
                    push();
                }).catch((err: any) => {
                    controller.error(err);
                });
            }
            push();
        }
    });

    const interval = setInterval(() => {
        console.log('Download progress...');
    }, 5000); // generic progress ticks

    await pipeline(Readable.fromWeb(stream as any), fileStream);
    clearInterval(interval);

    // Verify it exists and has size
    if (fs.existsSync(destPath)) {
        const stats = fs.statSync(destPath);
        console.log(`Download completed. File size: ${stats.size} bytes`);
        if (stats.size < 5000) { // Zipballs are usually much larger than error JSONs
            const content = fs.readFileSync(destPath, 'utf8');
            if (content.trim().startsWith('{')) {
                try {
                    const err = JSON.parse(content);
                    throw new Error(err.message || err.error || 'Downloaded file contains an error message instead of a ZIP.');
                } catch (e) {
                    // Not JSON, continue
                }
            }
        }
    } else {
        throw new Error('Download completed but file is missing from disk!');
    }
}

/**
 * Internal helper to extract the software zip
 */
async function extractSoftware() {
    const zipPath = path.resolve(__dirname, '..', '..', '..', 'downloads', 'project.zip');
    const targetDir = path.resolve(__dirname, '..', '..', '..', 'installed');
    const lockFile = path.resolve(__dirname, '..', '..', 'installed.lock'); // robs-backend/installed.lock

    console.log(`DEBUG: Target extraction directory: ${targetDir}`);

    if (fs.existsSync(lockFile)) {
        throw new Error('Installation is locked. Project appears to be already installed.');
    }

    if (!fs.existsSync(zipPath)) {
        throw new Error('Software package (project.zip) not found in downloads directory.');
    }

    try {
        const extract = (await import('extract-zip')).default;

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        console.log('Extraction started');
        await extract(zipPath, { dir: targetDir });
        console.log('Extraction completed');

        // GitHub zipballs extract into a single top-level folder like "username-repo-hash"
        // We need to find this folder and rename it/move its contents if necessary, 
        // OR just ensure we can find the package.json.
        const items = fs.readdirSync(targetDir);
        let githubFolder = '';

        for (const item of items) {
            const fullPath = path.join(targetDir, item);
            if (fs.statSync(fullPath).isDirectory()) {
                // Look for a folder that contains package.json or robs-backend
                if (fs.existsSync(path.join(fullPath, 'package.json')) || fs.existsSync(path.join(fullPath, 'robs-backend'))) {
                    githubFolder = item;
                    break;
                }
            }
        }

        if (!githubFolder) {
            throw new Error('Extraction failed: Could not find project root folder inside the ZIP.');
        }

        const projectRoot = path.join(targetDir, githubFolder);
        console.log(`DEBUG: Project root identified at: ${projectRoot}`);

        // Cleanup ZIP
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

        // Remove any premature lock files in the extracted project
        const possibleLock = path.join(projectRoot, 'robs-backend', 'installed.lock');
        if (fs.existsSync(possibleLock)) {
            console.log(`DEBUG: Removing premature lock file: ${possibleLock}`);
            fs.unlinkSync(possibleLock);
        }

    } catch (error: any) {
        console.error('Extraction error:', error);
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
        throw new Error(error.message || 'Failed to extract software package.');
    }
}

export const verifyLicense = async (req: Request, res: Response) => {
    console.log('DEBUG: VERIFY_LICENSE_VERSION: 1.0.5_RESILLIENT_EXTRACT');
    const { license_key } = req.body;

    if (!license_key) {
        return res.status(400).json({ success: false, message: 'License key is required' });
    }

    // const axios = (await import('axios')).default; // No longer needed for verify
    const domain = req.get('host') || 'localhost';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for verification

    try {
        // Step 1: Verify License
        const licenseServerUrl = (process.env.LICENSE_SERVER_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
        const verifyUrl = `${licenseServerUrl}/api/license/verify`;

        console.log(`[LicenseVerify] Attempting verification at: ${verifyUrl}`);
        console.log(`[LicenseVerify] Payload:`, { license_key, machine_id: domain, current_domain: domain });

        const apiResponse = await fetch(verifyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                license_key,
                machine_id: domain, // Previous context used machine_id
                current_domain: domain, // Adding current_domain just in case
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        let data: any;
        const contentType = apiResponse.headers.get('content-type');

        console.log(`[LicenseVerify] Response Status: ${apiResponse.status}`);
        console.log(`[LicenseVerify] Response Content-Type: ${contentType}`);

        if (contentType && contentType.includes('application/json')) {
            data = await apiResponse.json();
            console.log(`[LicenseVerify] Response JSON:`, data);
        } else {
            const text = await apiResponse.text();
            console.error('Unexpected non-JSON response from verification server:', text.substring(0, 500));
            return res.status(500).json({
                success: false,
                message: 'Unexpected response from verification server. Please try again later.'
            });
        }

        if (!data.success) {
            return res.status(apiResponse.status || 400).json({
                success: false,
                message: data.message || 'Invalid license key',
            });
        }

        // Save license locally
        const rootInstallerDir = path.resolve(__dirname, '..', '..', '..');
        const storageDir = path.join(rootInstallerDir, 'storage');
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
        }

        const licenseData = {
            license_key,
            domain,
            verified_at: new Date().toISOString(),
        };

        const licensePath = path.join(storageDir, 'license.json');
        fs.writeFileSync(licensePath, JSON.stringify(licenseData, null, 2));

        console.log('License verified');

        // Step 2: Download ZIP from Secure Proxy API
        const downloadsDir = path.resolve(__dirname, '..', '..', '..', 'downloads');
        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
        }
        const destZip = path.join(downloadsDir, 'project.zip');

        // POINT TO THE NEW SECURE PROXY ENDPOINT
        const downloadUrl = (process.env.DOWNLOAD_URL_OVERRIDE as string) || `${licenseServerUrl}/api/download-rms`;

        console.log(`DEBUG: Downloading RMS project via secure proxy: ${downloadUrl}`);
        await downloadSoftware(downloadUrl, destZip, license_key, domain);

        // Step 3: Trigger Extraction Here
        await extractSoftware();

        return res.json({
            success: true,
            message: 'License verified and software extracted. Proceeding to setup.',
            redirect: '/installer/start'
        });
    } catch (error: any) {
        console.error('License flow failed:', error);

        if (error.name === 'AbortError') {
            return res.status(504).json({
                success: false,
                message: 'Connection timed out. Please check your internet connection.'
            });
        }

        // Do not expose real file paths in error messages as per Phase 4
        const userFriendlyMessage = error.message.includes('C:\\') || error.message.includes('/')
            ? 'An error occurred during the installation process. Please try again.'
            : error.message;

        return res.status(500).json({
            success: false,
            message: userFriendlyMessage || 'Failed to complete installation. Please check your connection and try again.',
        });
    }
};

export const checkLicenseStatus = async (req: Request, res: Response) => {
    try {
        const licensePath = path.resolve(__dirname, '..', '..', '..', 'storage', 'license.json');
        console.log(`DEBUG: Checking license status at: ${licensePath}`);
        if (fs.existsSync(licensePath)) {
            const data = JSON.parse(fs.readFileSync(licensePath, 'utf-8'));
            console.log('DEBUG: License found and parsed successfully.');
            return res.json({
                success: true,
                license: data
            });
        }
        console.log('DEBUG: License file not found.');
        return res.json({ success: false });
    } catch (error: any) {
        console.error('DEBUG: Error checking license status:', error.message);
        return res.json({ success: false });
    }
};

export const restartServer = async (req: Request, res: Response) => {
    res.json({ success: true, message: 'Server is switching to main application...' });

    // We import this dynamically to avoid circular dependencies
    const { switchToMainApp } = await import('../index');

    setTimeout(async () => {
        try {
            await switchToMainApp();
        } catch (err) {
            console.error('Failed to switch to main app:', err);
            process.exit(1);
        }
    }, 1500);
};

