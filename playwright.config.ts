import { defineConfig, devices } from '@playwright/test';
import { config as app } from './src/utils/config';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Synchronize NODE_ENV and ENV - if either is set, both get the same value
// Priority: ENV > NODE_ENV > 'staging' (default)
const environment = process.env.ENV || process.env.NODE_ENV || 'staging'; // Dont update this to production - default should always be lower risk environment
process.env.NODE_ENV = environment;
process.env.ENV = environment;
dotenv.config({ path: `.env.${environment}` });

const useAuthState = process.env.USE_AUTH_STATE === 'true';

// Modify grep to always include setup when using auth state
// Don't apply grep globally - let each project handle it
const grep = undefined; // Global grep disabled - use project-level grep instead

export default defineConfig({
  testDir: './tests',
  // testIgnore: '**/api/**',
  timeout: app.timeout,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1, // Force single worker for single browser
  retries: app.retries,
  reporter: [
    ['json', { outputFile: 'results.json' }],
    ['list'],
    ['html', { open: 'never' }],
    ['allure-playwright'],
    ['junit', { outputFile: 'reports/junit/results.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL,
    headless: app.headless,
    viewport: { width: app.viewportWidth, height: app.viewportHeight },
    trace: app.trace || 'on',
    video: app.video || 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 45000, // Increase action timeout
    permissions: [],
  },
  projects: [
    {
      name: 'setup',
      testMatch: 'tests/auth.setup.ts',
      // No grep - setup should always run
      fullyParallel: false, // Setup must run serially
    },
     {
      name: 'ordersAuthSetup',
      testMatch: 'tests/batch.auth.setup.ts',
      // No grep - setup should always run
      fullyParallel: false, // Setup must run serially
    },
    {
      name: 'cjrAuthSetup',
      testMatch: 'tests/cjr.auth.setup.ts',
      fullyParallel: false,
    },
    {
      name: 'login',
      testMatch: /tests\/ui\/Login\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], storageState: undefined },
      grep: app.grep ? new RegExp(app.grep) : undefined, // Apply grep for login tests
    },
    { 
      name: 'Chromium', 
      use: { 
        ...devices['Desktop Chrome'], 
        storageState: useAuthState ? 'auth.json' : undefined,
      }, 
      dependencies: useAuthState ? ['setup'] : [], 
      testIgnore: [/tests\/ui\/Login\.spec\.ts$/, /tests\/api\/.*\.ts$/, /tests\/ui\/CjrRevmapHome\.spec\.ts$/, /tests\/ui\/CjrExplorePage\.spec\.ts$/, /tests\/ui\/CjrOpenSession\.spec\.ts$/, /tests\/ui\/orderFlows\/.*\.ts$/, /tests\/ui\/ezPay\/.*\.ts$/, /tests\/ui\/CentrePage\/.*\.spec\.ts$/, /tests\/ui\/vpFlows\/.*\.spec\.ts$/], // ignore login + API + CJR + orderFlows + ezPay + CentrePage + vpFlows tests
      grep: app.grep ? new RegExp(app.grep) : undefined, // Apply grep for Chromium tests
    },
    {
      name: 'CJR',
      use: { 
        ...devices['Desktop Chrome'], 
        storageState: 'cjrAuth.json',
      }, 
      dependencies: ['cjrAuthSetup'],
      testMatch:[ /tests\/ui\/CjrRevmapHome\.spec\.ts$/, /tests\/ui\/CjrExplorePage\.spec\.ts$/, /tests\/ui\/CjrOpenSession\.spec\.ts$/],
      grep: app.grep ? new RegExp(app.grep) : undefined,
    },
    {
      name: 'CentrePage-NoSetup',
      use: { 
        ...devices['Desktop Chrome'], 
        storageState: undefined, // CentrePage has its own auth flow
      }, 
      dependencies: [], // CentrePage doesn't depend on setup
      testMatch:[ /tests\/ui\/CentrePage\/.*\.spec\.ts$/, /tests\/ui\/vpFlows\/.*\.spec\.ts$/ ],
      grep: app.grep ? new RegExp(app.grep) : undefined, // Apply grep for CentrePage tests
    },
    {
      name: 'API',
      testMatch: /tests\/api\/.*\.ts$/,
      testIgnore: environment !== 'staging' ? /tests\/api\/contracts\/.*\.ts$/ : undefined, // Run contract tests only in staging (Don't remove this - contract tests are expensive and should not run in every environment)
      use: { ...devices['Desktop Chrome'], storageState: undefined },
      dependencies: [],
      grep: app.grep ? new RegExp(app.grep) : undefined,
    },
    {
      name: 'OrderFlows Independent session',
      testMatch: /tests\/ui\/orderFlows\/.*\.ts$/,
      use: { 
        ...devices['Desktop Chrome'], 
        storageState: useAuthState ? 'ordersAuth.json' : undefined,
      }, 
      dependencies: useAuthState ? ['ordersAuthSetup'] : [], 
      fullyParallel: false,
    },
    // { name: 'WebKit', use: { ...devices['Desktop Safari'] } },
  ],
});