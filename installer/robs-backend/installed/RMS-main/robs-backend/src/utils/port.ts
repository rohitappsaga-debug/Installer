import net from 'net';
import { execSync } from 'child_process';
import { logger } from './logger';

/**
 * Checks if a port is available for use
 */
export async function isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
                resolve(false);
            } else {
                // Other errors (e.g., EACCES) mean we can't use it anyway
                resolve(false);
            }
        });

        server.once('listening', () => {
            server.close();
            resolve(true);
        });

        server.listen(port);
    });
}

/**
 * Attempts to kill a process listening on a specific port
 * Supports Windows, macOS, and Linux
 */
export async function killProcessOnPort(port: number): Promise<boolean> {
    const platform = process.platform;
    try {
        if (platform === 'win32') {
            // Windows: Find PID and kill it
            const output = execSync(`netstat -ano | findstr :${port}`).toString();
            const lines = output.split('\n').filter(line => line.trim().length > 0);

            let killed = false;
            for (const line of lines) {
                // Look for lines that confirm a process is LISTENING
                if (line.includes('LISTENING')) {
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[parts.length - 1];
                    if (pid && pid !== '0') {
                        logger.info(`Attempting to kill process ${pid} on port ${port}...`);
                        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
                        killed = true;
                    }
                }
            }
            return killed;
        } else {
            // macOS/Linux: Use lsof or fuser
            try {
                execSync(`lsof -i :${port} -t | xargs kill -9`, { stdio: 'ignore' });
                return true;
            } catch {
                // Try fuser as fallback
                execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
                return true;
            }
        }
    } catch (error) {
        logger.error(`Failed to kill process on port ${port}:`, error);
        return false;
    }
}

/**
 * Finds an available port, potentially killing existing process if in dev
 */
export async function resolvePort(preferredPort: number, maxRetries = 10): Promise<number> {
    const isDev = process.env.NODE_ENV === 'development';
    let currentPort = preferredPort;

    for (let i = 0; i < maxRetries; i++) {
        const available = await isPortAvailable(currentPort);

        if (available) {
            return currentPort;
        }

        logger.warn(`Port ${currentPort} is already in use.`);

        if (isDev && currentPort === preferredPort) {
            logger.info(`[Dev] Attempting to free port ${currentPort}...`);
            const killed = await killProcessOnPort(currentPort);

            // Wait a bit for OS to release the port
            if (killed) {
                await new Promise(resolve => setTimeout(resolve, 500));
                if (await isPortAvailable(currentPort)) {
                    logger.info(`Successfully freed port ${currentPort}.`);
                    return currentPort;
                }
            }
        }

        // Try next port
        currentPort++;
        logger.info(`Trying next available port: ${currentPort}...`);
    }

    throw new Error(`Could not find an available port after ${maxRetries} attempts.`);
}
