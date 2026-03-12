import { createServer, Server } from 'http';
import { logger } from './logger';
import net from 'net';

/**
 * Checks if a port is in use.
 * @param port The port to check.
 * @returns Promise<boolean> True if port is in use, false otherwise.
 */
export const isPortInUse = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(false);
    });

    server.listen(port);
  });
};

/**
 * Finds the next available port starting from the given port.
 * @param startPort The port to start checking from.
 * @returns Promise<number> The available port.
 */
export const findAvailablePort = async (startPort: number): Promise<number> => {
  let port = startPort;
  while (await isPortInUse(port)) {
    logger.warn(`⚠️  Port ${port} is already in use. Checking next port...`);
    port++;
  }
  return port;
};

/**
 * Starts the express server on an available port.
 * @param server The HTTP server instance to start.
 * @param preferredPort The preferred port number.
 * @returns Promise<number> The actual port the server started on.
 */
export const startServerWithPortHandling = async (server: Server, preferredPort: number): Promise<number> => {
  try {
    const port = await findAvailablePort(preferredPort);

    if (port !== preferredPort) {
      logger.info(`👉 Switching to available port: ${port}`);
    }

    return new Promise((resolve, reject) => {
      server.listen(port, () => {
        resolve(port);
      });

      server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          // Double check in case of race condition
          logger.warn(`⚠️  Port ${port} became busy during startup. Retrying...`);
          server.close();
          // Retry with next port
          startServerWithPortHandling(server, port + 1).then(resolve).catch(reject);
        } else {
          reject(error);
        }
      });
    });
  } catch (error) {
    throw error;
  }
};
