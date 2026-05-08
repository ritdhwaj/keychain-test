import { Page, Locator, expect } from '@playwright/test';

export default class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Utility: resolve any string or Locator into a Locator
  private getLocator(selector: string | Locator): Locator {
    return typeof selector === 'string' ? this.page.locator(selector) : selector;
  }

  // Default timeout for actions
  protected readonly defaultTimeout = 30000;

  // ✅ Enhanced open() with retries and better error handling
  async open(url: string, options = { timeout: this.defaultTimeout }) {
    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: options.timeout
    });
  }

  async click(selector: string | Locator, options = { timeout: this.defaultTimeout }) {
    if (this.page.isClosed()) {
      throw new Error('Page has been closed');
    }
    const locator = this.getLocator(selector);
    await locator.waitFor({ state: 'visible', timeout: options.timeout });
    await locator.click();
  }

  async fill(selector: string | Locator, value: string, options = { timeout: this.defaultTimeout }) {
    const locator = this.getLocator(selector);
    await locator.waitFor({ state: 'visible', timeout: options.timeout });
    await locator.fill(value);
  }

  async clear(selector: string | Locator, options = { timeout: this.defaultTimeout }) {
    const locator = this.getLocator(selector);
    await locator.waitFor({ state: 'visible', timeout: options.timeout });
    await locator.clear();
  }

  async type(selector: string | Locator, value: string, options = { timeout: this.defaultTimeout }) {
    const locator = this.getLocator(selector);
    await locator.waitFor({ state: 'visible', timeout: options.timeout });
    await locator.type(value);
  }

  async getText(selector: string | Locator, options = { timeout: this.defaultTimeout }): Promise<string | null> {
    const locator = this.getLocator(selector);
    await locator.waitFor({ state: 'visible', timeout: options.timeout });
    return locator.textContent();
  }

  async isVisible(selector: string | Locator, options = { timeout: this.defaultTimeout }): Promise<boolean> {
    try {
      const locator = this.getLocator(selector);
      await locator.waitFor({ state: 'visible', timeout: options.timeout });
      return true;
    } catch {
      return false;
    }
  }

  async expectVisible(selector: string | Locator, options = { timeout: this.defaultTimeout }) {
    const locator = this.getLocator(selector);
    await expect(locator).toBeVisible({ timeout: options.timeout });
  }

  async expectHidden(selector: string | Locator, options = { timeout: this.defaultTimeout }) {
    const locator = this.getLocator(selector);
    await expect(locator).toBeHidden({ timeout: options.timeout });
  }

  async waitForSelector(selector: string | Locator, options?: Parameters<Page['waitForSelector']>[1]) {
    const locator = this.getLocator(selector);
    return await locator.waitFor(options);
  }

  // ✅ General Playwright utility methods
  
  /**
   * Wait for page to fully load with network idle state
   * @param timeout - Maximum time to wait in milliseconds
   */
  async waitForPageLoad(timeout: number = 30000): Promise<void> {
    try {
      await Promise.race([
        this.page.waitForLoadState('networkidle', { timeout }),
        this.page.waitForLoadState('domcontentloaded', { timeout }),
        this.page.waitForLoadState('load', { timeout }),
      ]);
    } catch (error) {
      // Continue if timeout, page might still be usable
    }
  }

  /**
   * Wait for element to be visible with custom timeout
   * @param selector - Element selector string or Locator
   * @param timeout - Maximum time to wait in milliseconds
   */
  async waitForElement(selector: string | Locator, timeout: number = 10000): Promise<boolean> {
    try {
      const locator = this.getLocator(selector);
      await locator.waitFor({ state: 'visible', timeout });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Scroll element into view
   * @param selector - Element selector string or Locator
   */
  async scrollToElement(selector: string | Locator): Promise<void> {
    try {
      const locator = this.getLocator(selector);
      await locator.scrollIntoViewIfNeeded();
    } catch (error) {
      throw new Error(`Failed to scroll to element: ${selector}, Error: ${error}`);
    }
  }

  /**
   * Get text content of an element
   * @param selector - Element selector string or Locator
   * @returns Promise<string> - Text content of the element
   */
  async getTextContent(selector: string | Locator): Promise<string> {
    try {
      const locator = this.getLocator(selector);
      await locator.waitFor({ state: 'visible', timeout: 10000 });
      const text = await locator.textContent();
      return text?.trim() || '';
    } catch (error) {
      throw new Error(`Failed to get text content from: ${selector}, Error: ${error}`);
    }
  }

  /**
   * Check if element is visible on the page
   * @param selector - Element selector string or Locator
   * @param timeout - Maximum time to wait in milliseconds
   * @returns Promise<boolean> - True if element is visible
   */
  async isElementVisible(selector: string | Locator, timeout: number = 5000): Promise<boolean> {
    try {
      const locator = this.getLocator(selector);
      await locator.waitFor({ state: 'visible', timeout });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for URL to match a pattern
   * @param urlPattern - URL pattern to match (can include wildcards)
   * @param timeout - Maximum time to wait in milliseconds
   */
  async waitForURL(urlPattern: string, timeout: number = 30000): Promise<boolean> {
    try {
      await this.page.waitForURL(urlPattern, { timeout });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Take screenshot with timestamp
   * @param name - Base name for the screenshot file
   */
  async takeScreenshot(name: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${name}-${timestamp}.png`;
      await this.page.screenshot({ 
        path: `test-results/screenshots/${filename}`,
        fullPage: true 
      });
    } catch (error) {
      throw new Error(`Failed to take screenshot: ${error}`);
    }
  }

  /**
   * Refresh the current page
   */
  async refreshPage(): Promise<void> {
    try {
      await this.page.reload({ waitUntil: 'networkidle' });
    } catch (error) {
      throw new Error(`Failed to refresh page: ${error}`);
    }
  }

  /**
   * Navigate back in browser history
   */
  async goBack(): Promise<void> {
    try {
      await this.page.goBack({ waitUntil: 'networkidle' });
    } catch (error) {
      throw new Error(`Failed to navigate back: ${error}`);
    }
  }

  /**
   * Navigate forward in browser history
   */
  async goForward(): Promise<void> {
    try {
      await this.page.goForward({ waitUntil: 'networkidle' });
    } catch (error) {
      throw new Error(`Failed to navigate forward: ${error}`);
    }
  }

  /**
   * Get current page URL
   * @returns string - Current page URL
   */
  getCurrentURL(): string {
    return this.page.url();
  }

  /**
   * Get page title
   * @returns Promise<string> - Page title
   */
  async getPageTitle(): Promise<string> {
    try {
      return await this.page.title();
    } catch (error) {
      throw new Error(`Failed to get page title: ${error}`);
    }
  }

  /**
 * Wait for a specific amount of time
 * @param milliseconds - Time to wait in milliseconds
 */
async wait(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

  /**
   * Hover over an element
   * @param selector - Element selector string or Locator
   */
  async hoverOverElement(selector: string | Locator): Promise<void> {
    try {
      const locator = this.getLocator(selector);
      await locator.hover();
    } catch (error) {
      throw new Error(`Failed to hover over element: ${selector}, Error: ${error}`);
    }
  }

  // ...existing code...

async isDppAutomationVisible(timeout: number = 5000): Promise<boolean> {
   await this.wait(5000); 
  const dppLocator = this.page.locator(`xpath=//div[contains(text(), 'DPP_Automation_Testing01')]`);

  return await dppLocator.isVisible({ timeout }).catch(() => false);
}

// ...existing code...

  /**
   * Double click on an element
   * @param selector - Element selector string or Locator
   */
  async doubleClickElement(selector: string | Locator): Promise<void> {
    try {
      const locator = this.getLocator(selector);
      await locator.dblclick();
    } catch (error) {
      throw new Error(`Failed to double click element: ${selector}, Error: ${error}`);
    }
  }

  /**
   * Right click on an element
   * @param selector - Element selector string or Locator
   */
  async rightClickElement(selector: string | Locator): Promise<void> {
    try {
      const locator = this.getLocator(selector);
      await locator.click({ button: 'right' });
    } catch (error) {
      throw new Error(`Failed to right click element: ${selector}, Error: ${error}`);
    }
  }

  /**
   * Select option from dropdown by value
   * @param selector - Dropdown selector string or Locator
   * @param value - Value to select
   */
  async selectDropdownByValue(selector: string | Locator, value: string): Promise<void> {
    try {
      const locator = this.getLocator(selector);
      await locator.selectOption({ value });
    } catch (error) {
      throw new Error(`Failed to select value from dropdown: ${selector}, Error: ${error}`);
    }
  }

  /**
   * Select option from dropdown by visible text
   * @param selector - Dropdown selector string or Locator
   * @param text - Visible text to select
   */
  async selectDropdownByText(selector: string | Locator, text: string): Promise<void> {
    try {
      const locator = this.getLocator(selector);
      await locator.selectOption({ label: text });
    } catch (error) {
      throw new Error(`Failed to select text from dropdown: ${selector}, Error: ${error}`);
    }
  }

  /**
   * Upload file to input element
   * @param selector - File input selector string or Locator
   * @param filePath - Path to the file to upload
   */
  async uploadFile(selector: string | Locator, filePath: string): Promise<void> {
    try {
      const locator = this.getLocator(selector);
      await locator.setInputFiles(filePath);
    } catch (error) {
      throw new Error(`Failed to upload file: ${filePath}, Error: ${error}`);
    }
  }

  /**
   * Get attribute value of an element
   * @param selector - Element selector string or Locator
   * @param attributeName - Name of the attribute
   * @returns Promise<string | null> - Attribute value
   */
  async getAttributeValue(selector: string | Locator, attributeName: string): Promise<string | null> {
    try {
      const locator = this.getLocator(selector);
      await locator.waitFor({ state: 'visible', timeout: 10000 });
      return await locator.getAttribute(attributeName);
    } catch (error) {
      throw new Error(`Failed to get attribute value: ${attributeName} from ${selector}, Error: ${error}`);
    }
  }

  /**
   * Check if element is enabled
   * @param selector - Element selector string or Locator
   * @returns Promise<boolean> - True if element is enabled
   */
  async isElementEnabled(selector: string | Locator): Promise<boolean> {
    try {
      const locator = this.getLocator(selector);
      return await locator.isEnabled();
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear browser cache and cookies
   */
  async clearBrowserData(): Promise<void> {
    try {
      const context = this.page.context();
      await context.clearCookies();
      await context.clearPermissions();
    } catch (error) {
      throw new Error(`Failed to clear browser data: ${error}`);
    }
  }

  /**
   * Scroll page by specified pixels
   * @param xPixels - Horizontal scroll amount
   * @param yPixels - Vertical scroll amount
   */
  async scrollBy(xPixels: number, yPixels: number): Promise<void> {
    try {
      await this.page.mouse.wheel(xPixels, yPixels);
    } catch (error) {
      throw new Error(`Failed to scroll page: ${error}`);
    }
  }

  /**
   * Scroll to element with retry logic
   * Attempts to find element by scrolling the page multiple times
   * @param selector - Element selector string or Locator
   * @param options - Scroll configuration options
   * @returns Promise<boolean> - True if element found, false otherwise
   */
  async scrollToElementWithRetry(
    selector: string | Locator,
    options: {
      maxScrolls?: number;
      scrollAmount?: number;
      waitBetweenScrolls?: number;
      checkTimeout?: number;
    } = {}
  ): Promise<boolean> {
    const {
      maxScrolls = 10,
      scrollAmount = 800,
      waitBetweenScrolls = 500,
      checkTimeout = 1000
    } = options;

    const locator = this.getLocator(selector);

    // Check if element is already visible
    const initiallyVisible = await this.isElementVisible(locator, checkTimeout);
    if (initiallyVisible) {
      return true;
    }

    // Scroll and check multiple times
    for (let i = 0; i < maxScrolls; i++) {
      await this.scrollBy(0, scrollAmount);
      await this.wait(waitBetweenScrolls);

      const isVisible = await this.isElementVisible(locator, checkTimeout);
      if (isVisible) {
        return true;
      }
    }

    return false;
  }

  /**
   * Scroll to top of the page
   */
  async scrollToTop(): Promise<void> {
    try {
      await this.page.evaluate(() => window.scrollTo(0, 0));
    } catch (error) {
      throw new Error(`Failed to scroll to top: ${error}`);
    }
  }

  /**
   * Scroll to bottom of the page
   */
  async scrollToBottom(): Promise<void> {
    try {
      await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    } catch (error) {
      throw new Error(`Failed to scroll to bottom: ${error}`);
    }
  }

  /**
   * Get count of elements matching selector
   * @param selector - Element selector string or Locator
   * @returns Promise<number> - Count of matching elements
   */
  async getElementCount(selector: string | Locator): Promise<number> {
    try {
      const locator = this.getLocator(selector);
      return await locator.count();
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check if element exists in DOM (without waiting for visibility)
   * @param selector - Element selector string or Locator
   * @param timeout - Maximum time to wait in milliseconds
   * @returns Promise<boolean> - True if element exists
   */
  async isElementPresent(selector: string | Locator, timeout: number = 3000): Promise<boolean> {
    try {
      const locator = this.getLocator(selector);
      await locator.waitFor({ state: 'attached', timeout });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for element to be hidden
   * @param selector - Element selector string or Locator
   * @param timeout - Maximum time to wait in milliseconds
   * @returns Promise<boolean> - True if element is hidden
   */
  async waitForElementHidden(selector: string | Locator, timeout: number = 10000): Promise<boolean> {
    try {
      const locator = this.getLocator(selector);
      await locator.waitFor({ state: 'hidden', timeout });
      return true;
    } catch (error) {
      return false;
    }
  }
}
