import { Page, Route, Request, Response, APIResponse } from '@playwright/test';
import { logger } from './logger';

/**
 * Type definitions for mock configurations
 */
export interface MockResponse {
  status?: number;
  headers?: Record<string, string>;
  body?: any;
  contentType?: string;
  delay?: number;
}

export interface MockRequest {
  url: string | RegExp;
  method?: string;
  response: MockResponse;
  times?: number; // Number of times this mock should be applied (undefined = infinite)
  abort?: boolean; // If true, abort the request instead of mocking
}

export interface MockOptions {
  logRequests?: boolean;
  logResponses?: boolean;
  failOnUnmatchedRequests?: boolean;
}

/**
 * MockingUtility - A comprehensive utility for mocking API requests and responses in Playwright
 * 
 * Features:
 * - Mock HTTP requests with custom responses
 * - Support for different HTTP methods (GET, POST, PUT, DELETE, etc.)
 * - Pattern matching using strings or RegEx
 * - Configurable delays to simulate network latency
 * - Request interception and modification
 * - Response modification
 * - Request/Response logging
 * - Mock call counting and verification
 */
export class MockingUtility {
  private page: Page;
  private options: MockOptions;
  private activeMocks: Map<string, MockRequest> = new Map();
  private mockCallCounts: Map<string, number> = new Map();
  private capturedRequests: Request[] = [];
  private capturedResponses: Response[] = [];

  constructor(page: Page, options: MockOptions = {}) {
    this.page = page;
    this.options = {
      logRequests: options.logRequests ?? true,
      logResponses: options.logResponses ?? true,
      failOnUnmatchedRequests: options.failOnUnmatchedRequests ?? false,
    };
  }

  /**
   * Mock a single API request with a custom response
   * @param mockConfig - Configuration for the mock
   * @returns Promise<void>
   */
  async mockRequest(mockConfig: MockRequest): Promise<void> {
    const mockId = this.generateMockId(mockConfig);
    this.activeMocks.set(mockId, mockConfig);
    this.mockCallCounts.set(mockId, 0);

    await this.page.route(mockConfig.url, async (route: Route) => {
      const request = route.request();
      
      // Check if method matches (if specified)
      if (mockConfig.method && request.method() !== mockConfig.method.toUpperCase()) {
        await route.continue();
        return;
      }

      // Check if we've exceeded the number of times this mock should be applied
      const currentCount = this.mockCallCounts.get(mockId) || 0;
      if (mockConfig.times !== undefined && currentCount >= mockConfig.times) {
        await route.continue();
        return;
      }

      // Increment call count
      this.mockCallCounts.set(mockId, currentCount + 1);

      if (this.options.logRequests) {
        logger.info(`🎭 Mocking request: ${request.method()} ${request.url()}`);
      }

      // Handle request abortion
      if (mockConfig.abort) {
        logger.info(`❌ Aborting request: ${request.url()}`);
        await route.abort();
        return;
      }

      // Add delay if specified
      if (mockConfig.response.delay) {
        await this.delay(mockConfig.response.delay);
      }

      // Prepare response
      const response = {
        status: mockConfig.response.status || 200,
        headers: {
          'Content-Type': mockConfig.response.contentType || 'application/json',
          ...mockConfig.response.headers,
        },
        body: typeof mockConfig.response.body === 'string' 
          ? mockConfig.response.body 
          : JSON.stringify(mockConfig.response.body),
      };

      if (this.options.logResponses) {
        logger.info(`✅ Mocked response: ${response.status} for ${request.url()}`);
      }

      await route.fulfill(response);
    });

    logger.info(`🎯 Mock registered: ${mockConfig.method || 'ALL'} ${mockConfig.url}`);
  }

  /**
   * Mock multiple API requests at once
   * @param mockConfigs - Array of mock configurations
   */
  async mockMultipleRequests(mockConfigs: MockRequest[]): Promise<void> {
    for (const config of mockConfigs) {
      await this.mockRequest(config);
    }
  }

