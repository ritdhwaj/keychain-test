import { APIResponse, TestInfo } from '@playwright/test';
import { ApiClient } from './ApiClient';

import * as dotenv from 'dotenv';
import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv();
addFormats(ajv);

export interface CommonHeadersOptions {
  randomId?: string;
  clientVersion?: string;
  userAgent?: string;
  referer?: string;
  clientId?: string;
  clientType?: string;
  authorization?: string;
  additionalHeaders?: Record<string, string>;
}

export interface TokenGenerationResult {
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  tokenType?: string;
  expiresIn?: number;
  userData?: any;
  error?: string;
  statusCode?: number;
}

export interface OtpRequestResult {
  success: boolean;
  error?: string;
  statusCode?: number;
  responseData?: any;
}

export interface ApiEnvironmentConfig {
  apiBaseUrl: string;
  adminApiBaseUrl: string;
  baseUrl: string;
  username?: string;
  password?: string;
  env: string;
}

export interface ApiCallData<T> {
  requestBody?: T;
  responseData: APIResponse;
}

export interface DateResponse {
  fullDate: string;
  year: string;
}


export class PWApiLibrary {
  private apiClient: ApiClient;
  private envConfig: ApiEnvironmentConfig;

  constructor(env: string = 'staging', apiClient?: ApiClient) {
    this.envConfig = this.loadEnvironmentConfig(env);
    this.apiClient = apiClient || new ApiClient({
      autoCapture: true,
      capturePrefix: 'Common'
    });
  }

  /**
   * Initialize the API client
   */
  async init() {
    await this.apiClient.init();
  }

  /**
   * Get the ApiClient instance
   */
  getApiClient(): ApiClient {
    return this.apiClient;
  }

  /**
   * Load environment configuration based on specified environment
   */
  private loadEnvironmentConfig(env: string): ApiEnvironmentConfig {
    // Load environment file
    dotenv.config({ path: `.env.${env}` });

    return {
      apiBaseUrl: process.env.API_BASE_URL || 'https://stage-api.penpencil.co',
      adminApiBaseUrl: process.env.ADMIN_API_BASE_URL || 'https://admin-stage-api.penpencil.co',
      baseUrl: process.env.BASE_URL || 'https://staging.physicswallah.live',
      username: process.env.USERNAME,
      password: process.env.PASSWORD,
      env
    };
  }

  /**
   * Generate a random UUID for request tracking
   */
  generateRandomId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // fallback for Node.js < 16.14
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Generate common headers for API requests
   */
  generateCommonHeaders(options: CommonHeadersOptions = {}): Record<string, string> {
    const defaultHeaders = {
      'client-version': options.clientVersion || process.env.CLIENT_VERSION || '1924',
      'Authorization': options.authorization || 'Bearer',
      'User-Agent': options.userAgent || process.env.USER_AGENT || 'Playwright/1.40.0',
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      'Referer': options.referer || this.envConfig.baseUrl,
      'randomId': options.randomId || this.generateRandomId(),
      'client-id': options.clientId || process.env.CLIENT_ID || '5eb393ee95fab7468a79d189',
      'Client-Type': options.clientType || 'WEB',
    };

    // Merge with additional headers if provided
    return { ...defaultHeaders, ...options.additionalHeaders };
  }

  /**
   * Generate authentication headers with token
   */
  generateAuthHeaders(token: string, options: CommonHeadersOptions = {}): Record<string, string> {
    return this.generateCommonHeaders({
      ...options,
      authorization: `Bearer ${token}`
    });
  }

  generateAdminHeaders(token: string): Record<string, string> {
    return this.generateCommonHeaders({
      clientType: 'ADMIN',
      authorization: `Bearer ${token}`
    });
  }


