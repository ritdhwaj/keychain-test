
/**
 * ApiManager acts as a Central Hub (Facade).
 * It simplifies test code by grouping all services and controllers into one object.
 */
export class ApiManager {
  // Holds the single instance of this class shared across the worker process
  private static instance: ApiManager | null = null;


  /**
   * Private constructor prevents creating multiple instances via 'new ApiManager()'.
   * @param apiClient - The initialized communication layer used by all services.
   */
  private constructor(apiClient: ApiClient) {

  }

  /**
   * The global access point for the ApiManager.
   * If an instance doesn't exist, it creates one; otherwise, it returns the existing one.
   * This is highly efficient for parallel testing in Playwright.
   */
  public static getInstance(apiClient: ApiClient): ApiManager {
    if (!ApiManager.instance) {
      ApiManager.instance = new ApiManager(apiClient);
    }
    return ApiManager.instance;
  }

  /**
   * Clears the current instance.
   * Useful in 'afterEach' if you need a fresh start or different auth tokens for each test.
   */
  public static reset(): void {
    ApiManager.instance = null;
  }
}
