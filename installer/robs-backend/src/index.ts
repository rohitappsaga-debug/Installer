import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load initial environment
config();

// Define lock file path
const LOCK_FILE = path.join(process.cwd(), 'installed.lock');

/**
 * Main bootstrap function to start either the installer or the main app.
 */
async function bootstrap() {
  console.log('DEBUG: Checking for installed.lock...');

  if (!fs.existsSync(LOCK_FILE)) {
    // Installer Mode
    console.log('Checking for installed.lock... NOT FOUND. Starting Installer Mode.');
    const { startInstallerServer } = await import('./installer/server');
    await startInstallerServer();
  } else {
    // Main Application Mode
    console.log('Checking for installed.lock... FOUND. Starting Main Application.');

    // Force reload environment variables just before main app starts
    // to ensure any changes from the installer are effective
    config({ override: true });

    // Dynamic import of the main application to avoid side effects (DB connection, etc.) 
    // running during installer mode
    try {
      // Use a template literal to bypass static analysis for ts-node/typescript
      const mainModule = './main';
      await import(`${mainModule}`);
    } catch (err) {
      console.log('Main application not found (Stand-alone installer mode).');
      console.log('Once the installation is complete, you will need to point to your actual application source.');
    }

  }
}

/**
 * Swaps from installer mode to main app mode without restarting the process.
 */
export async function switchToMainApp() {
  console.log('DEBUG: Switching to main application mode...');

  // Force reload environment variables to ensure any changes from the installer are effective
  config({ override: true });

  // 1. Stop the installer server gracefully
  const { stopInstallerServer } = await import('./installer/server');
  stopInstallerServer();

  // 2. Re-run bootstrap (which will now find the lock file)
  await bootstrap().catch(err => {
    console.error('Failed to switch to main application:', err);
    process.exit(1);
  });
}

// Start the application
bootstrap().catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
