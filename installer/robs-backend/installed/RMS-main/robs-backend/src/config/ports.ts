/**
 * ╔═══════════════════════════════════════════════╗
 * ║         SINGLE SOURCE OF TRUTH — PORTS        ║
 * ╚═══════════════════════════════════════════════╝
 *
 * Ports are read from environment variables at runtime so the
 * project works on any machine without manual edits.
 *
 * Set these in robs-backend/.env to override defaults:
 *
 *   PORT=3000            → backend Express / Socket.io server
 *   FRONTEND_PORT=3002   → Vite dev server
 *   INSTALLER_PORT=3005  → web installer UI
 *
 * The installer system-check probes BACKEND only.
 */

/** Default (fallback) port numbers used when the env var is not set. */
export const PORT_DEFAULTS = {
    BACKEND: 3000,
    FRONTEND: 3002,
    INSTALLER: 3005,
} as const;

export type PortName = keyof typeof PORT_DEFAULTS;

/**
 * Returns the configured port for the given service.
 * Reads from the environment first; falls back to PORT_DEFAULTS.
 *
 * @example
 *   const port = getPort('BACKEND'); // process.env.PORT ?? 3000
 */
export function getPort(name: PortName): number {
    const envMap: Record<PortName, string | undefined> = {
        BACKEND: process.env.PORT,
        FRONTEND: process.env.FRONTEND_PORT,
        INSTALLER: process.env.INSTALLER_PORT,
    };

    const raw = envMap[name];
    if (raw !== undefined) {
        const parsed = parseInt(raw, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 65535) {
            return parsed;
        }
        console.warn(
            `⚠️  Invalid value for ${name} port env var ("${raw}"). ` +
            `Using default: ${PORT_DEFAULTS[name]}`,
        );
    }
    return PORT_DEFAULTS[name];
}

/**
 * Convenience object — resolves all ports from env at import time.
 * Use getPort() if you need the value after env has been mutated.
 */
export const PORTS = {
    get BACKEND() { return getPort('BACKEND'); },
    get FRONTEND() { return getPort('FRONTEND'); },
    get INSTALLER() { return getPort('INSTALLER'); },
};
