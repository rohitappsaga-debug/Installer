
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'robs-backend');
const frontendDir = path.join(rootDir, 'robs-frontend');


function log(msg) {
    console.log(`\x1b[36m[SETUP]\x1b[0m ${msg}`);
}

function error(msg) {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`);
    process.exit(1);
}

function clean() {
    log('Cleaning old files...');
    const pathsToClean = [
        path.join(rootDir, 'node_modules'),
        path.join(rootDir, 'package-lock.json'),
        path.join(backendDir, 'node_modules'),
        path.join(backendDir, 'dist'),
        path.join(backendDir, 'build'),
        path.join(backendDir, 'logs'),
        path.join(backendDir, '.env'),
        path.join(backendDir, 'installed.lock'),
        path.join(backendDir, 'package-lock.json'),
        path.join(backendDir, 'src', 'installer', 'public'),
        path.join(frontendDir, 'node_modules'),

        path.join(frontendDir, 'dist'),
        path.join(frontendDir, 'package-lock.json'),
    ];

    pathsToClean.forEach(p => {
        if (fs.existsSync(p)) {
            log(`Removing ${path.relative(rootDir, p)}...`);
            fs.rmSync(p, { recursive: true, force: true });
        }
    });
}

const npmOptions = {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
    env: {
        ...process.env,
        // Map the @jsr scope to the JSR registry
        NPM_CONFIG_EXTRA_REGISTRY_CONFIG: '@jsr:registry=https://npm.jsr.io'
    }
};

/**
 * Runs a command and returns a promise.
 * Uses spawn with inherit to show real-time progress.
 */
function runCommand(cmd, args, options = {}) {
    return new Promise((resolve, reject) => {
        const p = spawn(cmd, args, { ...npmOptions, ...options });
        p.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Command "${cmd} ${args.join(' ')}" failed with code ${code}`));
        });
    });
}

async function installDeps() {
    log('Checking NPM identity...');
    try {
        await runCommand('npm', ['whoami']);
    } catch (err) {
        log('NPM whoami failed, but proceeding anyway...');
    }

    log('Installing dependencies (root, backend, installer-ui, frontend)...');
    try {
        // We'll use a temporary .npmrc for the JSR mapping because environment variables 
        // for scoped registries can be tricky across different npm versions/OS.
        const tempConfig = path.join(rootDir, '.npmrc_jsr');
        fs.writeFileSync(tempConfig, '@jsr:registry=https://npm.jsr.io\n');

        const localNpmOptions = {
            ...npmOptions,
            env: {
                ...npmOptions.env,
                NPM_CONFIG_USERCONFIG: tempConfig
            }
        };

        const installArgs = ['install', '--no-audit', '--no-fund', '--loglevel=error'];

        log('Running npm install at root...');
        await runCommand('npm', installArgs, { ...localNpmOptions, cwd: rootDir });

        log('Running npm install in robs-backend...');
        await runCommand('npm', installArgs, { ...localNpmOptions, cwd: backendDir });

        log('Running npm install in robs-frontend...');

        if (fs.existsSync(frontendDir)) {
            await runCommand('npm', installArgs, { ...localNpmOptions, cwd: frontendDir });
        }

        // Cleanup temp config
        if (fs.existsSync(tempConfig)) fs.unlinkSync(tempConfig);

    } catch (err) {
        // Cleanup temp config on error too
        const tempConfig = path.join(rootDir, '.npmrc_jsr');
        if (fs.existsSync(tempConfig)) fs.unlinkSync(tempConfig);
        error(`Failed to install dependencies: ${err.message}`);
    }
}


/**
 * Kills processes running on specific ports (Windows).
 */
function killProcessesOnPorts(ports) {
    if (process.platform !== 'win32') {
        log('Skipping port cleanup on non-Windows platform...');
        return;
    }

    log(`Cleaning up ports: ${ports.join(', ')}...`);
    for (const port of ports) {
        try {
            const output = execSync(`netstat -ano | findstr :${port}`).toString().trim();
            if (output) {
                const lines = output.split('\n');
                const pids = new Set();
                lines.forEach(line => {
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[parts.length - 1];
                    if (pid && !isNaN(pid) && pid !== '0') {
                        pids.add(pid);
                    }
                });

                pids.forEach(pid => {
                    log(`Killing process ${pid} on port ${port}...`);
                    try {
                        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
                    } catch (e) { }
                });
            }
        } catch (err) { }
    }
}

