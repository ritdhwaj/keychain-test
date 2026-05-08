# Playwright MCP Context for Test Data Management

You are working with a Playwright + TypeScript framework that emphasizes proper **test data management** and **schema validation**.
Follow these guidelines for creating and managing test data:

---

## 1. POJO (Plain Old JavaScript Object) Pattern

### Location
- All request/response objects go in `data/pojo/`
- Use descriptive file names (e.g., `LoginRequest.ts`, `UserProfileResponse.ts`)

### Structure Pattern
```typescript
// data/pojo/ExampleRequest.ts
export interface ExampleRequest {
    field1: string;
    field2: number;
    field3?: boolean; // Optional field
}

export class ExampleRequestData {
    /**
     * Valid request data for positive testing
     */
    static getValidRequest(): ExampleRequest {
        return {
            field1: 'valid-value',
            field2: 123,
            field3: true
        };
    }
    
    /**
     * Invalid request data for negative testing
     */
    static getInvalidRequest(): ExampleRequest {
        return {
            field1: '', // Empty string
            field2: -1, // Invalid number
            field3: undefined
        };
    }
    
    /**
     * Request with environment fallback values
     */
    static getValidRequestWithEnvFallback(customValue?: string): ExampleRequest {
        return {
            field1: customValue || process.env.DEFAULT_FIELD1 || 'fallback-value',
            field2: parseInt(process.env.DEFAULT_FIELD2 || '123'),
            field3: process.env.DEFAULT_FIELD3 === 'true'
        };
    }
    
    /**
     * Boundary value testing data
     */
    static getBoundaryValues(): ExampleRequest[] {
        return [
            { field1: 'a', field2: 0, field3: false },           // Minimum
            { field1: 'x'.repeat(255), field2: 999999, field3: true }, // Maximum
            { field1: '', field2: -1, field3: undefined },        // Invalid
            { field1: null as any, field2: null as any, field3: null as any } // Null values
        ];
    }
}
```

---

## 2. JSON Schema Management

### Location
- All schemas go in `data/schema/`
- Use descriptive file names matching the response (e.g., `UserLoginResponse.schema.json`)

### Schema Structure
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["status", "data"],
  "properties": {
    "status": {
      "type": "string",
      "enum": ["success", "error"]
    },
    "data": {
      "type": "object",
      "required": ["id", "name"],
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^[0-9a-fA-F]{24}$"
        },
        "name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 100
        },
        "email": {
          "type": "string",
          "format": "email"
        }
      }
    },
    "message": {
      "type": "string"
    }
  }
}
```

### Schema Usage in Tests
```typescript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import responseSchema from '../../data/schema/ExampleResponse.schema.json';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv); // For email, date formats, etc.
const validateResponse = ajv.compile(responseSchema);

// In test
const response = await apiClient.post('/endpoint', requestData);
expect(validateResponse(response.json())).toBe(true);

if (!validateResponse(response.json())) {
    console.error('Schema validation errors:', validateResponse.errors);
}
```

---

## 3. Environment-Based Data

### Pattern for Dynamic Values
```typescript
export class EnvironmentData {
    /**
     * Get test user credentials based on environment
     */
    static getTestUser(env: string = 'staging'): { username: string; password: string } {
        const envPrefix = env.toUpperCase();
        return {
            username: process.env[`${envPrefix}_TEST_USERNAME`] || process.env.USERNAME || 'default-user',
            password: process.env[`${envPrefix}_TEST_PASSWORD`] || process.env.PASSWORD || 'default-pass'
        };
    }
    
