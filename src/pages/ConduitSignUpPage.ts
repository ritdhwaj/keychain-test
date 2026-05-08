import { Page, Locator } from '@playwright/test';
import BasePage from '../base/BasePage';
import { logger } from '../utils/logger';

/**
 * ConduitSignUpPage - Handles Conduit app sign-up page interactions
 *
 * @extends BasePage
 */
export class ConduitSignUpPage extends BasePage {
    // LOCATORS
    private readonly usernameInput: Locator;
    private readonly emailInput: Locator;
    private readonly passwordInput: Locator;
    private readonly signUpButton: Locator;
    private readonly haveAccountLink: Locator;
    private readonly errorMessages: Locator;

    constructor(page: Page) {
        super(page);
        this.usernameInput = page.getByPlaceholder('Username');
        this.emailInput = page.getByPlaceholder('Email');
        this.passwordInput = page.getByPlaceholder('Password');
        this.signUpButton = page.getByRole('button', { name: 'Sign up' });
        this.haveAccountLink = page.getByRole('link', { name: 'Have an account?' });
        this.errorMessages = page.locator('.error-messages');
        logger.info('ConduitSignUpPage initialized');
    }

    async navigateToSignUp(baseURL: string): Promise<void> {
        await this.open(`${baseURL}/register`);
    }

    async signUp(username: string, email: string, password: string): Promise<void> {
        logger.info(`Signing up user: ${username}`);
        await this.fill(this.usernameInput, username);
        await this.fill(this.emailInput, email);
        await this.fill(this.passwordInput, password);
        await this.click(this.signUpButton);
    }

    async getErrorMessages(): Promise<string[]> {
        return await this.errorMessages.locator('li').allTextContents();
    }
}
