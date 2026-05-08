import { test as base, expect } from "@playwright/test";

import { ApiClient } from "../api/ApiClient";
import { PWWebLibrary } from "../base/WebLibrary";
import { MockingUtility } from "../utils/MockingUtility";
import { config } from "../utils/config";
import { CustomAssert } from "../utils/customAssertions";
import { getTestCredentials } from "../constants/Constants";

// Type definition for LandingPage
type LandingPageType = any;
// NEW IMPORTS
import { PWApiLibrary } from "../api/ApiLibrary";
import { ApiManager } from "./ApiManager";
import { ConduitSignInPage } from "../pages/ConduitSignInPage";
import { ConduitSignUpPage } from "../pages/ConduitSignUpPage";
import { ConduitPostPage } from "../pages/ConduitPostPage";
import { ConduitProfilePage } from "../pages/ConduitProfilePage";

export type Fixtures = {

  pwLib: PWWebLibrary;
  api: ApiClient;
  mockUtil: MockingUtility;
  cfg: typeof config;
  customAssert: CustomAssert;
  testCredentials: { MOBILE: string; OTP: string };
  conduitSignInPage: ConduitSignInPage;
  conduitSignUpPage: ConduitSignUpPage;
  conduitPostPage: ConduitPostPage;
  conduitProfilePage: ConduitProfilePage;

  // NEW FIXTURE TYPES
  pwApiLib: PWApiLibrary;
  apiManager: ApiManager;
};

export const test = base.extend<Fixtures>({
  cfg: async ({ }, use) => {
    await use(config);
  },
  testCredentials: async ({ }, use) => {
    const env = process.env.NODE_ENV || "staging";
    const credentials = getTestCredentials(env);
    console.log(
      `🔑 Using ${env.toUpperCase()} test credentials: ${credentials.MOBILE}`
    );
    await use(credentials);
  },

  // --- START OF UPDATED API LOGIC ---

  pwApiLib: async ({ }, use) => {
    const env = process.env.NODE_ENV || "staging";
    const lib = new PWApiLibrary(env);
    await lib.init(); // Asynchronously initialize the library/auth
    await use(lib);
  },

  apiManager: async ({ pwApiLib }, use) => {
    // Provide the singleton instance to the test
    const instance = ApiManager.getInstance(pwApiLib.getApiClient());
    await use(instance);
  },

  // --- END OF UPDATED API LOGIC ---



  api: async ({ }, use, testInfo) => {
    const api = new ApiClient({
      testInfo: testInfo,
      autoCapture: true,
      capturePrefix: "API",
    });
    await api.init();
    await use(api);
    await api.dispose();
  },
  mockUtil: async ({ page }, use) => {
    const mockUtil = new MockingUtility(page, {
      logRequests: true,
      logResponses: true,
    });
    await use(mockUtil);
    await mockUtil.clearAllMocks();
  },
  customAssert: async ({ }, use) => {
    const assertInstance = new CustomAssert();
    await use(assertInstance);
    assertInstance.assertAll(); // auto flush soft failures after test
  },

  conduitSignInPage: async ({ page }, use) => {
    await use(new ConduitSignInPage(page));
  },
  conduitSignUpPage: async ({ page }, use) => {
    await use(new ConduitSignUpPage(page));
  },
  conduitPostPage: async ({ page }, use) => {
    await use(new ConduitPostPage(page));
  },
  conduitProfilePage: async ({ page }, use) => {
    await use(new ConduitProfilePage(page));
  },
});
export { expect };