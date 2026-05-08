import { Page, expect, Browser, BrowserContext } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import BasePage from './BasePage';
import { Constants } from '../constants/Constants';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

/**
 * PWWebLibrary - Physics Wallah Web Application specific utility class
 * Contains common methods specifically for PW platform functionality
 */
export class PWWebLibrary extends BasePage {
    private loginPage: LoginPage;

    constructor(page: Page) {
        super(page);
        this.loginPage = new LoginPage(page);
    }

    /**
     * Static helper method for authentication - used by auth.setup.ts and test fail-safes
     * This provides a reusable way to perform login without code duplication
     * 
     * @param page - Playwright Page object
     * @param mobile - Mobile number (optional, defaults to env variable)
     * @param otp - OTP (optional, defaults to env variable)
     * @returns Promise<boolean> - True if login successful
     */
    static async performLogin(
        page: Page,
        mobile?: string,
        otp?: string
    ): Promise<boolean> {
        const pwLib = new PWWebLibrary(page);
        const mobileNumber = mobile || process.env.USERNAME || '7827230144';
        const otpValue = otp || process.env.PASSWORD || '424465';
        console.log(`Performing login with mobile: ${mobileNumber} and OTP: ${otpValue}`);
        const loginSuccess = await pwLib.loginToPwWeb(mobileNumber, otpValue);

        if (!loginSuccess) {
            throw new Error('❌ Login failed');
        }

        return loginSuccess;
    }

    /**
     * Static helper to check if authentication state is enabled
     * @returns boolean - True if SSO is enabled via USE_AUTH_STATE
     */
    static isAuthStateEnabled(): boolean {
        return process.env.USE_AUTH_STATE === 'true';
    }

    /**
     * Login to PW Web platform with mobile number and OTP
     * @param mobileNumber - User's mobile number
     * @param otp - OTP for verification
     * @returns Promise<boolean> - True if login successful, false otherwise
     */
    async loginToPwWeb(mobileNumber: string, otp: string): Promise<boolean> {
        try {
            logger.info(`Attempting to login with mobile number: ${mobileNumber}`);

            // Navigate to the home page if not already there
            const currentUrl = this.page.url();
            if (!currentUrl.includes('physicswallah.live')) {
                await this.open(config.baseURL);
                await this.waitForPageLoad();
            }

            // Perform login using LoginPage
            const loginResult = await this.loginPage.login(mobileNumber, otp);

            if (loginResult) {
                logger.info('Login to PW Web successful');
                await this.waitForPageLoad();
                return true;
            } else {
                logger.error('Login to PW Web failed');
                return false;
            }
        } catch (error) {
            logger.error(`Login to PW Web failed with error: ${error}`);
            await this.takeScreenshot('login-error');
            return false;
        }
    }

    /**
     * Logout from PW Web platform
     * @returns Promise<boolean> - True if logout successful
     */
    async logoutFromPwWeb(): Promise<boolean> {
        try {
            logger.info('Attempting to logout from PW Web');

            // Try to find and click user menu first
            const userMenuVisible = await this.isElementVisible('[role="button"][name*="Hi,"]', 5000);
            if (userMenuVisible) {
                await this.click('[role="button"][name*="Hi,"]');
                await this.wait(2000);

                // Look for logout button
                const logoutVisible = await this.isElementVisible('[role="button"][name*="Logout"]', 5000);
                if (logoutVisible) {
                    await this.click('[role="button"][name*="Logout"]');
                    await this.waitForPageLoad();
                    logger.info('Logout successful');
                    return true;
                }
            }

            logger.warn('Logout elements not found');
            return false;
        } catch (error) {
            logger.error(`Logout failed with error: ${error}`);
            return false;
        }
    }

