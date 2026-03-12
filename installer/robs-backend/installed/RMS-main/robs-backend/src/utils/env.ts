/**
 * Environment variable validation and access utilities
 * Validates all required environment variables on startup
 */

interface RequiredEnvVars {
  DATABASE_URL: string;
  JWT_SECRET: string;
}

interface OptionalEnvVars {
  NODE_ENV?: string;
  PORT?: string;
  CORS_ORIGIN?: string;
  SOCKET_CORS_ORIGIN?: string;
  RATE_LIMIT_WINDOW_MS?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
}

/**
 * Validates that all required environment variables are set and effective
 * Throws error with descriptive message if any are incorrect
 */
export function validateEnvironment(): void {
  const missing: string[] = [];
  const errors: string[] = [];

  // Check required variables
  const required: (keyof RequiredEnvVars)[] = ['DATABASE_URL', 'JWT_SECRET'];
  for (const key of required) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    errors.push(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate NODE_ENV
  if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
    errors.push('NODE_ENV must be one of: development, production, test');
  }

  // Validate PORT
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10);
    if (isNaN(port) || port <= 0 || port > 65535) {
      errors.push(`Invalid PORT: ${process.env.PORT}. Must be a number between 1 and 65535.`);
    }
  }

  // Validate JWT_SECRET strength in production
  if (process.env.NODE_ENV === 'production') {
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.length < 32) {
      errors.push(
        'JWT_SECRET must be at least 32 characters long in production.\n' +
        '    Generate a secure secret using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
      );
    }
  }

  // Validate DATABASE_URL format
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && !databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string starting with postgresql:// or postgres://');
  }

  if (errors.length > 0) {
    throw new Error(
      '\n❌ Environment Configuration Error:\n' +
      errors.map(e => `  - ${e}`).join('\n') +
      '\n\n👉 Please check your .env file and ensure all variables are set correctly.\n' +
      '   See .env.example for reference.\n'
    );
  }
}

/**
 * Gets JWT_SECRET with validation
 * Throws error if not set (never uses fallback)
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error(
      'JWT_SECRET environment variable is required and must not be empty.\n' +
      'Please set it in your .env file.'
    );
  }
  return secret;
}

/**
 * Gets a required environment variable
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

/**
 * Gets an optional environment variable with default
 */
export function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