  /**
 * Generate minimal headers for simple API requests
 */
  generateMinimalHeaders(options: Partial<CommonHeadersOptions> = {}): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.additionalHeaders
    };
  }

  /**
   * Request OTP for the given username
   */

  validateSchema(schema: object, data: any): boolean {
    const validate = ajv.compile(schema);
    const isValid = validate(data);

    if (!isValid) {
      console.error(validate.errors);
    }

    return isValid;
  }


  /**
   * 
   * @param params - To pass the queryParam object
   * @returns - To return the queryParam as string
   */
  async buildQueryParams(params?: any): Promise<string> {
    if (!params || typeof params !== 'object') {
      return '';
    }

    const queryParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        queryParams.append(key, value); // no quotes
      } else {
        queryParams.append(key, JSON.stringify(value)); // preserve structure
      }
    }

    return '/?' + decodeURIComponent(queryParams.toString());
  }

  /**
   * Clean up resources
   */
  async dispose() {
    await this.apiClient.dispose();
  }

  /**
   * Generate a unique name with Automation prefix and current milliseconds
   */
  generateRandomName(): string {
    return `Automation_${Date.now()}`;
  }
}

// Export convenience functions
export async function getCommonMethods(env: string = 'staging'): Promise<PWApiLibrary> {
  const commonMethods = new PWApiLibrary(env);
  await commonMethods.init();
  return commonMethods;
}

export async function quickAuthenticate(env: string = 'staging'): Promise<TokenGenerationResult> {
  const commonMethods = await getCommonMethods(env);
  try {
    return await commonMethods.authenticateUser();
  } finally {
    await commonMethods.dispose();
  }
}

export async function quickAdminAuthenticate(env: string = 'staging', username?: string, password?: string): Promise<TokenGenerationResult> {
  const commonMethods = await getCommonMethods(env);
  try {
    return await commonMethods.generateAdminToken(username, password);
  } finally {
    await commonMethods.dispose();
  }
}

/**
 * Returns an ISO string with today's date and current time, 
 * optionally adding a number of days.
 * @param addDays Number of days to add (optional)
 */
export function getCurrentDateTimeWithOffset(addDays?: number): string {
  const now = new Date();
  if (addDays) {
    now.setDate(now.getDate() + addDays);
  }
  return now.toISOString();
}

/**
 * @param data - Your POJO array
 * @param fileName - Name without extension (e.g., "Questions_Report")
 * @param format - Explicitly 'xlsx' or 'csv'
 */

export async function generateFileForApi(
  data: any[],
  fileName: string,
  format: 'xlsx' | 'csv'
): Promise<File> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');

  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    worksheet.columns = headers.map(key => ({ header: key, key: key }));
    worksheet.addRows(data);
  }

  // Define full name and MIME type based on the EXPLICIT format
  const fullFileName = `${fileName}.${format}`;
  const mimeType = format === 'csv'
    ? 'text/csv'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  // Generate the specific buffer
  const buffer = format === 'csv'
    ? await workbook.csv.writeBuffer()
    : await workbook.xlsx.writeBuffer();


  /** UNCOMMENT THIS FOR DEBUGGING */

  // const exportDir = path.join(process.cwd(), 'exported_files');
  // if (!fs.existsSync(exportDir)) {
  //   fs.mkdirSync(exportDir);
  // }
  // const filePath = path.join(exportDir, fullFileName);
  // fs.writeFileSync(filePath, Buffer.from(buffer));
  // console.log(`✅ File successfully exported to: ${filePath}`);

  return new File([buffer], fullFileName, { type: mimeType });
}

/**
 * Returns today's date in IST (Indian Standard Time) formatted as "DD Month YYYY" and the year.
 * Optionally adds a number of days to the date.
 * @param count - Number of days to add (optional, defaults to 0)
 */
export async function getTodayData(count: number = 0): Promise<DateResponse> {
  const today = new Date();

  // Add days if count is provided
  if (count !== 0) {
    today.setDate(today.getDate() + count);
  }

  // Create the formatter for "01 January 2002" in IST timezone
  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  });

  const fullDate = formatter.format(today);

  // Extract the year from the parts (most reliable way)
  const parts = formatter.formatToParts(today);
  const year = parts.find(p => p.type === 'year')?.value || "";

  return {
    fullDate, // e.g., "09 January 2026" (IST)
    year      // e.g., "2026"
  };
}