    /**
     * Navigate to PW Study section
     * @returns Promise<boolean> - True if navigation successful
     */
    async navigateToStudySection(): Promise<boolean> {
        try {
            logger.info('Navigating to Study section');

            // Check if already on study page
            if (this.getCurrentURL().includes('/study')) {
                logger.info('Already on study page');
                return true;
            }

            // Look for Study navigation link
            const studyLinkVisible = await this.isElementVisible('a[href*="/study"]', 10000);
            if (studyLinkVisible) {
                await this.click('a[href*="/study"]');
                await this.waitForURL('**/study**');
                logger.info('Successfully navigated to Study section');
                return true;
            }

            logger.warn('Study navigation link not found');
            return false;
        } catch (error) {
            logger.error(`Failed to navigate to Study section: ${error}`);
            return false;
        }
    }

    /**
     * Navigate to PW Profile section
     * @returns Promise<boolean> - True if navigation successful
     */
    async navigateToProfile(): Promise<boolean> {
        try {
            logger.info('Navigating to Profile section');

            // Click on user menu/profile button
            const profileButtonVisible = await this.isElementVisible('[role="button"][name*="Hi,"]', 10000);
            if (profileButtonVisible) {
                await this.click('[role="button"][name*="Hi,"]');
                await this.wait(1000);

                // Look for Profile option in menu
                const profileOptionVisible = await this.isElementVisible('[role="button"][name*="Profile"]', 5000);
                if (profileOptionVisible) {
                    await this.click('[role="button"][name*="Profile"]');
                    await this.waitForPageLoad();
                    logger.info('Successfully navigated to Profile');
                    return true;
                }
            }

            logger.warn('Profile navigation elements not found');
            return false;
        } catch (error) {
            logger.error(`Failed to navigate to Profile: ${error}`);
            return false;
        }
    }

    /**
     * Verify user is logged in to PW Web
     * @returns Promise<boolean> - True if user is logged in
     */
    async verifyUserLoggedIn(): Promise<boolean> {
        try {
            logger.info('Verifying user login status');

            // Check for user menu or profile indicator
            const userMenuVisible = await this.isElementVisible('[role="button"][name*="Hi,"]', 5000);
            const profileVisible = await this.isElementVisible('[data-testid*="profile"]', 5000);
            const userIconVisible = await this.isElementVisible('[data-testid*="user"]', 5000);

            const isLoggedIn = userMenuVisible || profileVisible || userIconVisible;

            if (isLoggedIn) {
                logger.info('User is logged in');
            } else {
                logger.info('User is not logged in');
            }

            return isLoggedIn;
        } catch (error) {
            logger.error(`Failed to verify login status: ${error}`);
            return false;
        }
    }

    /**
     * Search for content in PW Web
     * @param searchTerm - Term to search for
     * @returns Promise<boolean> - True if search was successful
     */
    async searchContent(searchTerm: string): Promise<boolean> {
        try {
            logger.info(`Searching for: ${searchTerm}`);

            // Look for search input field
            const searchInputVisible = await this.isElementVisible('input[placeholder*="Search"], input[type="search"]', 10000);
            if (searchInputVisible) {
                await this.fill('input[placeholder*="Search"], input[type="search"]', searchTerm);
                await this.page.keyboard.press('Enter');
                await this.waitForPageLoad();
                logger.info(`Search completed for: ${searchTerm}`);
                return true;
            }

            logger.warn('Search input not found');
            return false;
        } catch (error) {
            logger.error(`Search failed for term '${searchTerm}': ${error}`);
            return false;
        }
    }

    /**
     * Navigate to specific course by name
     * @param courseName - Name of the course to navigate to
     * @returns Promise<boolean> - True if navigation successful
     */
    async navigateToCourse(courseName: string): Promise<boolean> {
        try {
            logger.info(`Navigating to course: ${courseName}`);

            // First search for the course
            const searchResult = await this.searchContent(courseName);
            if (!searchResult) {
                logger.warn(`Could not search for course: ${courseName}`);
                return false;
            }

            // Look for course link in results
            const courseLink = `a[href*="course"], [data-testid*="course"]:has-text("${courseName}")`;
            const courseLinkVisible = await this.isElementVisible(courseLink, 10000);

            if (courseLinkVisible) {
                await this.click(courseLink);
                await this.waitForPageLoad();
                logger.info(`Successfully navigated to course: ${courseName}`);
                return true;
            }

            logger.warn(`Course link not found for: ${courseName}`);
            return false;
        } catch (error) {
            logger.error(`Failed to navigate to course '${courseName}': ${error}`);
            return false;
        }
    }

