# Architectural Decisions - Keychain Test Framework

This document outlines the architectural decisions and design patterns implemented in the `keychain-test` automation framework.

## 1. Core Technology Stack
- **Framework**: [Playwright](https://playwright.dev/) with **TypeScript** for robust, type-safe web and API automation.
- **Environment Management**: [dotenv](https://www.npmjs.com/package/dotenv) is used to manage environment-specific variables (e.g., `.env.staging`), allowing the same test suite to run across multiple environments.
- **Configuration**: Centralized configuration logic in `src/utils/config.ts` and `playwright.config.ts`.

## 2. Design Patterns
- **Page Object Model (POM)**: The framework strictly separates page-specific logic (locators and actions) in `src/pages/` from test assertions in `tests/`.
- **Base Layer Abstraction**: 
    - `BasePage.ts`: Provides a common foundation for all page objects.
    - `WebLibrary.ts`: Encapsulates common Playwright actions with custom logging, error handling, and synchronization logic.
- **Custom Fixtures**: Uses Playwright's fixture system (`src/fixtures/TestFixtures.ts`) to inject page objects and managers (like `ApiManager`) directly into tests, promoting clean and readable test code.

## 3. Test Organization & Execution
- **Segmentation**: Tests are categorized into `ui`, `api`, and `setup` directories.
- **Project-Based Execution**: `playwright.config.ts` defines multiple projects (e.g., `Chromium`, `CJR`, `API`, `OrderFlows`) to allow for granular test runs and specific configuration overrides.
- **Serial Execution**: Workers are constrained to `1` in the global config to ensure stability in environments where parallel execution might lead to data contention or session issues.

## 4. State Management & Optimization
- **Authentication Setup**: Dedicated `setup` projects (e.g., `auth.setup.ts`) handle the login process once per suite.
- **Storage State**: Authenticated browser states are saved to JSON files (e.g., `auth.json`, `cjrAuth.json`) and reused across tests using Playwright's `storageState` feature, significantly reducing test execution time.

## 5. Reporting and Observability
- **Allure Reporting**: Integrated `allure-playwright` for generating rich, interactive test reports including screenshots and traces.
- **Multi-format Reports**: Support for HTML, JSON, and JUnit (for CI integration) reporters.
- **Logging**: [log4js](https://www.npmjs.com/package/log4js) is used for framework-level logging to aid in debugging test failures.

## 6. Utilities and Helpers
- **API Manager**: A centralized `ApiManager` handle REST API interactions, ensuring consistent headers, error handling, and payload management.
- **Excel/Data Management**: Support for external data sources using `exceljs` for data-driven testing scenarios.