  /**
   * Mock a GET request
   * @param url - URL pattern to match
   * @param response - Mock response configuration
   */
  async mockGetRequest(url: string | RegExp, response: MockResponse): Promise<void> {
    await this.mockRequest({ url, method: 'GET', response });
  }

  /**
   * Mock a POST request
   * @param url - URL pattern to match
   * @param response - Mock response configuration
   */
  async mockPostRequest(url: string | RegExp, response: MockResponse): Promise<void> {
    await this.mockRequest({ url, method: 'POST', response });
  }

  /**
   * Mock a PUT request
   * @param url - URL pattern to match
   * @param response - Mock response configuration
   */
  async mockPutRequest(url: string | RegExp, response: MockResponse): Promise<void> {
    await this.mockRequest({ url, method: 'PUT', response });
  }

  /**
   * Mock a DELETE request
   * @param url - URL pattern to match
   * @param response - Mock response configuration
   */
  async mockDeleteRequest(url: string | RegExp, response: MockResponse): Promise<void> {
    await this.mockRequest({ url, method: 'DELETE', response });
  }

  /**
   * Intercept and modify requests before they are sent
   * @param urlPattern - URL pattern to intercept
   * @param modifier - Function to modify the request
   */
  async interceptRequest(
    urlPattern: string | RegExp,
    modifier: (request: Request) => Promise<{ headers?: Record<string, string>; postData?: string }>
  ): Promise<void> {
    await this.page.route(urlPattern, async (route: Route) => {
      const request = route.request();
      const modifications = await modifier(request);

      if (this.options.logRequests) {
        logger.info(`🔄 Intercepting and modifying request: ${request.url()}`);
      }

      await route.continue({
        headers: modifications.headers || request.headers(),
        postData: modifications.postData,
      });
    });
  }

  /**
   * Intercept and modify API responses
   * @param urlPattern URL or pattern to intercept
   * @param modifier Function to modify the response
   */
  async interceptResponse(
    urlPattern: string | RegExp,
    modifier: (response: APIResponse) => Promise<MockResponse>
  ): Promise<void> {
    await this.page.route(urlPattern, async (route: Route) => {
      const response = await route.fetch();
      const originalBody = await response.text();
      
      if (this.options.logResponses) {
        logger.info(`🔄 Intercepting and modifying response: ${response.url()}`);
      }

      const modifications = await modifier(response);

      await route.fulfill({
        status: modifications.status || response.status(),
        headers: modifications.headers || response.headers(),
        body: modifications.body !== undefined 
          ? (typeof modifications.body === 'string' ? modifications.body : JSON.stringify(modifications.body))
          : originalBody,
      });
    });
  }

  /**
   * Abort all requests matching the pattern
   * @param urlPattern - URL pattern to abort
   */
  async abortRequests(urlPattern: string | RegExp): Promise<void> {
    await this.mockRequest({
      url: urlPattern,
      response: {},
      abort: true,
    });
  }

  /**
   * Capture all requests for later inspection
   */
  startCapturingRequests(): void {
    this.capturedRequests = [];
    this.page.on('request', (request: Request) => {
      this.capturedRequests.push(request);
      if (this.options.logRequests) {
        logger.info(`📥 Captured request: ${request.method()} ${request.url()}`);
      }
    });
  }

  /**
   * Capture all responses for later inspection
   */
  startCapturingResponses(): void {
    this.capturedResponses = [];
    this.page.on('response', (response: Response) => {
      this.capturedResponses.push(response);
      if (this.options.logResponses) {
        logger.info(`📤 Captured response: ${response.status()} ${response.url()}`);
      }
    });
  }

  /**
   * Get all captured requests
   */
  getCapturedRequests(): Request[] {
    return this.capturedRequests;
  }

  /**
   * Get all captured responses
   */
  getCapturedResponses(): Response[] {
    return this.capturedResponses;
  }

  /**
   * Get captured requests matching a pattern
   * @param urlPattern - URL pattern to match
   */
  getRequestsByPattern(urlPattern: string | RegExp): Request[] {
    return this.capturedRequests.filter((req) => {
      if (typeof urlPattern === 'string') {
        return req.url().includes(urlPattern);
      }
      return urlPattern.test(req.url());
    });
  }

