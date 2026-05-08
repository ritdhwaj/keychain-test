import { expect, Locator, Page, APIResponse } from '@playwright/test';

type SchemaValidator = {
  (data: unknown): boolean;
  errors?: unknown;
};

export class CustomAssert {
  private softFailures: string[] = [];

  constructor() {}

  /** Internal soft/hard check handler */
  private async check(fn: () => void | Promise<void>, message: string, soft?: boolean) {
    try {
      await fn();
    } catch (err: any) {
      if (soft) {
        this.softFailures.push(err.message || message);
      } else {
        throw new Error(err.message || message);
      }
    }
  }

  /** Flush all soft assertion failures */
  assertAll() {
    if (this.softFailures.length > 0) {
      const allMessages = this.softFailures.join('\n');
      this.softFailures = [];
      throw new Error(`Soft assertion failures:\n${allMessages}`);
    }
  }

  // ============================
  // Generic Value Assertions
  // ============================
  async valueToBeTrue(value: boolean, message?: string, soft?: boolean) {
    await this.check(() => expect(value, message || 'Value should be true').toBe(true), message || 'Value should be true', soft);
  }

  async valueToBeFalse(value: boolean, message?: string, soft?: boolean) {
    await this.check(() => expect(value, message || 'Value should be false').toBe(false), message || 'Value should be false', soft);
  }

  async valueToEqual<T>(actual: T, expected: T, message?: string, soft?: boolean) {
    await this.check(() => expect(actual, message || `Value should equal ${expected}`).toBe(expected), message || `Value should equal ${expected}`, soft);
  }

  async valueToBeTruthy<T>(value: T, message?: string, soft?: boolean) {
    await this.check(() => expect(value, message || 'Value should be truthy').toBeTruthy(), message || 'Value should be truthy', soft);
  }

  async valueToBeDefined(value: unknown, message?: string, soft?: boolean) {
    await this.check(() => expect(value, message || 'Value should be defined').not.toBeUndefined(), message || 'Value should be defined', soft);
  }

  async valueToBeGreaterThan(actual: number, expected: number, message?: string, soft?: boolean) {
    await this.check(() => expect(actual, message || `Value should be greater than ${expected}`).toBeGreaterThan(expected), message || `Value should be greater than ${expected}`, soft);
  }

  async valueToBeLessThan(actual: number, expected: number, message?: string, soft?: boolean) {
    await this.check(() => expect(actual, message || `Value should be less than ${expected}`).toBeLessThan(expected), message || `Value should be less than ${expected}`, soft);
  }

  async valueToBeOneOf<T>(actual: T, allowed: T[], message?: string, soft?: boolean) {
    const allowedString = allowed.map(item => JSON.stringify(item)).join(', ');
    await this.check(
      () => expect(allowed.includes(actual), message || `Value ${JSON.stringify(actual)} should be one of [${allowedString}]`).toBeTruthy(),
      message || `Value ${JSON.stringify(actual)} should be one of [${allowedString}]`,
      soft
    );
  }

  async valueTypeToBe(value: unknown, expectedType: string, message?: string, soft?: boolean) {
    await this.check(() => {
      if (expectedType === 'array') {
        expect(Array.isArray(value), message || `Value should be an array`).toBe(true);
      } else {
        expect(typeof value, message || `Value type should be ${expectedType}`).toBe(expectedType);
      }
    }, message || `Value type should be ${expectedType}`, soft);
  }

  // ============================
  // Object Assertions
  // ============================
  async objectToHaveProperties(obj: Record<string, any>, properties: string[], message?: string, soft?: boolean) {
    await Promise.all(properties.map(prop =>
      this.check(() => expect(obj, message || `Object should have property: ${prop}`).toHaveProperty(prop),
                 message || `Object should have property: ${prop}`, soft)
    ));
  }

  async objectToHaveProperty(obj: Record<string, any>, prop: string, message?: string, soft?: boolean) {
    await this.check(() => expect(obj, message || `Object should have property: ${prop}`).toHaveProperty(prop),
                     message || `Object should have property: ${prop}`, soft);
  }

  async objectFieldsToEqual(obj: Record<string, any>, expected: Record<string, any>, message?: string, soft?: boolean) {
    await Promise.all(Object.entries(expected).map(([key, value]) =>
      this.check(() => expect(obj[key], message || `Field ${key} should equal ${JSON.stringify(value)}`).toBe(value),
                 message || `Field ${key} should equal ${JSON.stringify(value)}`, soft)
    ));
  }

  async objectFieldsToBeTruthy(obj: Record<string, any>, fields: string[], message?: string, soft?: boolean) {
    await Promise.all(fields.map(field =>
      this.check(() => expect(obj[field], message || `Field ${field} should be truthy`).toBeTruthy(),
                 message || `Field ${field} should be truthy`, soft)
    ));
  }

