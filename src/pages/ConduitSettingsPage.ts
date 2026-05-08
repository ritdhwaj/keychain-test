import { Page, Locator } from '@playwright/test';
import BasePage from '../base/BasePage';
import { logger } from '../utils/logger';

/**
 * ConduitSettingsPage - Handles user settings and profile updates
 *
 * @extends BasePage
 */
export class ConduitSettingsPage extends BasePage {
    private readonly profilePictureInput: Locator;
    private readonly usernameInput: Locator;
    private readonly bioInput: Locator;
    private readonly emailInput: Locator;
    private readonly passwordInput: Locator;
    private readonly updateButton: Locator;
    private readonly logoutButton: Locator;

    constructor(page: Page) {
        super(page);
        
        this.profilePictureInput = page.getByPlaceholder('URL of profile picture');
        this.usernameInput = page.getByPlaceholder('Your Name');
        this.bioInput = page.getByPlaceholder('Short bio about you');
        this.emailInput = page.getByPlaceholder('Email');
        this.passwordInput = page.getByPlaceholder('Password');
        this.updateButton = page.getByRole('button', { name: 'Update Settings' });
        this.logoutButton = page.getByRole('button', { name: 'Or click here to logout.' });
        
        logger.info('ConduitSettingsPage initialized');
    }

    get bioLocator() { return this.bioInput; }
    get logoutBtn() { return this.logoutButton; }

    async updateBio(newBio: string): Promise<void> {
        logger.info(`Updating bio to: ${newBio}`);
        await this.fill(this.bioInput, newBio);
        await this.click(this.updateButton);
    }

    async logout(): Promise<void> {
        logger.info('Logging out from settings');
        await this.click(this.logoutButton);
    }
}
