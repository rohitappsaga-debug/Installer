
import os from 'os';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import { runShellCommand, CommandResult } from './commandRunner';

export interface PostgresStatus {
    installed: boolean;
    version?: string;
    exePath?: string;
    binDir?: string;
    dataDir?: string;
    serviceName?: string;
    error?: {
        code: string;
        message: string;
        details?: string;
        nextStep?: string;
    };
}

/**
 * Detects if the current process has administrative/root privileges.
 */
export const checkPrivileges = async (): Promise<{ ok: boolean; isAdmin: boolean; message: string }> => {
    const platform = os.platform();
    if (platform === 'win32') {
        try {
            const result = await runShellCommand('net', ['session']);
            return {
                ok: result.ok,
                isAdmin: result.ok,
                message: result.ok
                    ? 'Administrator privileges detected.'
                    : 'Administrator privileges required.'
            };
        } catch {
            return { ok: false, isAdmin: false, message: 'Failed to verify Administrator privileges.' };
        }
    } else {
        const isRoot = process.getuid && process.getuid() === 0;
        return {
            ok: !!isRoot,
            isAdmin: !!isRoot,
            message: isRoot ? 'Root privileges detected.' : 'Root privileges required.'
        };
    }
};

/**
 * STEP 1: Detect PostgreSQL Installation
 * Checks for binaries in Program Files and common locations.
 */
export const checkPostgresInstalled = async (onLog?: (msg: string) => void): Promise<PostgresStatus> => {
    onLog?.('[CHECK] Searching for PostgreSQL installation');

    // 1. Try PATH first
    const psqlCheck = await runShellCommand('psql', ['--version']);
    if (psqlCheck.ok) {
        // Robust version extraction: handle "psql (PostgreSQL) 14.12" or just "14.12"
        const versionMatch = psqlCheck.stdout.match(/(\d+(\.\d+)*)/);
        const version = versionMatch ? versionMatch[1] : psqlCheck.stdout.trim();
        onLog?.(`[FOUND] PostgreSQL detected via PATH: ${version}`);
        return { installed: true, version, exePath: 'psql' };
    }

    // 2. Windows-specific deep search in Program Files & common Choco paths
    if (os.platform() === 'win32') {
        const baseDirs = [
            'C:\\Program Files\\PostgreSQL',
            'C:\\Program Files (x86)\\PostgreSQL',
            'C:\\tools\\postgresql14',
            'C:\\tools\\postgresql'
        ];

        for (const base of baseDirs) {
            if (fs.existsSync(base)) {
                try {
                    const items = fs.readdirSync(base);

                    // Priority 1: Check if the base directory ITSELF is a bin dir
                    if (fs.existsSync(path.join(base, 'bin', 'psql.exe'))) {
                        const binDir = path.join(base, 'bin');
                        onLog?.(`[FOUND] PostgreSQL binaries detected at: ${binDir}`);
                        return {
                            installed: true,
                            version: 'unknown',
                            exePath: path.join(binDir, 'psql.exe'),
                            binDir,
                            dataDir: path.join(base, 'data')
                        };
                    }

                    // Priority 2: Check versioned subdirectories (14, 15, 14.22.0 etc)
                    const versions = items.filter(v => /^\d+(\.\d+)*$/.test(v));
                    versions.sort((a, b) => {
                        const ap = a.split('.').map(Number);
                        const bp = b.split('.').map(Number);
                        for (let i = 0; i < Math.max(ap.length, bp.length); i++) {
                            if ((ap[i] || 0) > (bp[i] || 0)) return -1;
                            if ((ap[i] || 0) < (bp[i] || 0)) return 1;
                        }
                        return 0;
                    });

                    for (const ver of versions) {
                        const binDir = path.join(base, ver, 'bin');
                        const dataDir = path.join(base, ver, 'data');
                        const psqlExe = path.join(binDir, 'psql.exe');
                        const pgCtlExe = path.join(binDir, 'pg_ctl.exe');

                        if (fs.existsSync(psqlExe) && fs.existsSync(pgCtlExe)) {
                            onLog?.(`[FOUND] PostgreSQL binaries detected at: ${binDir}`);
                            return {
                                installed: true,
                                version: ver,
                                exePath: psqlExe,
                                binDir,
                                dataDir
                            };
                        }
                    }
                } catch (e) { /* ignore */ }
            }
        }
    }

    onLog?.('[INFO] PostgreSQL binaries not found.');
    return { installed: false };
};