  // ============================
  // Array Assertions
  // ============================
  async arrayToContain<T>(arr: T[], expected: T, message?: string, soft?: boolean) {
    await this.check(() => {
      expect(Array.isArray(arr), 'Provided value should be an array').toBe(true);
      expect(arr, message || `Array should contain ${JSON.stringify(expected)}`).toContain(expected);
    }, message || `Array should contain ${JSON.stringify(expected)}`, soft);
  }

  async arrayToHaveLength(arr: unknown[], expectedLength: number, message?: string, soft?: boolean) {
    await this.check(() => {
      expect(Array.isArray(arr), 'Provided value should be an array').toBe(true);
      expect(arr, message || `Array should have length ${expectedLength}`).toHaveLength(expectedLength);
    }, message || `Array should have length ${expectedLength}`, soft);
  }

  // ============================
  // Schema Assertions
  // ============================
  async validateSchema(validator: SchemaValidator, data: unknown, message?: string, soft?: boolean) {
    await this.check(() => {
      const isValid = validator(data);
      if (!isValid && validator.errors) console.error('Schema validation errors:', validator.errors);
      expect(isValid, message || 'Schema validation should pass').toBe(true);
    }, message || 'Schema validation should pass', soft);
  }

  async schemaValidationToPass(validator: SchemaValidator, data: unknown, message?: string, soft?: boolean) {
    await this.validateSchema(validator, data, message, soft);
  }

  // ============================
  // Locator / UI Assertions
  // ============================
  async toBeVisibleAndEnabled(locator: Locator, message?: string, soft?: boolean) {
    await this.check(async () => {
      await expect(locator, message || 'Element should be visible').toBeVisible();
      await expect(locator, message || 'Element should be enabled').toBeEnabled();
    }, message || 'Element should be visible and enabled', soft);
  }

  async toBeClickable(locator: Locator, message?: string, soft?: boolean) {
    await this.check(async () => {
      await expect(locator, message || 'Element should be visible').toBeVisible();
      await expect(locator, message || 'Element should be enabled').toBeEnabled();
      await expect(locator, message || 'Element should be attached').toBeAttached();
    }, message || 'Element should be clickable', soft);
  }

  async toHaveTextAndBeVisible(locator: Locator, expectedText: string | RegExp, message?: string, soft?: boolean) {
    await this.check(async () => {
      await expect(locator, message || 'Element should be visible').toBeVisible();
      await expect(locator, message || `Element should have text: ${expectedText}`).toHaveText(expectedText);
    }, message || `Element should have text: ${expectedText}`, soft);
  }

  async toBeEditableWithValue(locator: Locator, expectedValue: string | RegExp, message?: string, soft?: boolean) {
    await this.check(async () => {
      await expect(locator, message || 'Element should be editable').toBeEditable();
      await expect(locator, message || `Element should have value: ${expectedValue}`).toHaveValue(expectedValue);
    }, message || `Element should have value: ${expectedValue}`, soft);
  }

  async toHaveClass(locator: Locator, className: string, message?: string, soft?: boolean) {
    await this.check(async () => await expect(locator, message || `Element should have class: ${className}`).toHaveClass(new RegExp(className)),
                     message || `Element should have class: ${className}`, soft);
  }

  async toHaveAttributeWithValue(locator: Locator, attributeName: string, expectedValue: string | RegExp, message?: string, soft?: boolean) {
    await this.check(async () => await expect(locator, message || `Element should have ${attributeName}="${expectedValue}"`).toHaveAttribute(attributeName, expectedValue),
                     message || `Element should have ${attributeName}="${expectedValue}"`, soft);
  }

  // ============================
  // Page Assertions
  // ============================
  async toHaveLoadedSuccessfully(page: Page, message?: string, soft?: boolean) {
    await this.check(async () => {
      await expect(page, message || 'Page title should not contain error').not.toHaveTitle(/error|404|500/i);
      const url = page.url();
      expect(url, message || 'URL should not contain error').not.toContain('error');
      expect(url, message || 'URL should not contain 404').not.toContain('404');
      expect(url, message || 'URL should not contain 500').not.toContain('500');
    }, message || 'Page should load successfully', soft);
  }

  async toHaveLoadedWithTitle(page: Page, expectedTitle: string | RegExp, message?: string, soft?: boolean) {
    await this.check(async () => {
      await page.waitForLoadState('load');
      await expect(page, message || `Page should have title: ${expectedTitle}`).toHaveTitle(expectedTitle);
    }, message || `Page should have title: ${expectedTitle}`, soft);
  }

