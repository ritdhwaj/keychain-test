import * as dotenv from 'dotenv';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';


// Load .env by NODE_ENV (fallback to .env)
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
console.log(`[CONFIG] Loading environment file: ${envFile} (NODE_ENV=${process.env.NODE_ENV})`);
const result = dotenv.config({ path: envFile });

if (result.error) {
  console.error(`[CONFIG] Error loading ${envFile}:`, result.error.message);
} else {
  console.log(`[CONFIG] Successfully loaded ${envFile}`);
  console.log(`[CONFIG] BASE_URL: ${process.env.BASE_URL}`);
  console.log(`[CONFIG] USERNAME: ${process.env.USERNAME}`);
}

type Cfg = {
  baseURL: string;
  apiBaseURL: string;
  adminApiBaseUrl: string;
  erpApiBaseUrl?: string;
  ezpayBaseUrl?: string;
  username?: string;
  password?: string;
  adminUsername?: string;
  adminPassword?: string;
  adminClientId?: string;
  adminClientSecret?: string;
  headless: boolean;
  retries: number;
  timeout: number;
  viewportWidth: number;
  viewportHeight: number;
  trace: 'on' | 'off' | 'retain-on-failure';
  video: 'on' | 'off' | 'retain-on-failure';
  grep?: string;
  tags?: string;
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
};

const argv = yargs(hideBin(process.argv))
  .option('baseURL', { type: 'string' })
  .option('apiBaseURL', { type: 'string' })
  .option('adminApiBaseUrl', { type: 'string' })
  .option('headless', { type: 'boolean' })
  .option('retries', { type: 'number' })
  .option('timeout', { type: 'number' })
  .option('viewportWidth', { type: 'number' })
  .option('viewportHeight', { type: 'number' })
  .option('trace', { choices: ['on', 'off', 'retain-on-failure'] as const })
  .option('video', { choices: ['on', 'off', 'retain-on-failure'] as const })
  .option('grep', { type: 'string' })
  .option('tags', { type: 'string' })
  .option('logLevel', { choices: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const })
  .parseSync();

export const config: Cfg = {
  baseURL: argv.baseURL || process.env.BASE_URL || 'https://www.pw.live',
  apiBaseURL: argv.apiBaseURL || process.env.API_BASE_URL || 'https://stage-api.penpencil.com',
  adminApiBaseUrl: argv.adminApiBaseUrl || process.env.ADMIN_API_BASE_URL || 'https://admin-stage-api.penpencil.com',
  erpApiBaseUrl: process.env.ERP_API_BASE_URL || 'https://pwerp.onmouseclick.com',
  ezpayBaseUrl: process.env.EZPAY_BASE_URL || 'https://pw-pay-stage.physicswallah.live/auth',
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
  adminUsername: process.env.ADMIN_USERNAME,
  adminPassword: process.env.ADMIN_PASSWORD,
  adminClientId: process.env.ADMIN_CLIENT_ID,
  adminClientSecret: process.env.ADMIN_CLIENT_SECRET,
  headless: argv.headless ?? (process.env.HEADLESS !== 'false'),
  retries: argv.retries ?? Number(process.env.RETRIES ?? 1),
  timeout: argv.timeout ?? Number(process.env.TIMEOUT ?? 60000),
  viewportWidth: argv.viewportWidth ?? Number(process.env.VIEWPORT_WIDTH ?? 1920),
  viewportHeight: argv.viewportHeight ?? Number(process.env.VIEWPORT_HEIGHT ?? 1080),
  trace: (argv.trace as any) || (process.env.TRACE as any) || 'on',
  video: (argv.video as any) || (process.env.VIDEO as any) || 'retain-on-failure',
  grep: argv.grep || process.env.GREP,
  tags: argv.tags || process.env.TAGS,
  logLevel: (argv.logLevel as any) || (process.env.LOG_LEVEL as any) || 'info',
};

// ============================================
// Configuration Validation
// ============================================

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates the configuration to ensure all required environment variables are set
 * and values are within acceptable ranges.
 */