/**
 * STEP 2: Detect Windows PostgreSQL Service
 */
const discoverService = async (onLog?: (msg: string) => void): Promise<string> => {
    onLog?.('[CHECK] Searching for PostgreSQL Windows service');

    const psCmd = 'Get-Service *postgres* | Select-Object -ExpandProperty Name -First 1';
    const psRes = await runShellCommand('powershell.exe', ['-NoProfile', '-Command', psCmd]);
    if (psRes.ok && psRes.stdout.trim()) {
        const name = psRes.stdout.trim();
        onLog?.(`[FOUND] Service detected: ${name}`);
        return name;
    }

    const scRes = await runShellCommand('cmd.exe', ['/c', 'sc query type= service | findstr /I postgres']);
    if (scRes.ok && scRes.stdout.trim()) {
        const match = scRes.stdout.match(/SERVICE_NAME:\s*([^\s\r\n]+)/i);
        if (match && match[1]) {
            onLog?.(`[FOUND] Service detected via sc: ${match[1]}`);
            return match[1];
        }
    }

    onLog?.('[INFO] No PostgreSQL service found.');
    return '';
};

/**
 * Checks if a port is open on localhost.
 */
const isPortOpen = async (port: number): Promise<boolean> => {
    const { execSync } = require('child_process');
    try {
        const cmd = os.platform() === 'win32'
            ? `netstat -ano | findstr :${port} | findstr LISTENING`
            : `lsof -i:${port} -sTCP:LISTEN`;

        const output = execSync(cmd, { stdio: 'pipe' }).toString();
        return output.trim().length > 0;
    } catch (e) {
        return false;
    }
};

/**
 * STEP 3 & 5: Ensure Service Running + Fix Missing Service
 */
export const ensurePostgresRunning = async (onLog?: (msg: string) => void): Promise<boolean> => {
    if (await isPortOpen(5432)) {
        onLog?.('[SUCCESS] PostgreSQL running on port 5432');
        return true;
    }

    const pgStatus = await checkPostgresInstalled(onLog);
    if (!pgStatus.installed) {
        onLog?.('[ERROR] PostgreSQL binaries missing. Cannot start/fix service.');
        return false;
    }

    let serviceName = await discoverService(onLog);

    if (!serviceName && pgStatus.binDir && pgStatus.dataDir) {
        serviceName = `postgresql-x64-${pgStatus.version || '14'}`;
        onLog?.(`[FIX] PostgreSQL service missing, registering service: ${serviceName}`);

        const pgCtl = path.join(pgStatus.binDir, 'pg_ctl.exe');
        const regRes = await runShellCommand(`"${pgCtl}"`, [
            'register',
            '-N', `"${serviceName}"`,
            '-D', `"${pgStatus.dataDir}"`
        ]);

        if (!regRes.ok) {
            onLog?.(`[ERROR] Failed to register service: ${regRes.stderr || regRes.stdout}`);
        }
    }

    if (serviceName) {
        onLog?.(`[START] Starting PostgreSQL service: ${serviceName}`);
        const startRes = await runShellCommand('net', ['start', serviceName]);

        if (startRes.ok || startRes.stdout.includes('already been started') || startRes.stderr.includes('already been started')) {
            onLog?.('[INFO] Waiting 5 seconds for database to initialize...');
            await new Promise(r => setTimeout(r, 5000));

            if (await isPortOpen(5432)) {
                onLog?.('[SUCCESS] PostgreSQL running on port 5432');
                return true;
            }
        } else {
            onLog?.(`[ERROR] Failed to start service: ${startRes.stderr || startRes.stdout}`);
        }
    }

    if (await isPortOpen(5432)) {
        onLog?.('[SUCCESS] PostgreSQL running on port 5432');
        return true;
    }

    onLog?.('[ERROR] PostgreSQL port 5432 is still closed.');
    return false;
};

/**
 * STEP 4: Install PostgreSQL if NOT Installed
 */
