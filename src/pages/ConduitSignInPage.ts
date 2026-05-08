import { Page, Locator } from '@playwright/test';
import BasePage from '../base/BasePage';
import { logger } from '../utils/logger';

/**
 * ConduitSignInPage - Handles Conduit app sign-in page interactions
 *
 * This page object manages all interactions with the Conduit sign-in page
 * at /login. Includes methods for filling credentials, submitting the form,
 * and verifying success/error states.
 *
 * @extends BasePage
 */
export class ConduitSignInPage extends BasePage {
    // ========================================
    // LOCATORS
    // ========================================

    // Page heading
    private readonly signInHeading: Locator;

    // Form fields
    private readonly emailInput: Locator;
    private readonly passwordInput: Locator;

    // Action buttons / links
    private readonly signInButton: Locator;
    private readonly needAccountLink: Locator;

    // Navigation links
    private readonly homeLink: Locator;
    private readonly signUpNavLink: Locator;

    // Error messages
    private readonly errorList: Locator;

    constructor(page: Page) {
        super(page);

        // Heading
        this.signInHeading = page.getByRole('heading', { name: 'Sign In' });

        // Form fields – semantic selectors preferred per UI.prompt rules
        this.emailInput = page.getByRole('textbox', { name: 'Email' });
        this.passwordInput = page.getByRole('textbox', { name: 'Password' });

        // Buttons & links
        this.signInButton = page.getByRole('button', { name: 'Sign in' });
        this.needAccountLink = page.getByRole('link', { name: 'Need an account?' });

        // Navigation
        this.homeLink = page.getByRole('link', { name: 'Home' });
        this.signUpNavLink = page.getByRole('link', { name: 'Sign up' });

        // Error messages container (ul with error list items)
        this.errorList = page.locator('.error-messages');

        logger.info('ConduitSignInPage initialized with all locators');
    }

    // ========================================
    // PUBLIC METHODS
    // ========================================

    /**
     * Navigate to the sign-in page
     * @param baseURL - The base URL of the Conduit app
     */
    async navigateToSignIn(baseURL: string): Promise<void> {
        logger.info('Navigating to Conduit sign-in page');
        await this.open(`${baseURL}/login`);
        await this.waitForElement(this.signInHeading);
        logger.info('Sign-in page loaded successfully');
    }

    /**
     * Verify the sign-in page is fully loaded with all expected elements
     * @returns true if all elements are visible
     */
    async isSignInPageLoaded(): Promise<boolean> {
        try {
            const headingVisible = await this.isVisible(this.signInHeading);
            const emailVisible = await this.isVisible(this.emailInput);
            const passwordVisible = await this.isVisible(this.passwordInput);
            const buttonVisible = await this.isVisible(this.signInButton);
            const linkVisible = await this.isVisible(this.needAccountLink);

            const allVisible = headingVisible && emailVisible && passwordVisible && buttonVisible && linkVisible;
            logger.info(`Sign-in page loaded check: ${allVisible}`);
            return allVisible;
        } catch (error) {
            logger.error(`Failed to verify sign-in page: ${error}`);
            return false;
        }
    }

    /**
     * Fill in the email field
     * @param email - Email address to enter
     */
    async fillEmail(email: string): Promise<void> {
        logger.info(`Filling email field with: ${email}`);
        await this.fill(this.emailInput, email);
    }

    /**
     * Fill in the password field
     * @param password - Password to enter
     */
    async fillPassword(password: string): Promise<void> {
        logger.info('Filling password field');
        await this.fill(this.passwordInput, password);
    }

    /**
     * Click the Sign In button
     */
    async clickSignIn(): Promise<void> {
        logger.info('Clicking Sign In button');
        await this.click(this.signInButton);
    }

    /**
     * Perform a complete sign-in flow
     * @param email - Email address
     * @param password - Password
     */
    async signIn(email: string, password: string): Promise<void> {
        logger.info(`Performing sign-in with email: ${email}`);
        await this.fillEmail(email);
        await this.fillPassword(password);
        await this.clickSignIn();
    }

    /**
     * Check if error messages are displayed on the page
     * @returns true if error messages are visible
     */
    async isErrorMessageVisible(): Promise<boolean> {
        try {
            return await this.isVisible(this.errorList, { timeout: 5000 });
        } catch {
            return false;
        }
    }

    /**
     * Get the text content of displayed error messages
     * @returns Array of error message strings
     */
    async getErrorMessages(): Promise<string[]> {
        try {
            const isVisible = await this.isErrorMessageVisible();
            if (!isVisible) return [];

            const items = this.errorList.locator('li');
            const count = await items.count();
            const messages: string[] = [];
            for (let i = 0; i < count; i++) {
                const text = await items.nth(i).textContent();
                if (text) messages.push(text.trim());
            }
            logger.info(`Error messages found: ${messages.join(', ')}`);
            return messages;
        } catch (error) {
            logger.error(`Failed to get error messages: ${error}`);
            return [];
        }
    }

    /**
     * Click the "Need an account?" link to navigate to registration
     */
    async clickNeedAccount(): Promise<void> {
        logger.info('Clicking "Need an account?" link');
        await this.click(this.needAccountLink);
    }

    /**
     * Check if the Sign In button is enabled
     * @returns true if button is enabled
     */
    async isSignInButtonEnabled(): Promise<boolean> {
        return await this.isElementEnabled(this.signInButton);
    }

    /**
     * Clear both email and password fields
     */
    async clearForm(): Promise<void> {
        logger.info('Clearing sign-in form fields');
        await this.clear(this.emailInput);
        await this.clear(this.passwordInput);
    }
}
