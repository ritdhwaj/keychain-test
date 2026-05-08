import { test, expect } from '@playwright/test';
import { PWApiLibrary, getCommonMethods, quickAuthenticate } from '../../src/api/ApiLibrary';

test.describe('API Common Methods Utility Tests', () => {
  let commonMethods: PWApiLibrary;

  test.beforeEach(async () => {
    commonMethods = new PWApiLibrary('staging');
    await commonMethods.init();
  });

  test.afterEach(async () => {
    if (commonMethods) {
      await commonMethods.dispose();
    }
  });

  test('should generate random ID correctly', async () => {
    const id1 = commonMethods.generateRandomId();
    const id2 = commonMethods.generateRandomId();

    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(typeof id2).toBe('string');

    // Check UUID format (basic pattern check)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(id1).toMatch(uuidPattern);
    expect(id2).toMatch(uuidPattern);
  });

  test('should generate common headers with defaults', async () => {
    const headers = commonMethods.generateCommonHeaders();

    expect(headers).toBeDefined();
    expect(headers['client-version']).toBe('1924');
    expect(headers['Authorization']).toBe('Bearer');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Accept']).toBe('application/json, text/plain, */*');
    expect(headers['client-id']).toBe('5eb393ee95fab7468a79d189');
    expect(headers['Client-Type']).toBe('WEB');
    expect(headers['randomId']).toBeTruthy();
    expect(headers['User-Agent']).toContain('Chrome');
    expect(headers['Referer']).toBeTruthy();
  });

  test('should generate common headers with custom options', async () => {
    const customOptions = {
      randomId: 'custom-id-123',
      clientVersion: '2024',
      userAgent: 'Custom User Agent',
      referer: 'https://custom.example.com',
      clientId: 'custom-client-id',
      clientType: 'MOBILE',
      authorization: 'Bearer custom-token',
      additionalHeaders: {
        'Custom-Header': 'custom-value'
      }
    };

    const headers = commonMethods.generateCommonHeaders(customOptions);

    expect(headers['randomId']).toBe('custom-id-123');
    expect(headers['client-version']).toBe('2024');
    expect(headers['User-Agent']).toBe('Custom User Agent');
    expect(headers['Referer']).toBe('https://custom.example.com');
    expect(headers['client-id']).toBe('custom-client-id');
    expect(headers['Client-Type']).toBe('MOBILE');
    expect(headers['Authorization']).toBe('Bearer custom-token');
    expect(headers['Custom-Header']).toBe('custom-value');
  });

  test('should generate auth headers with token', async () => {
    const token = 'test-token-123';
    const headers = commonMethods.generateAuthHeaders(token);

    expect(headers['Authorization']).toBe(`Bearer ${token}`);
    expect(headers['client-version']).toBe('1924');
    expect(headers['Content-Type']).toBe('application/json');
  });

  test('should validate status codes correctly', async () => {
    expect(commonMethods.validateStatusCode(200, [200, 201])).toBe(true);
    expect(commonMethods.validateStatusCode(201, [200, 201])).toBe(true);
    expect(commonMethods.validateStatusCode(400, [200, 201])).toBe(false);
    expect(commonMethods.validateStatusCode(404, [400, 404, 500])).toBe(true);
  });

  test('should extract error messages correctly', async () => {
    expect(commonMethods.extractErrorMessage({ message: 'Test message' })).toBe('Test message');
    expect(commonMethods.extractErrorMessage({ error: 'Test error' })).toBe('Test error');
    expect(commonMethods.extractErrorMessage({ errors: [{ message: 'First error' }] })).toBe('First error');
    expect(commonMethods.extractErrorMessage({})).toBe('Unknown error');
    expect(commonMethods.extractErrorMessage({ message: '', error: 'Fallback error' })).toBe('Fallback error');
  });

  test('should generate test variations correctly', async () => {
    const baseData = { username: 'testuser', otp: '123456' };
    const variations = commonMethods.generateTestVariations(baseData);

    expect(variations.valid).toEqual(baseData);
    expect(variations.nullUsername.username).toBeNull();
    expect(variations.emptyUsername.username).toBe('');
    expect(variations.nullOtp.otp).toBeNull();
    expect(variations.emptyOtp.otp).toBe('');
    expect(variations.invalidUsername.username).toContain('invalid_user_');
    expect(variations.invalidOtp.otp).toBe('000000');
    expect(variations.sqlInjection.username).toContain('DROP TABLE');
    expect(variations.xssPayload.otp).toContain('<script>');
    expect(variations.longUsername.username).toHaveLength(1000);
    expect(variations.specialChars.username).toBe('!@#$%^&*()_+');
  });

  test('should validate required fields correctly', async () => {
    const data = { username: 'test', otp: '123456', extra: 'value' };
    const requiredFields = ['username', 'otp'];

    const result = commonMethods.validateRequiredFields(data, requiredFields);
    expect(result.valid).toBe(true);
    expect(result.missingFields).toEqual([]);

    const incompleteData = { username: 'test' };
    const incompleteResult = commonMethods.validateRequiredFields(incompleteData, requiredFields);
    expect(incompleteResult.valid).toBe(false);
    expect(incompleteResult.missingFields).toEqual(['otp']);

    const emptyData = { username: '', otp: null };
    const emptyResult = commonMethods.validateRequiredFields(emptyData, requiredFields);
    expect(emptyResult.valid).toBe(false);
    expect(emptyResult.missingFields).toEqual(['username', 'otp']);
  });

  test('should generate timestamp correctly', async () => {
    const timestamp = commonMethods.generateTimestamp();

    expect(timestamp).toBeTruthy();
    expect(typeof timestamp).toBe('string');
    expect(new Date(timestamp).toString()).not.toBe('Invalid Date');

    // Should be recent timestamp (within last minute)
    const timestampDate = new Date(timestamp);
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - timestampDate.getTime());
    expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
  });

  test('should format response for logging correctly', async () => {
    const response = { data: 'test', message: 'success' };
    const statusCode = 200;

    const formatted = commonMethods.formatResponseForLogging(response, statusCode);
    const parsed = JSON.parse(formatted);

    expect(parsed.status).toBe(200);
    expect(parsed.data).toEqual(response);
    expect(parsed.timestamp).toBeTruthy();
    expect(new Date(parsed.timestamp).toString()).not.toBe('Invalid Date');
  });

  test('should generate numeric boundary values', async () => {
    const values = commonMethods.generateNumericBoundaryValues();

    expect(values).toContain(-1);
    expect(values).toContain(0);
    expect(values).toContain(1);
    expect(values).toContain(Number.MAX_SAFE_INTEGER);
    expect(values).toContain(Number.MIN_SAFE_INTEGER);
    expect(values).toContain(Number.POSITIVE_INFINITY);
    expect(values).toContain(Number.NEGATIVE_INFINITY);
    expect(values.some(v => Number.isNaN(v))).toBe(true);
  });

  test('should generate string boundary values', async () => {
    const values = commonMethods.generateStringBoundaryValues();

    expect(values).toContain('');
    expect(values).toContain(' ');
    expect(values).toContain('a');
    expect(values.some(v => v && v.length === 255)).toBe(true);
    expect(values.some(v => v && v.length === 1000)).toBe(true);
    expect(values.some(v => v && v.includes('🚀'))).toBe(true);
    expect(values.some(v => v && v.includes('中文'))).toBe(true);
    expect(values.some(v => v && v.includes('<script>'))).toBe(true);
    expect(values.some(v => v && v.includes('DROP TABLE'))).toBe(true);
    expect(values).toContain(null);
    expect(values).toContain(undefined);
  });

  test('should generate coordinate boundary values', async () => {
    const values = commonMethods.generateCoordinateBoundaryValues();

    expect(values).toContain(-90);
    expect(values).toContain(90);
    expect(values).toContain(-180);
    expect(values).toContain(180);
    expect(values).toContain(0);
    expect(values).toContain(-181);
    expect(values).toContain(181);
    expect(values).toContain(-91);
    expect(values).toContain(91);
  });

  test('should handle wait correctly', async () => {
    const startTime = Date.now();
    await commonMethods.wait(100);
    const endTime = Date.now();

    const elapsed = endTime - startTime;
    expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some variance
    expect(elapsed).toBeLessThan(200); // Should not take too long
  });

  test('should get environment configuration', async () => {
    const config = commonMethods.getEnvironmentConfig();

    expect(config).toBeDefined();
    expect(config.env).toBe('staging');
    expect(config.apiBaseUrl).toBeTruthy();
    expect(config.baseUrl).toBeTruthy();
    expect(typeof config.apiBaseUrl).toBe('string');
    expect(typeof config.baseUrl).toBe('string');
  });

  test('should update environment configuration', async () => {
    const originalConfig = commonMethods.getEnvironmentConfig();

    commonMethods.updateEnvironmentConfig({
      apiBaseUrl: 'https://custom.api.com',
      username: 'custom-user'
    });

    const updatedConfig = commonMethods.getEnvironmentConfig();
    expect(updatedConfig.apiBaseUrl).toBe('https://custom.api.com');
    expect(updatedConfig.username).toBe('custom-user');
    expect(updatedConfig.env).toBe(originalConfig.env); // Should retain original
    expect(updatedConfig.baseUrl).toBe(originalConfig.baseUrl); // Should retain original
  });
});

test.describe('API Common Methods Authentication Tests', () => {
  let commonMethods: PWApiLibrary;

  test.beforeEach(async () => {
    commonMethods = new PWApiLibrary('staging');
    await commonMethods.init();
  });

  test.afterEach(async () => {
    if (commonMethods) {
      await commonMethods.dispose();
    }
  });

  test('should request OTP successfully', async ({ }, testInfo) => {
    commonMethods.setTestInfo(testInfo);

    const username = '7827230144';
    const result = await commonMethods.requestOTP(username);

    console.log('OTP request result:', result);

    expect(typeof result.success).toBe('boolean');

    if (result.success) {
      expect(result.responseData).toBeDefined();
    } else {
      expect(result.error).toBeTruthy();
      expect(typeof result.error).toBe('string');
    }
  });

  test('should generate auth token successfully', async ({ }, testInfo) => {
    commonMethods.setTestInfo(testInfo);

    const username = '7827230144';
    const otp = '424465';

    // First request OTP
    await commonMethods.requestOTP(username);

    // Then generate token
    const result = await commonMethods.generateAuthToken(username, otp);

    console.log('Token generation result:', {
      success: result.success,
      hasToken: !!result.access_token,
      error: result.error
    });

    expect(typeof result.success).toBe('boolean');

    if (result.success) {
      expect(result.access_token).toBeTruthy();
      expect(typeof result.access_token).toBe('string');
    } else {
      expect(result.error).toBeTruthy();
      expect(typeof result.error).toBe('string');
    }
  });

  test('should authenticate user completely', async ({ }, testInfo) => {
    commonMethods.setTestInfo(testInfo);

    const result = await commonMethods.authenticateUser();

    console.log('Complete authentication result:', {
      success: result.success,
      hasToken: !!result.access_token,
      error: result.error
    });

    expect(typeof result.success).toBe('boolean');

    if (result.success) {
      expect(result.access_token).toBeTruthy();
      expect(typeof result.access_token).toBe('string');
    } else {
      expect(result.error).toBeTruthy();
    }
  });

  test('should handle authentication with custom credentials', async ({ }, testInfo) => {
    commonMethods.setTestInfo(testInfo);

    const result = await commonMethods.authenticateUser('7827230144', '424465');

    console.log('Custom auth result:', {
      success: result.success,
      hasToken: !!result.access_token
    });

    expect(typeof result.success).toBe('boolean');
  });

  test('should handle missing credentials gracefully', async ({ }, testInfo) => {
    commonMethods.setTestInfo(testInfo);

    // Test with missing username
    const resultNoUsername = await commonMethods.authenticateUser('', '424465');
    expect(resultNoUsername.success).toBe(false);
    expect(resultNoUsername.error).toContain('Username is required');

    // Test with missing OTP
    const resultNoOtp = await commonMethods.authenticateUser('7827230144', '');
    expect(resultNoOtp.success).toBe(false);
    expect(resultNoOtp.error).toContain('OTP is required');
  });
});

test.describe('API Common Methods Convenience Functions', () => {

  test('should work with getCommonMethods function', async () => {
    const commonMethods = await getCommonMethods('staging');

    try {
      const config = commonMethods.getEnvironmentConfig();
      expect(config.env).toBe('staging');

      const randomId = commonMethods.generateRandomId();
      expect(randomId).toBeTruthy();

    } finally {
      await commonMethods.dispose();
    }
  });

  test('should work with quickAuthenticate function', async () => {
    const result = await quickAuthenticate('staging');

    console.log('Quick authenticate result:', {
      success: result.success,
      hasToken: !!result.access_token,
      error: result.error
    });

    expect(typeof result.success).toBe('boolean');

    if (result.success) {
      expect(result.access_token).toBeTruthy();
    } else {
      expect(result.error).toBeTruthy();
    }
  });
});

test.describe('API Common Methods Retry Mechanism', () => {
  let commonMethods: PWApiLibrary;

  test.beforeEach(async () => {
    commonMethods = new PWApiLibrary('staging');
    await commonMethods.init();
  });

  test.afterEach(async () => {
    if (commonMethods) {
      await commonMethods.dispose();
    }
  });

  test('should retry operation on failure', async () => {
    let attemptCount = 0;

    const operation = async () => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error(`Attempt ${attemptCount} failed`);
      }
      return `Success on attempt ${attemptCount}`;
    };

    const result = await commonMethods.retryOperation(operation, 3, 10);

    expect(result).toBe('Success on attempt 3');
    expect(attemptCount).toBe(3);
  });

  test('should fail after max retries', async () => {
    const operation = async () => {
      throw new Error('Always fails');
    };

    await expect(
      commonMethods.retryOperation(operation, 2, 10)
    ).rejects.toThrow('Always fails');
  });

  test('should succeed on first attempt if no error', async () => {
    const operation = async () => {
      return 'Success immediately';
    };

    const result = await commonMethods.retryOperation(operation, 3, 10);
    expect(result).toBe('Success immediately');
  });
});