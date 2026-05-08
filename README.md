# Conduit E2E Test Automation Suite

This repository contains a comprehensive E2E automation test suite for the Conduit (RealWorld) application, covering both UI and API testing using Playwright.

## 🚀 Features

- **Global Authentication**: Centralized login via `auth.setup.ts` shared across UI and API.
- **UI Automation**: Full user journey from Sign-Up to Post management.
- **API Automation**: Direct backend testing for core operations.
- **Page Object Model (POM)**: Scalable and maintainable structure.
- **Custom Fixtures**: Simplified dependency injection.
- **Allure Reporting**: Rich, visual test reports.
- **Negative Testing**: Robust validation for edge cases.

## 🛠️ Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/)
- Local Conduit app running:
  - Frontend: `http://localhost:4101`
  - Backend API: `http://localhost:3000/api`

## ⚙️ Configuration

The project uses a `.env` file for environment-specific variables. Ensure your `.env` contains:

```env
BASE_URL=http://localhost:4101
API_BASE_URL=http://localhost:3000/api/
CONDUIT_TEST_EMAIL=conduituser@test.com
CONDUIT_TEST_PASSWORD=Conduit@123
USE_AUTH_STATE=true
```

> [!TIP]
> Setting `USE_AUTH_STATE=true` enables the `setup` project which logs in once and saves the state to `auth.json`. Both UI and API clients will automatically use this state.


## 📂 Project Structure

- `src/pages/`: Page Object Model classes.
- `src/fixtures/`: Custom Playwright fixtures.
- `src/api/`: API client and library utilities.
- `tests/ui/`: UI-based E2E test scenarios.
- `tests/api/`: API-driven E2E and negative tests.

## 🏃 Running Tests

### UI Tests

Run all UI tests:
```bash
npx playwright test tests/ui/ --project=Chromium
```

Run specific UI E2E flow:
```bash
npx playwright test tests/ui/ConduitE2E.spec.ts --project=Chromium
```

### API Tests

Run all API tests:
```bash
npx playwright test tests/api/ --project=API
```

Run specific API E2E journey:
```bash
npx playwright test tests/api/ConduitApiE2E.spec.ts --project=API
```

### Headed Mode

To see the browser in action:
```bash
npx playwright test tests/ui/ --project=Chromium --headed
```

## 📊 Reports

Generate and open the Allure report:
```bash
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

Or view the standard Playwright report:
```bash
npx playwright show-report
```

## 🧪 Key Test Scenarios

### UI Journey
1. **Registration**: Dynamic user creation with validation.
2. **Post CRUD**: Create, read, update, and delete articles.
3. **Interactions**: Commenting on posts and favoriting articles.
4. **Profile**: Verifying personal articles and profile updates.

### API Journey
1. **Auth**: Sign-up and Login status code and token verification.
2. **Article Management**: Creating, updating, and deleting articles via REST endpoints.
3. **Negative Cases**: Duplicate registration, unauthorized access, and invalid credentials.