    /**
     * Get API endpoints based on environment
     */
    static getEndpoints(env: string = 'staging'): Record<string, string> {
        const baseUrl = process.env.API_BASE_URL || 'https://stage-api.penpencil.co';
        return {
            login: `${baseUrl}/v1/users/login`,
            profile: `${baseUrl}/v1/users/profile`,
            logout: `${baseUrl}/v1/users/logout`
        };
    }
}
```

---

## 4. Test Data Variations

### Positive Test Data
```typescript
static getValidVariations(): ExampleRequest[] {
    return [
        { field1: 'standard-value', field2: 100, field3: true },
        { field1: 'UPPERCASE', field2: 1, field3: false },
        { field1: 'with-special-chars!@#', field2: 999, field3: true },
        { field1: 'unicode-тест-测试', field2: 500, field3: false }
    ];
}
```

### Negative Test Data
```typescript
static getInvalidVariations(): Array<{ data: Partial<ExampleRequest>; description: string }> {
    return [
        { data: { field1: '', field2: 100, field3: true }, description: 'empty field1' },
        { data: { field1: 'valid', field2: -1, field3: true }, description: 'negative field2' },
        { data: { field1: 'valid', field2: 100 }, description: 'missing field3' },
        { data: { field2: 100, field3: true }, description: 'missing field1' },
        { data: { field1: null as any, field2: 100, field3: true }, description: 'null field1' },
        { data: { field1: 'x'.repeat(1000), field2: 100, field3: true }, description: 'oversized field1' }
    ];
}
```

---

## 5. Dynamic Data Generation

### Timestamp-based Data
```typescript
static generateTimestampedData(): ExampleRequest {
    const timestamp = Date.now();
    return {
        field1: `test-${timestamp}`,
        field2: timestamp % 1000,
        field3: timestamp % 2 === 0
    };
}
```

### Random Data Generation
```typescript
static generateRandomData(): ExampleRequest {
    return {
        field1: `user-${Math.random().toString(36).substr(2, 9)}`,
        field2: Math.floor(Math.random() * 1000),
        field3: Math.random() > 0.5
    };
}
```

---

## 6. Data Cleanup Patterns

### Cleanup Tracking
```typescript
export class DataCleanupManager {
    private static createdResources: string[] = [];
    
    static trackResource(resourceId: string) {
        this.createdResources.push(resourceId);
    }
    
    static async cleanupAll(apiClient: ApiClient) {
        for (const resourceId of this.createdResources) {
            try {
                await apiClient.delete(`/resource/${resourceId}`);
            } catch (error) {
                console.warn(`Failed to cleanup resource ${resourceId}:`, error);
            }
        }
        this.createdResources = [];
    }
}
```

---

## 7. Configuration Data

### Test Configuration Objects
```typescript
export const TestConfig = {
    timeouts: {
        short: 5000,
        medium: 10000,
        long: 30000
    },
    retries: {
        api: 3,
        ui: 2
    },
    endpoints: {
        healthCheck: '/health',
        status: '/status'
    }
};
```

---

## 8. Best Practices

### Do's
- ✅ Use static factory methods for data creation
- ✅ Provide multiple variations (valid/invalid)
- ✅ Include boundary value testing data
- ✅ Use environment variables for sensitive data
- ✅ Create reusable data generators
- ✅ Implement proper cleanup strategies

### Don'ts  
- ❌ Hardcode sensitive data in POJO files
- ❌ Create overly complex data objects
- ❌ Ignore schema validation failures
- ❌ Use production data in tests
- ❌ Forget to clean up created test data

---

## 9. Integration with Tests

### API Test Integration
```typescript
test('should create user successfully', async () => {
    const requestData = ExampleRequestData.getValidRequest();
    const response = await apiClient.post('/users', requestData);
    
    expect(response.status()).toBe(201);
    expect(validateResponse(response.json())).toBe(true);
    
    // Track for cleanup
    DataCleanupManager.trackResource(response.json().data.id);
});
```

### UI Test Integration
```typescript
test('should login with valid credentials', async ({ page }) => {
    const userData = EnvironmentData.getTestUser();
    const loginPage = new LoginPage(page);
    
    const result = await loginPage.login(userData.username, userData.password);
    expect(result).toBe(true);
});
```