async function buildFrontend() {
    log('Building Frontend Application...');
    if (!fs.existsSync(frontendDir)) {
        log('robs-frontend directory not found. Skipping frontend build.');
        return;
    }
    try {
        await runCommand('npm', ['run', 'build'], { cwd: frontendDir });
    } catch (err) {
        log(`[WARN] Frontend build failed: ${err.message}. You may need to build it manually.`);
    }
}

function startInstaller() {
    return new Promise((resolve, reject) => {
        log('Starting Installer Server...');
        log('The backend will start in installer mode because installed.lock is missing.');

        // Run directly with ts-node instead of nodemon to ensure process exits cleanly on Finish
        const backendProcess = spawn('npx', ['ts-node', '-r', 'tsconfig-paths/register', 'src/index.ts'], {
            cwd: backendDir,
            stdio: 'inherit',
            shell: true,
            env: {
                ...process.env,
                NODE_ENV: 'development'
            }
        });

        backendProcess.on('close', (code) => {
            if (code === 0) {
                log('Installer process completed successfully.');
                resolve();
            } else {
                reject(new Error(`Backend process exited with code ${code}`));
            }
        });
    });
}

async function buildExtractedFrontend() {
    log('Building Newly Extracted Application Frontend...');
    const targetDir = path.resolve(__dirname, '..');
    const installedDir = path.join(targetDir, 'installed');
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
        log('Extracted project root not found. Skipping frontend build.');
        return;
    }

    const extractedFrontendDir = path.join(rmsRoot, 'robs-frontend');

    if (!fs.existsSync(extractedFrontendDir)) {
        log('Extracted frontend directory not found. Skipping build.');
        return;
    }

    try {
        const installArgs = ['install', '--no-audit', '--no-fund', '--loglevel=error'];
        log('Installing dependencies for extracted frontend...');
        await runCommand('npm', installArgs, { cwd: extractedFrontendDir });

        log('Running build for extracted frontend...');
        await runCommand('npm', ['run', 'build'], { cwd: extractedFrontendDir });
        log('Extracted frontend build complete.');
    } catch (err) {
        log(`[WARN] Extracted frontend build failed: ${err.message}.`);
    }
}

function startProduction() {
    log('Starting Application in Production/Normal Mode...');
    // For production startup, we can use npm run start:prod from the extracted project root

    // The target directory where RMS was extracted
    const targetDir = path.resolve(__dirname, '..');

    const installedDir = path.join(targetDir, 'installed');
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
        error(`Could not find extracted project root in installed folder. Installation may have failed.`);
        return;
    }

    // Use the backend folder inside the extracted project
    const extractedBackendDir = path.join(rmsRoot, 'robs-backend');

    if (!fs.existsSync(extractedBackendDir)) {
        error(`Could not find extracted backend at ${extractedBackendDir}. Installation may have failed.`);
        return;
    }

    const prodProcess = spawn('npm', ['run', 'start:prod'], {
        cwd: extractedBackendDir,
        stdio: 'inherit',
        shell: true
    });

    prodProcess.on('close', (code) => {
        log(`Application process exited with code ${code}`);
    });
}

async function run() {
    log('Starting RMS Automated Setup...');

    // Kill any hanging processes from previous attempts (Windows only)
    killProcessesOnPorts([3000, 3002, 3005]);

    clean();
    await installDeps();
    await buildFrontend();

    // Step 1: Run the installer and wait for it to finish (User clicks Finish)
    try {
        await startInstaller();
    } catch (err) {
        error(`Installer failed: ${err.message}`);
    }

    // Step 2: Transition to production
    log('--------------------------------------------------');
    log('TRANSITIONING TO PRODUCTION');
    log('--------------------------------------------------');
    log('Installer finished. Starting production server...');

    // Give the OS a moment to fully release port 3005 before we might try 
    // to bind other things or just for cleanliness.
    await new Promise(resolve => setTimeout(resolve, 3000));

    log('🚀 Launching the application at http://localhost:3000');
    log('Please KEEP THIS TERMINAL OPEN to keep the server running.');

    // Step 2.5: Build the newly extracted frontend
    await buildExtractedFrontend();

    // Step 3: Start the main application
    startProduction();
}

run().catch(err => error(err.message));
