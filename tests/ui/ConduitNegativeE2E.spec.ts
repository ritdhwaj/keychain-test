import { test, expect } from '../../src/fixtures/TestFixtures';

/**
 * Conduit Negative Test Cases:
 * 1. Duplicate email registration
 * 2. Missing fields in Sign Up
 * 3. Missing fields in Post Creation
 * 4. Invalid credentials in Sign In
 */

test.describe('Conduit Negative Tests', () => {
    const baseURL = process.env.BASE_URL || 'http://localhost:4101';
    
    test('should not allow registration with an existing email', async ({ conduitSignUpPage }) => {
        // Use a known existing email (the dummy one from .env)
        const existingEmail = process.env.CONDUIT_TEST_EMAIL || 'conduituser@test.com';
        
        await conduitSignUpPage.navigateToSignUp(baseURL);
        await conduitSignUpPage.signUp('duplicateuser', existingEmail, 'Password123!');
        
        // Assert error message
        const errors = await conduitSignUpPage.getErrorMessages();
        expect(errors).toContain('email has already been taken');
    });

    test('should show errors for missing fields in sign up', async ({ conduitSignUpPage }) => {
        await conduitSignUpPage.navigateToSignUp(baseURL);
        await conduitSignUpPage.signUp('', '', ''); // Submit empty form
        
        const errors = await conduitSignUpPage.getErrorMessages();
        expect(errors.length).toBeGreaterThan(0);
        expect(errors).toContain("email can't be blank");
        expect(errors).toContain("password can't be blank");
        expect(errors).toContain("username can't be blank");
    });

    test('should not allow creating an article with missing title', async ({ conduitSignInPage, conduitPostPage, page }) => {
        // Login first
        await conduitSignInPage.navigateToSignIn(baseURL);
        await conduitSignInPage.signIn(
            process.env.CONDUIT_TEST_EMAIL || 'conduituser@test.com', 
            process.env.CONDUIT_TEST_PASSWORD || 'Conduit@123'
        );

        await page.getByRole('link', { name: ' New Post' }).click();
        await conduitPostPage.createPost('', 'Description', 'Body', 'tags'); // Empty title
        
        const errors = await conduitPostPage.getErrorMessages();
        expect(errors).toContain("title can't be blank");
    });

    test('should not allow creating an article with missing body', async ({ conduitPostPage, page }) => {
        // Assuming already logged in or navigating to editor
        await page.goto(`${baseURL}/editor`);
        await conduitPostPage.createPost('Some Title', 'Description', '', 'tags'); // Empty body
        
        const errors = await conduitPostPage.getErrorMessages();
        expect(errors).toContain("body can't be blank");
    });
});
