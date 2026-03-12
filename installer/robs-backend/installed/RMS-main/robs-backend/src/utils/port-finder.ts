import net from 'net';

/**
 * Checks whether a given TCP port is free on localhost.
 */
function isPortFree(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const server = net.createServer();

        server.once('error', () => {
            // Port is in use
            resolve(false);
        });

        server.once('listening', () => {
            server.close(() => resolve(true));
        });

        server.listen(port, '0.0.0.0');
    });
}

/**
 * Finds the first available TCP port starting from `startPort`.
 * Tries up to `maxTries` consecutive ports before throwing.
 *
 * @example
 *   const port = await findAvailablePort(3000);
 *   // Returns 3000 if free, 3001 if 3000 is busy, etc.
 */
export async function findAvailablePort(
    startPort: number,
    maxTries: number = 20,
): Promise<number> {
    for (let i = 0; i < maxTries; i++) {
        const port = startPort + i;
        if (port > 65535) break;

        const free = await isPortFree(port);
        if (free) {
            if (i > 0) {
                console.log(
                    `⚠️  Port ${startPort} is in use. Using port ${port} instead.`,
                );
            }
            return port;
        }
    }

    throw new Error(
        `Unable to find a free port after ${maxTries} attempts ` +
        `starting from port ${startPort}. ` +
        `Please free up a port or set a different PORT in your .env file.`,
    );
}