    /**
     * Get user's current subscription status
     * @returns Promise<string> - Subscription status (e.g., 'Active', 'Expired', 'None')
     */
    async getSubscriptionStatus(): Promise<string> {
        try {
            logger.info('Getting subscription status');

            // Navigate to profile first
            const profileNavResult = await this.navigateToProfile();
            if (!profileNavResult) {
                return 'Unknown';
            }

            // Look for subscription information
            const subscriptionElements = [
                '[data-testid*="subscription"]',
                '[class*="subscription"]',
                'text=Active',
                'text=Expired',
                'text=Premium'
            ];

            for (const element of subscriptionElements) {
                if (await this.isElementVisible(element, 3000)) {
                    const statusText = await this.getTextContent(element);
                    logger.info(`Subscription status found: ${statusText}`);
                    return statusText;
                }
            }

            logger.warn('Subscription status not found');
            return 'None';
        } catch (error) {
            logger.error(`Failed to get subscription status: ${error}`);
            return 'Error';
        }
    }

    /**
     * Accept or dismiss any popup/modal that appears on PW Web
     * @param action - 'accept' or 'dismiss'
     * @returns Promise<boolean> - True if popup was handled
     */
    async handlePopup(action: 'accept' | 'dismiss' = 'dismiss'): Promise<boolean> {
        try {
            logger.info(`Attempting to ${action} popup`);

            const popupSelectors = [
                '[role="dialog"]',
                '.modal',
                '[data-testid*="modal"]',
                '[data-testid*="popup"]',
                '.popup-overlay'
            ];

            for (const selector of popupSelectors) {
                if (await this.isElementVisible(selector, 2000)) {
                    if (action === 'accept') {
                        const acceptButton = `${selector} button:has-text("Accept"), ${selector} button:has-text("OK"), ${selector} button:has-text("Continue")`;
                        if (await this.isElementVisible(acceptButton, 2000)) {
                            await this.click(acceptButton);
                            logger.info('Popup accepted');
                            return true;
                        }
                    } else {
                        const dismissButton = `${selector} button:has-text("Close"), ${selector} button:has-text("Cancel"), ${selector} [aria-label*="close"]`;
                        if (await this.isElementVisible(dismissButton, 2000)) {
                            await this.click(dismissButton);
                            logger.info('Popup dismissed');
                            return true;
                        }
                    }
                }
            }

            logger.info('No popup found to handle');
            return false;
        } catch (error) {
            logger.error(`Failed to handle popup: ${error}`);
            return false;
        }
    }

    /**
     * Wait for PW Web page to be fully loaded and ready
     * @param timeout - Maximum time to wait in milliseconds
     * @returns Promise<boolean> - True if page is ready
     */
    async waitForPwPageReady(timeout: number = 30000): Promise<boolean> {
        try {
            logger.info('Waiting for PW page to be ready');

            // Wait for page load first
            await this.waitForPageLoad(timeout);

            // Wait for PW-specific elements that indicate page is ready
            const readyIndicators = [
                '[data-testid*="header"]',
                '[role="navigation"]',
                '.header',
                'nav'
            ];

            for (const indicator of readyIndicators) {
                if (await this.waitForElement(indicator, 5000)) {
                    logger.info('PW page is ready');
                    return true;
                }
            }

            logger.warn('PW page ready indicators not found, but continuing');
            return true;
        } catch (error) {
            logger.error(`Failed to wait for PW page ready: ${error}`);
            return false;
        }
    }
}