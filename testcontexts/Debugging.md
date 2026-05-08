# Playwright MCP Context for Debugging and Troubleshooting

You are working with a Playwright + TypeScript framework and need to help with **debugging and troubleshooting** test issues.
Follow these guidelines for effective problem resolution:

---

## 1. Common Debugging Scenarios

### Test Failures
- **Selector Not Found**: Element locators are incorrect or timing issues
- **Timeout Errors**: Operations taking longer than expected
- **Assertion Failures**: Expected vs actual values don't match
- **Network Issues**: API calls failing or returning unexpected responses
- **Authentication Problems**: Tokens expired or credentials invalid

### Performance Issues
- **Slow Test Execution**: Inefficient wait strategies or heavy operations
- **Flaky Tests**: Intermittent failures due to timing or state issues
- **Resource Leaks**: Unclosed browsers or API contexts

---

## 2. Debugging Tools and Techniques

### Playwright Debug Mode
```bash
# Interactive debugging with browser
npx playwright test --debug

# Debug specific test
npx playwright test --debug tests/ui/Login.spec.ts

# Debug with headed browser
npx playwright test --headed --timeout=0
```

### Console Logging
```typescript
// In page objects
console.log('Current URL:', await this.page.url());
console.log('Element visible:', await this.element.isVisible());
console.log('Element text:', await this.element.textContent());

// In tests
console.log('Test data:', JSON.stringify(testData, null, 2));
console.log('Response status:', response.status());
```

### Screenshots and Videos
```typescript
// Manual screenshot
await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });

// Screenshot on failure (in test)
test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
        const screenshot = await page.screenshot();
        await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
    }
});
```

### Trace Viewer
```bash
# Record trace
npx playwright test --trace on

# View trace
npx playwright show-trace test-results/trace.zip
```

---

## 3. Element Debugging

### Selector Validation
```typescript
// Check if element exists
const elementCount = await page.locator('selector').count();
console.log(`Found ${elementCount} elements`);

// Get all matching elements
const elements = await page.locator('selector').all();
for (const element of elements) {
    console.log(await element.textContent());
}

// Wait and check visibility
try {
    await page.locator('selector').waitFor({ state: 'visible', timeout: 5000 });
    console.log('Element is visible');
} catch (error) {
    console.log('Element not visible within timeout');
}
```

### Element State Debugging
```typescript
const element = page.locator('selector');

console.log('Visible:', await element.isVisible());
console.log('Enabled:', await element.isEnabled());
console.log('Editable:', await element.isEditable());
console.log('Checked:', await element.isChecked());
console.log('Text:', await element.textContent());
console.log('Value:', await element.inputValue());
```

---

## 4. Network Debugging

### API Response Debugging
```typescript
// Listen to all network requests
page.on('request', request => {
    console.log('Request:', request.method(), request.url());
});

page.on('response', response => {
    console.log('Response:', response.status(), response.url());
});

// Check specific API call
const responsePromise = page.waitForResponse('**/api/endpoint');
await page.click('button');
const response = await responsePromise;
console.log('API Response:', await response.json());
```

### Request/Response Logging
```typescript
// In ApiClient
async post(endpoint: string, data: any) {
    console.log(`POST ${endpoint}:`, JSON.stringify(data, null, 2));
    const response = await this.requestContext.post(endpoint, { data });
    console.log(`Response ${response.status()}:`, await response.text());
    return response;
}
```

---

## 5. Common Error Patterns and Solutions

### "Selector Not Found" Errors
```typescript
// Problem: Element not found
await page.click('button'); // ❌

// Solutions:
// 1. Wait for element
await page.waitForSelector('button');
await page.click('button');

// 2. Use more robust selectors
await page.click('button:has-text("Submit")');

// 3. Multiple fallbacks
const button = page.locator('button[data-testid="submit"]')
    .or(page.getByRole('button', { name: 'Submit' }))
    .or(page.locator('.submit-btn'));
await button.click();
```

