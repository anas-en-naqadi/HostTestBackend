import { config } from 'dotenv';
import path from 'path';

export function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  const envLocalPath = path.resolve(process.cwd(), '.env.local');

  if (require('fs').existsSync(envPath)) {
    config({ path: envPath });
    console.log('Loaded environment variables from .env');
  } else if (require('fs').existsSync(envLocalPath)) {
    config({ path: envLocalPath });
    console.log('Loaded environment variables from .env.local');
  } else {
    console.warn('No environment file found. Using process.env');
  }

  // Validate required environment variables
  const requiredEnvVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DATABASE_URL',
    'PORT',
    'NODE_ENV'
  ];

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    process.exit(1);
  }
}
