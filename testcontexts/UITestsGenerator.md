# Playwright MCP Context for UI Tests

You are an expert in Playwright automation working in a Playwright + TypeScript automation framework that focuses on **UI testing** using the Page Object Model (POM) pattern.
Follow these rules while generating or updating UI tests:

---

## 1. Page Object Model Structure
- All page objects should be located under `src/pages/`.
- Each page should extend `BasePage` class for common functionality.
- Use clear, descriptive class names (e.g., `LoginPage`, `DashboardPage`, `UserProfilePage`).
- Group related elements and actions within logical page objects.

---

## 2. Element Locators
- Use data-testid attributes where available for more stable selectors.
- Prefer semantic selectors (getByRole, getByText, getByLabel) over CSS selectors.
- Fallback to CSS selectors only when semantic options aren't available.
- Create robust selectors with multiple fallback options using `.or()` method.
- Use descriptive variable names for locators (e.g., `submitButton`, `usernameInput`).

---

## 3. Test Structure
- All UI tests should be located under `tests/ui/` if existing test file for feature exist add new cases inside same if not create new file.
- use 'TestFixtures' for pages and PWWebLibrary
- Group related tests in logical describe blocks.
- Use clear, descriptive test names that explain the expected behavior.
- Follow the AAA pattern: Arrange, Act, Assert.

---

## 4. Test Coverage
For every UI feature:
- Write **positive test cases** (happy path scenarios).
- Write **negative test cases** (error conditions, invalid inputs).
- Test **edge cases** (boundary values, special characters).
- Validate **visual elements** (visibility, text content, states).
- Test **user interactions** (clicks, form submissions, navigation).

---

## 5. Page Object Methods
- Create reusable methods for common actions (e.g., `login()`, `navigateToPage()`).
- Methods should return meaningful values (boolean for success/failure, strings for text content).
- Use async/await for all Playwright operations.
- Handle timeouts and wait conditions appropriately.
- Add proper error handling and logging.

---

## 6. Assertions
- Use CustomAssertions.ts from utils for Assertions , if any assertion needed doesn't exist update inside CustomAssertions file and use from there, do not directly use expect.
- Assert on element states (visible, enabled, text content).
- Validate page navigation and URL changes.
- Check for expected UI changes after actions.

---

## 7. Test Data Management
- Use environment variables for credentials and URLs.
- Create test data objects in `data/` directory.
- do not directly use any data in tests use it from constants file
- Support multiple test environments (staging, production).
- Avoid hardcoding sensitive information.

---

## 8. Error Handling
- Implement retry logic for flaky elements.
- Use appropriate timeouts for different operations.
- Capture screenshots on failures for debugging.
- Log meaningful error messages with context.

---

## 9. Best Practices
- Keep page objects focused and single-responsibility.
- Use TypeScript types for better code quality.
- Implement proper wait strategies (waitForSelector, waitForLoadState).
- Make tests independent and able to run in any order.
- Clean up test data when necessary.

---

# Example Page Object Structure
```typescript
export class LoginPage extends BasePage {
    private readonly usernameInput: Locator;
    private readonly passwordInput: Locator;
    private readonly submitButton: Locator;
    
    constructor(page: Page) {
        super(page);
        this.usernameInput = page.getByTestId('username-input')
            .or(page.getByRole('textbox', { name: 'Username' }));
        this.passwordInput = page.getByTestId('password-input')
            .or(page.getByRole('textbox', { name: 'Password' }));
        this.submitButton = page.getByTestId('submit-button')
            .or(page.getByRole('button', { name: 'Login' }));
    }
    
    async login(username: string, password: string): Promise<boolean> {
        await this.fill(this.usernameInput, username);
        await this.fill(this.passwordInput, password);
        await this.click(this.submitButton);
        return await this.verifyLoginSuccess();
    }
}
```

---

# Example Test Structure
```typescript
test.describe('Login Functionality', () => {
    let loginPage: LoginPage;
    
    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.navigate('/login');
    });
    
    test('should login with valid credentials', async () => {
        const result = await loginPage.login('validuser', 'validpass');
        expect(result).toBe(true);
    });
});
```