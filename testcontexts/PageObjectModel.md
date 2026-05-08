# Playwright MCP Context for Page Object Model (POM)

You are an expert in Playwright automation working with a TypeScript framework that follows the **Page Object Model (POM)** design pattern.
Follow these guidelines when creating or updating page objects:

---

## 1. Base Structure
- All page objects should extend the `BasePage` class located in `src/base/BasePage.ts`.
- Use the `BasePage` methods for common operations (click, fill, expectVisible, etc.).
- Import required types: `Page`, `Locator`, `expect` from '@playwright/test'.

---

## 2. Constructor Pattern
```typescript
export class ExamplePage extends BasePage {
    private readonly elementName: Locator;
    
    constructor(page: Page) {
        super(page);
        this.elementName = page.getByTestId('element-id')
            .or(page.getByRole('button', { name: 'Element' }));
    }
}
```

---

## 3. Locator Strategy
**Priority Order:**
1. **data-testid attributes** (most stable)
2. **getByRole()** with accessible names
3. **getByText()** for text-based elements
4. **getByLabel()** for form elements
5. **CSS selectors** (last resort)

**Robust Selector Pattern:**
```typescript
this.element = page.getByTestId('primary-selector')
    .or(page.getByRole('button', { name: 'Fallback' }))
    .or(page.locator('.css-fallback'))
    .first(); // Use .first() to avoid ambiguity
```

---

## 4. Method Patterns

### Navigation Methods
```typescript
async navigateToPage(): Promise<boolean> {
    try {
        await this.page.goto('/path');
        await this.page.waitForLoadState('networkidle');
        return true;
    } catch (error) {
        console.error('Navigation failed:', error);
        return false;
    }
}
```

### Action Methods
```typescript
async performAction(data: string): Promise<boolean> {
    try {
        await this.expectVisible(this.element);
        await this.fill(this.element, data);
        await this.click(this.submitButton);
        return await this.verifyActionSuccess();
    } catch (error) {
        console.error('Action failed:', error);
        return false;
    }
}
```

### Verification Methods
```typescript
async verifyElementState(): Promise<boolean> {
    try {
        await this.expectVisible(this.element, { timeout: 10000 });
        return true;
    } catch (error) {
        console.error('Verification failed:', error);
        return false;
    }
}
```

---

## 5. Error Handling
- Always use try-catch blocks for async operations.
- Return boolean values for success/failure states.
- Log meaningful error messages with context.
- Use appropriate timeouts for different operations.
- Take screenshots on failures for debugging.

---

## 6. Wait Strategies
- Use `expectVisible()` instead of `waitForSelector()` for better assertions.
- Implement custom wait conditions when needed.
- Handle dynamic content with proper wait strategies.
- Use `page.waitForLoadState('networkidle')` for page navigation.

---

## 7. Element Organization
Group related elements logically:
```typescript
export class FormPage extends BasePage {
    // Form Elements
    private readonly firstNameInput: Locator;
    private readonly lastNameInput: Locator;
    private readonly emailInput: Locator;
    
    // Action Elements  
    private readonly submitButton: Locator;
    private readonly cancelButton: Locator;
    
    // Feedback Elements
    private readonly successMessage: Locator;
    private readonly errorMessage: Locator;
}
```

---

## 8. Method Return Types
- **Boolean**: For success/failure operations
- **String**: For text retrieval operations
- **void**: For simple actions without verification needs
- **Objects**: For complex data retrieval

---

## 9. Best Practices
- Keep page objects focused on a single page or component.
- Use descriptive method and variable names.
- Implement proper TypeScript typing.
- Make methods reusable and independent.
- Handle both positive and negative scenarios.
- Add JSDoc comments for complex methods.

---

## 10. Testing Integration
Page objects should be easily testable:
```typescript
test('should perform login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    const navigated = await loginPage.navigateToLogin();
    expect(navigated).toBe(true);
    
    const loginResult = await loginPage.login('user', 'pass');
    expect(loginResult).toBe(true);
    
    const profileVisible = await loginPage.verifyLoginSuccess();
    expect(profileVisible).toBe(true);
});
```

---

# Common Anti-Patterns to Avoid
- Don't use hardcoded waits (`page.waitForTimeout()`) unless absolutely necessary.
- Don't create overly complex page objects that handle multiple pages.
- Don't ignore error handling in async operations.
- Don't use fragile selectors (like nth-child, absolute positions).
- Don't make page objects dependent on test data or other page objects.