  async toHaveURLContaining(page: Page, urlParts: string[], message?: string, soft?: boolean) {
    await this.check(() => {
      const url = page.url();
      for (const part of urlParts) {
        expect(url, message || `URL should contain: ${part}`).toContain(part);
      }
    }, message || 'URL should contain all parts', soft);
  }

  async pageToContainAllText(page: Page, textItems: string[], message?: string, soft?: boolean) {
    await this.check(async () => {
      const content = await page.content();
      textItems.forEach(text => expect(content, message || `Page should contain text: ${text}`).toContain(text));
    }, message || 'Page should contain all text items', soft);
  }

  // ============================
  // API Assertions
  // ============================
  async apiResponseToHaveStructure(response: APIResponse, expectedKeys: string[], message?: string, soft?: boolean) {
    await this.check(async () => {
      const json = await response.json();
      await Promise.all(expectedKeys.map(key =>
        expect(Object.prototype.hasOwnProperty.call(json, key), message || `Response should have key: ${key}`).toBeTruthy()
      ));
    }, message || 'API response structure should match', soft);
  }

  async apiResponseToContainData(response: APIResponse, expectedData: Record<string, any>, message?: string, soft?: boolean) {
    await this.check(async () => {
      const json = await response.json();
      await Promise.all(Object.entries(expectedData).map(([key, value]) =>
        expect(json[key], message || `Response should have ${key} = ${value}`).toBe(value)
      ));
    }, message || 'API response should contain data', soft);
  }

  async apiResponseToHaveData(response: APIResponse, message?: string, soft?: boolean) {
    await this.check(async () => {
      const json = await response.json();
      if (Array.isArray(json)) {
        expect(json.length, message || 'Response array should not be empty').toBeGreaterThan(0);
      } else {
        expect(Object.keys(json).length, message || 'Response object should not be empty').toBeGreaterThan(0);
      }
    }, message || 'API response should have data', soft);
  }

  async apiResponseToBeWithinTime(responsePromise: Promise<APIResponse>, maxTimeMs: number, message?: string, soft?: boolean): Promise<APIResponse> {
    const startTime = Date.now();
    const response = await responsePromise;
    const duration = Date.now() - startTime;
    await this.check(() => expect(duration, message || `Response time (${duration}ms) should be <= ${maxTimeMs}ms`).toBeLessThanOrEqual(maxTimeMs),
                     message || `Response time (${duration}ms) should be <= ${maxTimeMs}ms`, soft);
    return response;
  }

  // ============================
  // Form Assertions
  // ============================
  async formToBeReady(submitButton: Locator, requiredFields: Locator[], message?: string, soft?: boolean) {
    await Promise.all(requiredFields.map(field =>
      this.check(async () => await expect(field, message || 'Required field should have value').not.toHaveValue(''),
                 message || 'Required field should have value', soft)
    ));
    await this.check(async () => await expect(submitButton, message || 'Submit button should be enabled').toBeEnabled(),
                     message || 'Submit button should be enabled', soft);
  }

  async formToShowValidationError(errorLocator: Locator, expectedErrorMessage?: string | RegExp, message?: string, soft?: boolean) {
    await this.check(async () => {
      await expect(errorLocator, message || 'Error message should be visible').toBeVisible();
      if (expectedErrorMessage) await expect(errorLocator, message || `Error should contain: ${expectedErrorMessage}`).toHaveText(expectedErrorMessage);
    }, message || 'Form should show validation error', soft);
  }

  // ============================
  // Table / List Assertions
  // ============================
  async tableToHaveRowCount(tableLocator: Locator, expectedCount: number, message?: string, soft?: boolean) {
    await this.check(async () => {
      const rows = tableLocator.locator('tr');
      await expect(rows, message || `Table should have ${expectedCount} rows`).toHaveCount(expectedCount);
    }, message || `Table should have ${expectedCount} rows`, soft);
  }

  async listToHaveItemCount(listLocator: Locator, expectedCount: number, message?: string, soft?: boolean) {
    await this.check(async () => await expect(listLocator, message || `List should have ${expectedCount} items`).toHaveCount(expectedCount),
                     message || `List should have ${expectedCount} items`, soft);
  }

  // ============================
  // State / Loading / Timing Assertions
  // ============================
  async loadingToComplete(loadingIndicator: Locator, timeoutMs: number = 10000, message?: string, soft?: boolean) {
    await this.check(async () => await expect(loadingIndicator, message || `Loading should complete within ${timeoutMs}ms`).toBeHidden({ timeout: timeoutMs }),
                     message || `Loading should complete within ${timeoutMs}ms`, soft);
  }

