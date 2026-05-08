import { request, APIRequestContext, APIResponse, TestInfo } from '@playwright/test';
import { TokenManager } from '../utils/TokenManager';

export interface ApiClientOptions {
  testInfo?: TestInfo;
  autoCapture?: boolean;
  capturePrefix?: string;
  baseURL?: string;
}

export class ApiClient {
  private requestContext!: APIRequestContext;
  private adminRequestContext?: APIRequestContext; // Cache admin context
  private baseURL: string;
  private testInfo?: TestInfo;
  private autoCapture: boolean;
  private capturePrefix: string;
  private requestCounter: number = 0;

  constructor(options: ApiClientOptions = {}) {
    // Use provided baseURL, fallback to API_BASE_URL env var, then default staging URL
    this.baseURL = options.baseURL || process.env.API_BASE_URL || 'https://stage-api.penpencil.co';
    this.testInfo = options.testInfo;
    this.autoCapture = options.autoCapture ?? true; // Default to true
    this.capturePrefix = options.capturePrefix ?? 'API';
  }

  async init() {
    const token = TokenManager.getToken();
    this.requestContext = await request.newContext({
      baseURL: this.baseURL,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : (process.env.API_TOKEN ? { Authorization: `Bearer ${process.env.API_TOKEN}` } : {})),
      },
    });
  }

  /**
   * Set or update the test info for automatic request/response capture
   */
  setTestInfo(testInfo: TestInfo) {
    this.testInfo = testInfo;
  }

  /**
   * Enable or disable automatic capture
   */
  setAutoCapture(enabled: boolean) {
    this.autoCapture = enabled;
  }

  /**
   * Determine the appropriate base URL based on the endpoint
   */
  private getBaseURL(endpoint: string): string {
    // Use admin base URL if endpoint contains 'admin' and ADMIN_API_BASE_URL is available
    if (endpoint.includes('admin') && process.env.ADMIN_API_BASE_URL) {
      return process.env.ADMIN_API_BASE_URL;
    }
    return this.baseURL;
  }

  /**
   * Create a request context with the appropriate base URL for the endpoint
   */
  private async getRequestContext(endpoint: string): Promise<APIRequestContext> {
    const baseURL = this.getBaseURL(endpoint);
    
    // If the base URL is different from our current context, use or create admin context
    if (baseURL !== this.baseURL) {
      if (!this.adminRequestContext) {
        const token = TokenManager.getToken();
        this.adminRequestContext = await request.newContext({
          baseURL,
          extraHTTPHeaders: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Token ${token}` } : (process.env.API_TOKEN ? { Authorization: `Bearer ${process.env.API_TOKEN}` } : {})),
          },
        });
      }
      return this.adminRequestContext;
    }
    
    return this.requestContext;
  }

  /**
   * Automatically capture request and response data
   */
  private async captureRequestResponse(
    method: string,
    endpoint: string,
    requestData?: any,
    headers?: Record<string, string>,
    response?: APIResponse,
    responseBody?: any
  ) {
    if (!this.autoCapture || !this.testInfo) {
      return;
    }

    this.requestCounter++;
    const requestId = `${this.capturePrefix}-${this.requestCounter}`;

    try {
      // Capture request
      const requestCapture = {
        method,
        endpoint,
        url: `${this.baseURL}${endpoint}`,
        headers: headers || {},
        body: requestData,
        timestamp: new Date().toISOString()
      };

      await this.testInfo.attach(`${requestId} Request (${method} ${endpoint})`, {
        body: JSON.stringify(requestCapture, null, 2),
        contentType: 'application/json'
      });

      // Capture response if provided
      if (response && responseBody !== undefined) {
        const responseCapture = {
          status: response.status(),
          statusText: response.statusText(),
          headers: response.headers(),
          body: responseBody,
          timestamp: new Date().toISOString()
        };

        await this.testInfo.attach(`${requestId} Response (${response.status()})`, {
          body: JSON.stringify(responseCapture, null, 2),
          contentType: 'application/json'
        });
      }
    } catch (error) {
      console.warn('Failed to capture request/response:', error);
    }
  }

  async get(endpoint: string, options?: { headers?: Record<string, string> }): Promise<APIResponse> {
    const requestContext = await this.getRequestContext(endpoint);
    const response = await requestContext.get(endpoint, { headers: options?.headers });
    
    if (this.autoCapture && this.testInfo) {
      const responseBody = await response.json().catch(() => response.text().catch(() => null));
      await this.captureRequestResponse('GET', endpoint, undefined, options?.headers, response, responseBody);
    }
    
    return response;
  }

  async post(
    endpoint: string,
    body: any,
    options?: { headers?: Record<string, string>, multipart?: boolean }
  ): Promise<APIResponse> {
    
    let response: APIResponse;

    if (options?.multipart) {
      // 1. Strip Content-Type from headers to allow Playwright to set the boundary
      const filteredHeaders = { ...options.headers };
      Object.keys(filteredHeaders).forEach(key => {
        if (key.toLowerCase() === 'content-type') delete filteredHeaders[key];
      });

      // 2. Create a clean context to bypass the global JSON header inheritance
      const baseURL = this.getBaseURL(endpoint);
      const tempContext = await request.newContext({
        baseURL: baseURL,
        extraHTTPHeaders: filteredHeaders
      });

      response = await tempContext.post(endpoint, {
        multipart: body,
      });
    } else {
      const requestContext = await this.getRequestContext(endpoint);
      response = await requestContext.post(endpoint, {
        data: body,
        headers: options?.headers,
      });
    }

    if (this.autoCapture && this.testInfo) {
      const responseBody = await response.json().catch(() => null);
      await this.captureRequestResponse('POST', endpoint, body, options?.headers, response, responseBody);
    }
    
    return response;
  }

  async put(endpoint: string, body: any, options?: { headers?: Record<string, string> }): Promise<APIResponse> {
    const requestContext = await this.getRequestContext(endpoint);
    const response = await requestContext.put(endpoint, { data: body, headers: options?.headers });
    
    if (this.autoCapture && this.testInfo) {
      const responseBody = await response.json().catch(() => response.text().catch(() => null));
      await this.captureRequestResponse('PUT', endpoint, body, options?.headers, response, responseBody);
    }
    
    return response;
  }

  async delete(endpoint: string, options?: { headers?: Record<string, string> }): Promise<APIResponse> {
    const requestContext = await this.getRequestContext(endpoint);
    const response = await requestContext.delete(endpoint, { headers: options?.headers });
    
    if (this.autoCapture && this.testInfo) {
      const responseBody = await response.json().catch(() => response.text().catch(() => null));
      await this.captureRequestResponse('DELETE', endpoint, undefined, options?.headers, response, responseBody);
    }
    
    return response;
  }

    async patch(endpoint: string, body: any, options?: { headers?: Record<string, string> }): Promise<APIResponse> {
    const requestContext = await this.getRequestContext(endpoint);
    const response = await requestContext.patch(endpoint, { data: body, headers: options?.headers });
    
    if (this.autoCapture && this.testInfo) {
      const responseBody = await response.json().catch(() => response.text().catch(() => null));
      await this.captureRequestResponse('PATCH', endpoint, body, options?.headers, response, responseBody);
    }
    
    return response;
  }

  async dispose() {
    await this.requestContext.dispose();
    if (this.adminRequestContext) {
      await this.adminRequestContext.dispose();
    }
  }
}

