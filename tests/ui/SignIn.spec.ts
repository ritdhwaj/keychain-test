import { test, expect } from '../../src/fixtures/TestFixtures';

/**
 * Sign In Test Suite for Conduit Application (http://localhost:4101)
 *
 * Covers:
 *  - Positive: successful login with valid credentials
 *  - Negative: invalid password, non-existent user
 *  - Edge cases: empty fields, empty email, empty password
 *  - Visual: page elements visibility, error message content
 *  - Navigation: "Need an account?" link redirects to /register
 */

// Base URL – reads from .env (BASE_URL), falls back to localhost
const CONDUIT_BASE_URL = process.env.BASE_URL || 'http://localhost:4101';

// Valid test user – registered via the Conduit Sign Up flow
const VALID_USER = {
    email: process.env.CONDUIT_TEST_EMAIL || 'conduituser@test.com',
    password: process.env.CONDUIT_TEST_PASSWORD || 'Conduit@123',
    username: 'conduituser',
};

test.describe('Conduit Sign In Page', () => {

    // ─── Setup ───────────────────────────────────────────────
    test.beforeEach(async ({ conduitSignInPage }) => {
        await conduitSignInPage.navigateToSignIn(CONDUIT_BASE_URL);
    });

    // ─── Visual / UI verification ────────────────────────────

    test('should display all sign-in page elements', async ({ conduitSignInPage }) => {
        // Arrange & Act – page already loaded in beforeEach

        // Assert – verify every expected element is visible
        const isLoaded = await conduitSignInPage.isSignInPageLoaded();
        expect(isLoaded).toBeTruthy();
    });

    test('should have Sign In button enabled by default', async ({ conduitSignInPage }) => {
        // Assert
        const isEnabled = await conduitSignInPage.isSignInButtonEnabled();
        expect(isEnabled).toBeTruthy();
    });

    // ─── Positive tests (happy path) ─────────────────────────

    test('should sign in successfully with valid credentials', async ({ conduitSignInPage, page }) => {
        // Arrange – credentials defined above

        // Act
        await conduitSignInPage.signIn(VALID_USER.email, VALID_USER.password);

        // Assert – SPA stays at '/' after login; wait for the user nav link to confirm success
        const userNav = page.getByRole('link', { name: VALID_USER.username });
        await expect(userNav).toBeVisible({ timeout: 15000 });
        expect(page.url()).not.toContain('/login');
    });

    // ─── Negative tests ──────────────────────────────────────

    test('should show error when signing in with wrong password', async ({ conduitSignInPage }) => {
        // Arrange
        const wrongPassword = 'WrongPassword999';

        // Act
        await conduitSignInPage.signIn(VALID_USER.email, wrongPassword);

        // Assert – error message should be visible
        const hasError = await conduitSignInPage.isErrorMessageVisible();
        expect(hasError).toBeTruthy();

        const errors = await conduitSignInPage.getErrorMessages();
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(msg => msg.toLowerCase().includes('invalid'))).toBeTruthy();
    });

    test('should show error when signing in with non-existent email', async ({ conduitSignInPage }) => {
        // Arrange
        const fakeEmail = 'nobody_here@doesnotexist.com';

        // Act
        await conduitSignInPage.signIn(fakeEmail, 'SomePassword1!');

        // Assert
        const hasError = await conduitSignInPage.isErrorMessageVisible();
        expect(hasError).toBeTruthy();

        const errors = await conduitSignInPage.getErrorMessages();
        expect(errors.some(msg => msg.toLowerCase().includes('invalid'))).toBeTruthy();
    });

    // ─── Edge case tests ─────────────────────────────────────

    test('should show error when submitting with both fields empty', async ({ conduitSignInPage }) => {
        // Arrange – fields are already empty

        // Act
        await conduitSignInPage.clickSignIn();

        // Assert
        const hasError = await conduitSignInPage.isErrorMessageVisible();
        expect(hasError).toBeTruthy();
    });

    test('should show error when email is empty', async ({ conduitSignInPage }) => {
        // Arrange & Act
        await conduitSignInPage.fillPassword('SomePassword1!');
        await conduitSignInPage.clickSignIn();

        // Assert
        const hasError = await conduitSignInPage.isErrorMessageVisible();
        expect(hasError).toBeTruthy();
    });

    test('should show error when password is empty', async ({ conduitSignInPage }) => {
        // Arrange & Act
        await conduitSignInPage.fillEmail(VALID_USER.email);
        await conduitSignInPage.clickSignIn();

        // Assert
        const hasError = await conduitSignInPage.isErrorMessageVisible();
        expect(hasError).toBeTruthy();
    });

    // ─── Navigation tests ────────────────────────────────────

    test('should navigate to registration page via "Need an account?" link', async ({ conduitSignInPage, page }) => {
        // Act
        await conduitSignInPage.clickNeedAccount();

        // Assert
        await page.waitForURL('**/register', { timeout: 10000 });
        expect(page.url()).toContain('/register');

        // Verify the Sign Up heading is visible on the registration page
        const signUpHeading = page.getByRole('heading', { name: 'Sign Up' });
        await expect(signUpHeading).toBeVisible({ timeout: 5000 });
    });
});