  async toAppearWithin(locator: Locator, timeoutMs: number, message?: string, soft?: boolean) {
    await this.check(async () => await expect(locator, message || `Element should appear within ${timeoutMs}ms`).toBeVisible({ timeout: timeoutMs }),
                     message || `Element should appear within ${timeoutMs}ms`, soft);
  }

  // ============================
// String Assertions
// ============================
async stringToMatch(value: string, pattern: RegExp | string, message?: string, soft?: boolean) {
  await this.check(() => expect(value, message || `String should match pattern ${pattern}`).toMatch(pattern),
                   message || `String should match pattern ${pattern}`, soft);
}

async stringToContain(value: string, substring: string, message?: string, soft?: boolean) {
  await this.check(() => expect(value, message || `String should contain ${substring}`).toContain(substring),
                   message || `String should contain ${substring}`, soft);
}

async stringNotToContain(value: string, substring: string, message?: string, soft?: boolean) {
  await this.check(() => expect(value, message || `String should not contain ${substring}`).not.toContain(substring),
                   message || `String should not contain ${substring}`, soft);
}

// ============================
// Status / API Assertions
// ============================
async statusCodeToBe(actualStatus: number, expectedStatus: number, message?: string, soft?: boolean) {
  await this.check(() => expect(actualStatus, message || `Status code should be ${expectedStatus}`).toBe(expectedStatus),
                   message || `Status code should be ${expectedStatus}`, soft);
}

async apiResponseToBeSuccess(response: APIResponse, message?: string, soft?: boolean) {
  await this.check(() => {
    expect(response.ok(), message || 'Response should be successful').toBeTruthy();
    expect(response.status(), message || 'Response status should be less than 400').toBeLessThan(400);
  }, message || 'Response should be successful (2xx)', soft);
}

async apiResponseToHaveStatus(response: APIResponse, expectedStatus: number, message?: string, soft?: boolean) {
  await this.check(() => expect(response.status(), message || `Response should have status ${expectedStatus}`).toBe(expectedStatus),
                   message || `Response should have status ${expectedStatus}`, soft);
}

// ============================
// Locator Group Assertions
// ============================
async allToBeVisible(locators: Locator[], message?: string, soft?: boolean) {
  await Promise.all(locators.map((locator, index) =>
    this.check(async () => await expect(locator, message || `Element ${index + 1} should be visible`).toBeVisible(),
               message || `Element ${index + 1} should be visible`, soft)
  ));
}

async atLeastOneToBeVisible(locators: Locator[], message?: string, soft?: boolean) {
  await this.check(async () => {
    const visibilityResults = await Promise.all(locators.map(l => l.isVisible().catch(() => false)));
    const hasVisible = visibilityResults.some(v => v === true);
    expect(hasVisible, message || 'At least one element should be visible').toBeTruthy();
  }, message || 'At least one element should be visible', soft);
}

// ============================
// Page Assertions (extra)
// ============================
  async toHaveNavigatedTo(page: Page, expectedUrl: string | RegExp, message?: string, soft?: boolean) {
    await this.check(async () => {
      if (typeof expectedUrl === 'string') {
        await expect(page, message || `Should navigate to ${expectedUrl}`).toHaveURL(new RegExp(expectedUrl));
      } else {
        await expect(page, message || 'Should navigate to expected URL').toHaveURL(expectedUrl);
      }
    }, message || 'Page should navigate to expected URL', soft);
  }

  // ============================
  // API Response Logging
  // ============================
  async logApiResponse(response: APIResponse, testName: string = 'API Test') {
    const status = response.status();
    const headers = response.headers();
    
    try {
      const body = await response.json();
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║ 📊 API Response Report: ${testName}
╠════════════════════════════════════════════════════════════════╣
║ Status: ${status}
║ Content-Type: ${headers['content-type'] || 'N/A'}
║ Response URL: ${response.url()}
╠════════════════════════════════════════════════════════════════╣
║ Response Body:
╠════════════════════════════════════════════════════════════════╣
${JSON.stringify(body, null, 2).split('\n').map(line => '║ ' + line).join('\n')}
╚════════════════════════════════════════════════════════════════╝
      `);
    } catch (e) {
      const text = await response.text();
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║ 📊 API Response Report: ${testName}
╠════════════════════════════════════════════════════════════════╣
║ Status: ${status}
║ Content-Type: ${headers['content-type'] || 'N/A'}
║ Response URL: ${response.url()}
╠════════════════════════════════════════════════════════════════╣
║ Response Body (Text):
╠════════════════════════════════════════════════════════════════╣
${text.split('\n').map(line => '║ ' + line).join('\n')}
╚════════════════════════════════════════════════════════════════╝
      `);
    }
  }

}