export function validateConfig(strictMode: boolean = false): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required environment variables
  const required = ['BASE_URL', 'API_BASE_URL', 'ADMIN_API_BASE_URL'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    errors.push(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate URLs
  if (config.baseURL) {
    try {
      new URL(config.baseURL);
    } catch (error) {
      errors.push(`Invalid BASE_URL format: ${config.baseURL}`);
    }
  }

  if (config.apiBaseURL) {
    try {
      new URL(config.apiBaseURL);
    } catch (error) {
      errors.push(`Invalid API_BASE_URL format: ${config.apiBaseURL}`);
    }
  }
  if (config.adminApiBaseUrl) {
    try {
      new URL(config.adminApiBaseUrl);
    } catch (error) {
      errors.push(`Invalid ADMIN_API_BASE_URL format: ${config.adminApiBaseUrl}`);
    }
  }

  // Validate numeric ranges
  if (config.timeout < 5000 || config.timeout > 300000) {
    warnings.push(`Timeout value ${config.timeout}ms is outside recommended range (5000-300000ms)`);
  }

  if (config.retries < 0 || config.retries > 5) {
    warnings.push(`Retries value ${config.retries} is outside recommended range (0-5)`);
  }

  if (config.viewportWidth < 320 || config.viewportWidth > 3840) {
    warnings.push(`Viewport width ${config.viewportWidth}px is outside recommended range (320-3840px)`);
  }

  if (config.viewportHeight < 240 || config.viewportHeight > 2160) {
    warnings.push(`Viewport height ${config.viewportHeight}px is outside recommended range (240-2160px)`);
  }

  // Validate environment-specific settings
  const env = process.env.NODE_ENV || process.env.ENV;
  if (env && !['test', 'staging', 'production', 'development'].includes(env)) {
    warnings.push(`Unknown environment: ${env}. Expected: test, staging, production, or development`);
  }

  // Check for authentication credentials in non-local environments
  if (env === 'production' && (!config.username || !config.password)) {
    warnings.push('Username or password not set for production environment');
  }

  // Strict mode validations
  if (strictMode) {
    if (!config.username) {
      errors.push('USERNAME is required in strict mode');
    }
    if (!config.password) {
      errors.push('PASSWORD is required in strict mode');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates configuration and throws an error if validation fails.
 * Logs warnings to console.
 */
export function assertValidConfig(strictMode: boolean = false): void {
  const result = validateConfig(strictMode);

  // Log warnings
  if (result.warnings.length > 0) {
    console.warn('⚠️  Configuration Warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  // Throw errors
  if (!result.isValid) {
    const errorMessage = [
      '❌ Configuration Validation Failed:',
      ...result.errors.map(err => `  - ${err}`),
      '',
      'Please check your .env file or environment variables.'
    ].join('\n');
    
    throw new Error(errorMessage);
  }

  // Success message
  console.log('✅ Configuration validated successfully');
  console.log(`   Environment: ${process.env.NODE_ENV || process.env.ENV || 'default'}`);
  console.log(`   Base URL: ${config.baseURL}`);
  console.log(`   API URL: ${config.apiBaseURL}`);
  console.log(`   Admin API URL: ${config.adminApiBaseUrl}`);
}

/**
 * Prints current configuration in a readable format
 */
export function printConfig(): void {
  console.log('\n📋 Current Configuration:');
  console.log('════════════════════════════════════════');
  console.log(`  Environment:        ${process.env.NODE_ENV || process.env.ENV || 'default'}`);
  console.log(`  Base URL:           ${config.baseURL}`);
  console.log(`  API Base URL:       ${config.apiBaseURL}`);
  console.log(`  Admin API URL:      ${config.adminApiBaseUrl}`);
  console.log(`  Headless:           ${config.headless}`);
  console.log(`  Retries:            ${config.retries}`);
  console.log(`  Timeout:            ${config.timeout}ms`);
  console.log(`  Viewport:           ${config.viewportWidth}x${config.viewportHeight}`);
  console.log(`  Trace:              ${config.trace}`);
  console.log(`  Video:              ${config.video}`);
  console.log(`  Log Level:          ${config.logLevel}`);
  if (config.username) console.log(`  Username:           ${config.username}`);
  if (config.adminUsername) console.log(`  Admin Username:     ${config.adminUsername}`);
  if (config.adminClientId) console.log(`  Admin Client ID:    ${config.adminClientId}`);
  if (config.grep) console.log(`  Test Filter:        ${config.grep}`);
  if (config.tags) console.log(`  Tags:               ${config.tags}`);
  console.log('════════════════════════════════════════\n');
}

// Auto-validate on import (can be disabled by setting SKIP_CONFIG_VALIDATION=true)
// Note: Validation is delayed to allow .env files to be loaded first
if (process.env.SKIP_CONFIG_VALIDATION !== 'true') {
  // Use setImmediate to delay validation until after all imports are processed
  setImmediate(() => {
    try {
      assertValidConfig(false); // Set to true for strict mode
    } catch (error) {
      console.error(error);
      // Don't exit in Playwright context, just log the error
      if (!process.env.PLAYWRIGHT) {
        process.exit(1);
      }
    }
  });
}