  /**
   * Get captured responses matching a pattern
   * @param urlPattern - URL pattern to match
   */
  getResponsesByPattern(urlPattern: string | RegExp): Response[] {
    return this.capturedResponses.filter((res) => {
      if (typeof urlPattern === 'string') {
        return res.url().includes(urlPattern);
      }
      return urlPattern.test(res.url());
    });
  }

  /**
   * Get the number of times a mock was called
   * @param mockConfig - The mock configuration
   */
  getMockCallCount(mockConfig: MockRequest): number {
    const mockId = this.generateMockId(mockConfig);
    return this.mockCallCounts.get(mockId) || 0;
  }

  /**
   * Verify that a mock was called a specific number of times
   * @param mockConfig - The mock configuration
   * @param expectedCount - Expected number of calls
   */
  verifyMockCalled(mockConfig: MockRequest, expectedCount: number): boolean {
    const actualCount = this.getMockCallCount(mockConfig);
    const result = actualCount === expectedCount;
    
    if (result) {
      logger.info(`✅ Mock verification passed: Called ${actualCount} times (expected ${expectedCount})`);
    } else {
      logger.error(`❌ Mock verification failed: Called ${actualCount} times (expected ${expectedCount})`);
    }
    
    return result;
  }

  /**
   * Clear all active mocks
   */
  async clearAllMocks(): Promise<void> {
    await this.page.unrouteAll({ behavior: 'ignoreErrors' });
    this.activeMocks.clear();
    this.mockCallCounts.clear();
    logger.info('🧹 All mocks cleared');
  }

  /**
   * Clear a specific mock
   * @param urlPattern - URL pattern of the mock to clear
   */
  async clearMock(urlPattern: string | RegExp): Promise<void> {
    await this.page.unroute(urlPattern);
    const mocksToRemove: string[] = [];
    
    this.activeMocks.forEach((mock, id) => {
      if (mock.url === urlPattern) {
        mocksToRemove.push(id);
      }
    });

    mocksToRemove.forEach((id) => {
      this.activeMocks.delete(id);
      this.mockCallCounts.delete(id);
    });

    logger.info(`🧹 Mock cleared for pattern: ${urlPattern}`);
  }

  /**
   * Reset all captured data
   */
  resetCapturedData(): void {
    this.capturedRequests = [];
    this.capturedResponses = [];
    logger.info('🔄 Captured data reset');
  }

  /**
   * Get statistics about all active mocks
   */
  getMockStatistics(): Map<string, { config: MockRequest; callCount: number }> {
    const stats = new Map<string, { config: MockRequest; callCount: number }>();
    
    this.activeMocks.forEach((config, id) => {
      stats.set(id, {
        config,
        callCount: this.mockCallCounts.get(id) || 0,
      });
    });

    return stats;
  }

  /**
   * Log all mock statistics
   */
  logMockStatistics(): void {
    const stats = this.getMockStatistics();
    
    logger.info('📊 Mock Statistics:');
    stats.forEach(({ config, callCount }, id) => {
      logger.info(`  ${id}: Called ${callCount} times`);
    });
  }

  /**
   * Helper method to generate a unique ID for a mock
   */
  private generateMockId(mockConfig: MockRequest): string {
    const url = typeof mockConfig.url === 'string' ? mockConfig.url : mockConfig.url.toString();
    const method = mockConfig.method || 'ALL';
    return `${method}:${url}`;
  }

  /**
   * Helper method to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Wait for a specific request to be made
   * @param urlPattern - URL pattern to wait for
   * @param timeout - Timeout in milliseconds
   */
  async waitForRequest(urlPattern: string | RegExp, timeout = 30000): Promise<Request> {
    return await this.page.waitForRequest(urlPattern, { timeout });
  }

  /**
   * Wait for a specific response to be received
   * @param urlPattern - URL pattern to wait for
   * @param timeout - Timeout in milliseconds
   */
  async waitForResponse(urlPattern: string | RegExp, timeout = 30000): Promise<Response> {
    return await this.page.waitForResponse(urlPattern, { timeout });
  }
}