export const installPostgres = async (onLog?: (msg: string) => void): Promise<CommandResult> => {
    const platform = os.platform();
    onLog?.('[INSTALL] Starting PostgreSQL 14 Installation...');

    if (platform === 'win32') {
        const verifyAfterStep = async (stepName: string): Promise<boolean> => {
            const check = await checkPostgresInstalled(onLog);
            if (check.installed) {
                onLog?.(`[SUCCESS] ${stepName} verified: binaries found.`);
                return true;
            }
            onLog?.(`[WARN] ${stepName} completed but binaries still missing.`);
            return false;
        };

        // Strategy 1: Portable ZIP (100% robust against EnterpriseDB MSI installer hangs)
        onLog?.('[INSTALL] Strategy 1: Downloading portable PostgreSQL binaries (Bypassing Windows Installers)...');
        const zipUrl = 'https://get.enterprisedb.com/postgresql/postgresql-14.12-1-windows-x64-binaries.zip';
        const tempZip = path.join(os.tmpdir(), 'postgresql-14-binaries.zip');
        const extractBase = 'C:\\tools';
        const finalDir = path.join(extractBase, 'postgresql14');

        onLog?.(`[INFO] Downloading from ${zipUrl}... (This may take a minute)`);
        const downloadCmd = `C:\\Windows\\System32\\curl.exe -L -o "${tempZip}" "${zipUrl}"`;
        const downloadRes = await runShellCommand('cmd.exe', ['/c', downloadCmd], onLog);

        // Ensure target base dir exists
        if (!fs.existsSync(extractBase)) {
            fs.mkdirSync(extractBase, { recursive: true });
        }

        if (downloadRes.ok && fs.existsSync(tempZip)) {
            // Extract strictly the required core dependencies (bin, lib, share)
            // This skips the massive pgAdmin and StackBuilder folders
            onLog?.('[INSTALL] Extracting required PostgreSQL core files to C:\\tools... (Super Fast)');
            const extractCmd = `tar -xf "${tempZip}" -C "${extractBase}" pgsql/bin pgsql/lib pgsql/share`;
            await runShellCommand('cmd.exe', ['/c', extractCmd], onLog);

            const pgsqlDir = path.join(extractBase, 'pgsql');
            if (fs.existsSync(pgsqlDir)) {
                if (fs.existsSync(finalDir)) {
                    fs.rmSync(finalDir, { recursive: true, force: true });
                }
                fs.renameSync(pgsqlDir, finalDir);
            }

            const binDir = path.join(finalDir, 'bin');
            const dataDir = path.join(finalDir, 'data');

            // Clean up old data dir if any to avoid initdb errors
            if (fs.existsSync(dataDir)) {
                fs.rmSync(dataDir, { recursive: true, force: true });
            }

            const pwFile = path.join(os.tmpdir(), 'pgpass.txt');
            fs.writeFileSync(pwFile, 'postgres');

            onLog?.('[INSTALL] Initializing database cluster...');
            const initdbCmd = `& "${path.join(binDir, 'initdb.exe')}" -U postgres --pwfile="${pwFile}" -D "${dataDir}" -E UTF8 --auth=scram-sha-256`;
            const initRes = await runShellCommand('powershell.exe', ['-NoProfile', '-Command', initdbCmd], onLog);

            if (fs.existsSync(pwFile)) fs.unlinkSync(pwFile);

            if (initRes.ok) {
                onLog?.('[INSTALL] Registering PostgreSQL Windows Service...');
                const registerCmd = `& "${path.join(binDir, 'pg_ctl.exe')}" register -N postgresql-x64-14 -D "${dataDir}"`;
                await runShellCommand('powershell.exe', ['-NoProfile', '-Command', registerCmd], onLog);

                if (await verifyAfterStep('Portable ZIP Installation')) {
                    return { ok: true, code: 'SUCCESS', stdout: '', stderr: '', message: 'Portable ZIP Installation success' };
                }
            } else {
                onLog?.(`[ERROR] initdb failed. Output: ${initRes.stderr || initRes.stdout}`);
            }
        } else {
            onLog?.(`[ERROR] Failed to download ZIP binaries. Status: ${downloadRes.stderr || downloadRes.stdout}`);
        }

        // Strategy 2: Chocolatey (Fallback just in case)
        onLog?.('[INSTALL] Strategy 2: Attempting installation via Chocolatey...');
        const chocoRes = await runShellCommand('choco', ['install', 'postgresql14', '-y', '--installArgs', '"--unattendedmodeui none --disable-components pgadmin,stackbuilder"'], onLog);

        if (await verifyAfterStep('Chocolatey')) return { ok: true, code: 'SUCCESS', stdout: '', stderr: '', message: 'Choco success' };

        // If choco said "already installed" but we still don't have binaries
        if (chocoRes.stdout.includes('already installed') || chocoRes.stderr.includes('already installed')) {
            onLog?.('[FIX] Chocolatey reports "already installed" but binaries are missing. Forcing reinstall...');
            await runShellCommand('choco', ['install', 'postgresql14', '-y', '--force', '--installArgs', '"--unattendedmodeui none --disable-components pgadmin,stackbuilder"'], onLog);
            if (await verifyAfterStep('Chocolatey Force')) return { ok: true, code: 'SUCCESS', stdout: '', stderr: '', message: 'Choco force success' };
        }

        return { ok: false, code: 'INSTALL_FAILED', stdout: '', stderr: 'All installation strategies failed.', message: 'PostgreSQL installation failed.' };
    } else {
        onLog?.(`[ERROR] Automatic installation not supported for platform: ${platform}`);
        return { ok: false, code: 'UNKNOWN', stdout: '', stderr: '', message: 'Unsupported platform' };
    }
};

