
import os from 'os';
import fs from 'fs';
import path from 'path';
import net from 'net';
import { PORTS } from '../../config/ports';
import { runShellCommand } from './commandRunner';

export interface PortCheckResult {
    value: number;
    status: 'free' | 'busy';
    message: string;
}

export interface CheckStatus {
    ok: boolean;
    message: string;
    details?: string;
}

export interface SystemCheckResult {
    nodeVersion: string;
    platform: string;
    diskSpace: {
        free: number;
        total: number;
    };
    hasWriteAccess: boolean;
    port: PortCheckResult;
    internet: CheckStatus;
    packageManager: CheckStatus & { manager?: string };
    admin: CheckStatus;
    errors: string[];   // Blocking errors
    warnings: string[]; // Non-blocking warnings
}

export const checkSystemRequirements = async (): Promise<SystemCheckResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const platform = os.platform();

    // 1. Basic Info
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
    if (majorVersion < 18) {
        errors.push(`Node.js version must be >= 18. Current version is ${nodeVersion}.`);
    }

    // 2. Write access check
    let hasWriteAccess = false;
    try {
        const testFile = path.join(process.cwd(), '.write-test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        hasWriteAccess = true;
    } catch {
        errors.push('No write access to current directory.');
    }

    // 3. Internet check
    const internet = await checkInternet();
    if (!internet.ok) {
        warnings.push(internet.message);
    }

    // 4. Admin check
    const admin = await checkAdmin();
    if (!admin.ok && platform === 'win32') {
        warnings.push('Installer not running as Administrator. Auto-install might fail.');
    }

    // 5. Package Manager check
    const pkgManager = await detectPackageManager();
    if (!pkgManager.ok) {
        warnings.push(pkgManager.message);
    }

    // 6. Port check (Backend 3000)
    const portFree = await probePort(PORTS.BACKEND);
    const port: PortCheckResult = {
        value: PORTS.BACKEND,
        status: portFree ? 'free' : 'busy',
        message: portFree
            ? `Port ${PORTS.BACKEND} is free`
            : `Port ${PORTS.BACKEND} is in use by another process`,
    };

    if (!portFree) {
        errors.push(port.message);
    }

    return {
        nodeVersion,
        platform,
        diskSpace: { free: os.freemem(), total: os.totalmem() },
        hasWriteAccess,
        port,
        internet,
        packageManager: pkgManager,
        admin,
        errors,
        warnings,
    };
};

const checkInternet = async (): Promise<CheckStatus> => {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        const timeout = 3000;

        socket.setTimeout(timeout);
        socket.once('connect', () => {
            socket.destroy();
            resolve({ ok: true, message: 'Internet connection available.' });
        });

        socket.once('timeout', () => {
            socket.destroy();
            resolve({ ok: false, message: 'Internet connection timeout. Check your connection.' });
        });

        socket.once('error', () => {
            socket.destroy();
            resolve({ ok: false, message: 'No internet connection detected.' });
        });

        // Connect to Google DNS
        socket.connect(53, '8.8.8.8');
    });
};

const checkAdmin = async (): Promise<CheckStatus> => {
    const platform = os.platform();
    if (platform === 'win32') {
        try {
            // 'net session' fails if not admin
            const result = await runShellCommand('net', ['session']);
            return {
                ok: result.ok,
                message: result.ok ? 'Running with Administrator privileges.' : 'Not running as Administrator.'
            };
        } catch {
            return { ok: false, message: 'Failed to verify Administrator privileges.' };
        }
    } else {
        const isRoot = process.getuid && process.getuid() === 0;
        return {
            ok: !!isRoot,
            message: isRoot ? 'Running as root.' : 'Not running as root.'
        };
    }
};

const detectPackageManager = async (): Promise<CheckStatus & { manager?: string }> => {
    const platform = os.platform();

    if (platform === 'win32') {
        const winget = await runShellCommand('winget', ['--version']);
        if (winget.ok) return { ok: true, manager: 'winget', message: 'Found winget.' };

        const choco = await runShellCommand('choco', ['--version']);
        if (choco.ok) return { ok: true, manager: 'choco', message: 'Found Chocolatey.' };

        return { ok: false, message: 'No package manager found (winget or choco).' };
    } else if (platform === 'linux') {
        const apt = await runShellCommand('apt-get', ['--version']);
        if (apt.ok) return { ok: true, manager: 'apt', message: 'Found apt-get.' };

        const dnf = await runShellCommand('dnf', ['--version']);
        if (dnf.ok) return { ok: true, manager: 'dnf', message: 'Found dnf.' };

        const yum = await runShellCommand('yum', ['--version']);
        if (yum.ok) return { ok: true, manager: 'yum', message: 'Found yum.' };

        return { ok: false, message: 'No supported package manager found (apt, dnf, yum).' };
    } else if (platform === 'darwin') {
        const brew = await runShellCommand('brew', ['--version']);
        if (brew.ok) return { ok: true, manager: 'brew', message: 'Found Homebrew.' };

        return { ok: false, message: 'Homebrew not found.' };
    }

    return { ok: false, message: `Package manager detection not supported on ${platform}.` };
};

const probePort = (port: number): Promise<boolean> =>
    new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => resolve(false));
        server.once('listening', () => server.close(() => resolve(true)));
        server.listen(port, '0.0.0.0');
    });