### Timeout Issues
```typescript
// Problem: Default timeout too short
await page.click('slow-loading-button'); // ❌

// Solutions:
// 1. Increase timeout for specific action
await page.click('slow-loading-button', { timeout: 30000 });

// 2. Wait for network to be idle
await page.waitForLoadState('networkidle');
await page.click('button');

// 3. Wait for specific condition
await page.waitForFunction(() => document.querySelector('button').disabled === false);
```

### Flaky Test Issues
```typescript
// Problem: Race conditions
await page.click('button');
await page.click('next-button'); // ❌ Might not be ready

// Solution: Wait for state changes
await page.click('button');
await page.waitForSelector('.loading', { state: 'hidden' });
await page.click('next-button');
```

---

## 6. Framework-Specific Debugging

### BasePage Method Debugging
```typescript
// Add debugging to BasePage methods
async click(locator: Locator, options?: ClickOptions): Promise<void> {
    try {
        console.log(`Clicking element: ${locator}`);
        await this.expectVisible(locator);
        await locator.click(options);
        console.log('Click successful');
    } catch (error) {
        console.error('Click failed:', error);
        await this.page.screenshot({ path: `click-error-${Date.now()}.png` });
        throw error;
    }
}
```

### API Authentication Debugging
```typescript
// Debug token generation
async generateToken(username: string, otp: string) {
    console.log('Generating token for:', username);
    const response = await this.post('/auth/token', { username, otp });
    console.log('Token response status:', response.status());
    
    if (!response.ok()) {
        const errorText = await response.text();
        console.error('Token generation failed:', errorText);
    }
    
    return response;
}
```

---

## 7. Environment-Specific Debugging

### Environment Configuration
```typescript
// Debug environment setup
console.log('Environment variables:');
console.log('BASE_URL:', process.env.BASE_URL);
console.log('API_BASE_URL:', process.env.API_BASE_URL);
console.log('USERNAME:', process.env.USERNAME ? '[SET]' : '[NOT SET]');
console.log('NODE_ENV:', process.env.NODE_ENV);
```

### Browser Context Debugging
```typescript
// Check browser state
const context = page.context();
console.log('Browser context cookies:', await context.cookies());
console.log('Browser context permissions:', await context.permissions());
```

---

## 8. Performance Debugging

### Test Execution Time
```typescript
test('performance test', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    console.log('Page load time:', Date.now() - startTime, 'ms');
    
    const actionStart = Date.now();
    await page.click('button');
    console.log('Action time:', Date.now() - actionStart, 'ms');
});
```

### Memory Usage Monitoring
```typescript
// Monitor browser memory
const client = await page.context().newCDPSession(page);
const metrics = await client.send('Performance.getMetrics');
console.log('Memory metrics:', metrics);
```

---

## 9. Debugging Checklist

### Before Debugging
- [ ] Is the test environment correctly configured?
- [ ] Are environment variables set properly?
- [ ] Is the application under test available and responsive?
- [ ] Are browser dependencies installed?

### During Debugging
- [ ] Enable headed mode to see browser actions
- [ ] Add console.log statements at key points
- [ ] Take screenshots before and after actions
- [ ] Record traces for detailed analysis
- [ ] Check network requests in dev tools

### After Debugging
- [ ] Remove temporary debug code
- [ ] Update selectors if needed
- [ ] Increase timeouts if appropriate
- [ ] Document findings for future reference

---

## 10. Emergency Debugging Commands

```bash
# Quick test run with maximum debugging
npx playwright test --debug --headed --timeout=0 --retries=0

# Generate detailed report
npx playwright test --reporter=html,line --output-dir=debug-results

# Run single test with trace
npx playwright test tests/specific.spec.ts --trace on --headed

# Check Playwright installation
npx playwright doctor

# Update browsers
npx playwright install

# Clear test results
rm -rf test-results playwright-report
```