/**
 * STEP 6: Robust Database Readiness Check
 * Retries up to 10 times with a 2-second delay.
 */
export const checkDatabaseReadiness = async (config: any, onLog?: (msg: string) => void): Promise<boolean> => {
    onLog?.('[CHECK] Verifying database readiness...');

    const MAX_RETRIES = 10;
    const DELAY_MS = 2000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const client = new Client({
            host: config.host || 'localhost',
            port: config.port || 5432,
            user: config.user || 'postgres',
            password: config.password || 'root',
            database: config.database || 'rms',
            connectionTimeoutMillis: 5000,
        });

        try {
            await client.connect();
            await client.query('SELECT 1');
            await client.end();
            onLog?.('[OK] Database connection successful');
            onLog?.('Database is ready to use');
            return true;
        } catch (e: any) {
            await client.end().catch(() => { });
            if (attempt < MAX_RETRIES) {
                onLog?.(`[WAIT] Database not ready yet (Attempt ${attempt}/${MAX_RETRIES}). Retrying in 2s...`);
                await new Promise(r => setTimeout(r, DELAY_MS));
            } else {
                onLog?.(`[ERROR] Database connection failed after ${MAX_RETRIES} attempts: ${e.message}`);
                onLog?.('[ERROR] Database is not ready. Please check PostgreSQL installation.');
            }
        }
    }

    return false;
};


/**
 * STEP 4 (Provisioning): Reset Password & Create DB
 */
export const robustProvisionPostgres = async (onLog?: (msg: string) => void): Promise<boolean> => {
    onLog?.('[CONFIG] Beginning PostgreSQL provisioning sequence');

    const attemptConnection = async (pwd: string) => {
        const client = new Client({
            host: 'localhost', port: 5432, user: 'postgres', password: pwd,
            database: 'postgres', connectionTimeoutMillis: 2000
        });
        try {
            await client.connect();
            return client;
        } catch {
            await client.end().catch(() => { });
            return null;
        }
    };

    const commonPasswords = ['root', 'postgres', '', 'password', 'Restaurant123'];
    let client: Client | null = null;

    for (const pwd of commonPasswords) {
        onLog?.(`[CHECK] Testing connection with password: ${pwd || '(empty)'}`);
        client = await attemptConnection(pwd);
        if (client) break;
    }

    if (!client) {
        onLog?.('[ERROR] Could not gain access to PostgreSQL with default passwords.');
        return false;
    }

    try {
        onLog?.('[CONFIG] Resetting "postgres" password to "root"...');
        await client.query("ALTER USER postgres PASSWORD 'root'");

        onLog?.('[CONFIG] Forcing a fresh "rms" database...');
        // We disconnect from 'rms' first if possible by connecting to 'postgres' (already done)
        // and then dropping it.
        await client.query('DROP DATABASE IF EXISTS rms');
        await client.query('CREATE DATABASE rms');

        await client.end();
        onLog?.('[SUCCESS] Fresh PostgreSQL database "rms" created.');
        return true;
    } catch (err: any) {
        onLog?.(`[ERROR] Provisioning failed: ${err.message}`);
        await client?.end().catch(() => { });
        return false;
    }
};
