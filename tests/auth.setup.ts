import { test as setup } from '@playwright/test';
import { ConduitSignInPage } from '../src/pages/ConduitSignInPage';
import { config } from '../src/utils/config';

setup('authenticate', async ({ page }) => {
  const signInPage = new ConduitSignInPage(page);
  
  const email = process.env.CONDUIT_TEST_EMAIL || 'conduituser@test.com';
  const password = process.env.CONDUIT_TEST_PASSWORD || 'Conduit@123';
  
  await signInPage.navigateToSignIn(config.baseURL);
  await signInPage.signIn(email, password);
  
  await page.waitForURL(`${config.baseURL}/`);
  await page.context().storageState({ path: 'auth.json' });
});

