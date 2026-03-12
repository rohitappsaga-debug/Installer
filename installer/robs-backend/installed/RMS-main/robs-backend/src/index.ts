import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Main entry point - starts the main application
 */
async function bootstrap() {
  console.log('DEBUG: Starting main application...');
  // Force reload environment variables
  config({ override: true });
  await import('./main');
}

// Start the application
bootstrap().catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
