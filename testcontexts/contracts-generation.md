# Playwright MCP Context for API Tests

You are an expert in Playwright automation and working in a Playwright + TypeScript automation framework that includes API testing.
Follow these rules while generating or updating API tests:

## User Input Requirements
When requesting API automation, always provide:
- **Test file location path** (e.g., tests/api/contracts/UserService or tests/api/contracts/vpService)
- **Request file path** (e.g., data/pojo/request/vpService/addOfferCoursesRequest.ts)
- Request path (e.g., /api/v1/resource)
- Response path (e.g., /api/v1/resource/response) (Optional)
- Service path (e.g., src/api/services/UserService)
- API Name (e.g., CreateCategory)
- Positive case cURL command (a working cURL for the happy path)

---

## Service File Handling
- **If service file exists:** Add only the new resource path constant and method to the existing file (do not rewrite the entire file)
- **If service file does not exist:** Create a new one following the conventions from VPService.ts as reference
- The service file must include:
  - Resource path constants for each endpoint
  - Methods for each endpoint, using the correct request/response types
  - For payload use any instead of the request import
  - Proper imports and class structure as per project standards

---

## Automated Generation Rules
- Parse the provided cURL to automatically extract endpoint, method, payload, and headers
- Automatically generate a valid TypeScript request POJO with proper interfaces
- For POST/PUT/PATCH requests: Generate `contractsPositivePayload()` function
- Parse the request payload and programmatically generate all possible combinations of payload methods, ensuring every attribute (including nested and arrays) is covered for both positive and negative cases, regardless of attribute count.

---

## Service File Creation
- If the specified service file (e.g., src/api/services/SomeService.ts) does not exist, automatically create it using the conventions from existing service files (such as VPService.ts).
- The service file must include:
  - Resource path constants for each endpoint
  - Methods for each endpoint, using the correct request/response types
  - Proper imports and class structure as per project standards

---

## 1. Test Structure
- All Contracts API tests should be located under tests/api/contracts/<serviceName>.
- If an API test file for the given endpoint already exists, add only the new cases inside the existing file instead of rewriting from scratch.
- If no test file exists, create a new one following the API Name mentioned by the user on the input requirements.

---

## 2. Test Coverage
For every provided API request (e.g., a curl command):
- Write positive test cases (happy path, expected responses).
- Write negative test cases (invalid payloads, missing fields, incorrect headers, unauthorized access, etc.).
- For negative cases, the process must be FULLY AUTOMATED:
  - Automatically enumerate all attributes (including nested) in the POJO request.
  - Calculate and log the total attribute count and expected negative combination count.
  - Generate all required negative data combinations for each attribute:
    - Field missing
    - Field = null
    - Field = empty string (if string)
    - Field = wrong type (number, boolean, object, array, etc.)
    - Field = security attack string (if string)
    - Field = boundary/min/max value (if applicable)
  - For nested objects, recursively apply the same rules to all subfields.
  - For arrays, test with empty array, wrong type, and invalid element types.
  - For the entire payload, include: all fields missing, all fields null, extra/unexpected field, malformed payload, security attack string, drop table query
  - After generation, count the number of created combinations and compare with the expected total.
  - NO MANUAL INTERVENTION is allowed at any step.
  - Output generated data combinations as TypeScript objects in the POJO file.

---

## 3. Request Handling
- Do not hardcode request payloads in the test.
- Create a POJO (Plain Old JavaScript/TypeScript Object) under data/pojo/ for each request type.
- Use the generic interface ApiTestCase<T> from src/api/types/ApiTestTypes.ts:

export interface ApiTestCase<T = any> {
  scenario: string;
  payload: T | any;
  expectedStatus: number;
  expectedResponse: any;
}

- For any api with /admin in endpoint use adminToken from PWApiLibrary.ts, otherwise use client token.
- Use PWApiLibrary from src/api class for commonly used methods (Authentications, headers).

---

## 4. Response Handling
- Validate responses against: 1. Expected values (status codes, response fields) and 2. Schema validation (using ajv or similar).
- Store all schemas under data/schema/ with clear naming (e.g., getUser.schema.json).
- Always reference the schema dynamically instead of embedding inline.

---

## 5. Environment Configuration
- API base URLs, authentication tokens, and environment details must come from .env files (e.g., .env.staging).
- Always access env variables via process.env. Default to .env.staging if values are missing.

---

## 6. Utilities
- Use ApiClient.ts helper under src/api/ to wrap Playwright's request context.
- Use fixtures/TestFixtures for using ApiClient.
- Tests must use fixtures/TestFixtures instead of calling Playwright's raw request methods.

---

## 7. Assertions
- Use CustomAssert assertions from utils/CustomAssertions.ts. Do not directly use expect.
- Assert: Correct status codes, Response body values, and Schema compliance.
- Use StatusCodes import (e.g., StatusCodes.Ok) instead of hardcoded numbers.
- **IMPORTANT:** Use key-by-key response validation for all contract tests. This prevents JSON serialization key-ordering issues from causing false failures.
  - Validate response keys match expected keys: `JSON.stringify(Object.keys(response).sort()) === JSON.stringify(Object.keys(data.expectedResponse).sort())`
  - For nested objects: Use `stringToContain` with individual JSON.stringify of each field
  - For primitives/arrays: Use direct `valueToEqual` comparison

---

## 8. Output Requirements
- Generate complete, runnable TypeScript code with imports.
- Use proper TypeScript typing for request and response objects.
- Once the user passes the instruction, Agent has to add the import and other combinations of the data.

---

## 9. STRICT Negative Test Coverage Requirements (Automated)
- Process must: Count attributes, calculate combinations, generate them, and verify count matches total.
- STRICT: No manual intervention is allowed at any step.

### Example: Negative Test Matrix for a Payload with Three Fields

| Case | Scenario | Example |
|---|---|---|
| 1 | mobile missing | { countryCode, subOrgId } |
| 2 | countryCode missing | { mobile, subOrgId } |
| 3 | subOrgId missing | { mobile, countryCode } |
| 4 | mobile = null | { mobile: null, countryCode, subOrgId } |
| 5 | countryCode = null | { mobile, countryCode: null, subOrgId } |
| 6 | subOrgId = null | { mobile, countryCode, subOrgId: null } |
| 7 | mobile = '' | { mobile: '', countryCode, subOrgId } |
| 8 | wrong type (mobile:number) | { mobile: 1234, countryCode, subOrgId } |
| 9 | Extra field present | { mobile, countryCode, subOrgId, extraField: 'x' } |
| 10 | Completely missing payload | {} |
| 11 | Malformed payload | "just a string" or [1,2,3] instead of object |
| 12 | Security attack string | { mobile: '<script>', countryCode, subOrgId } |
| 13 | Missing/invalid header(s) | valid payload, invalid/missing header |

#### Checklist for every endpoint:
- [ ] Each required field missing
- [ ] Each field as null
- [ ] Each field as invalid type
- [ ] Each field empty value (string fields)
- [ ] All required missing/null
- [ ] Extra/unexpected field present
- [ ] Boundary/min/max values tested
- [ ] Malformed payload structure
- [ ] Security/threat pattern tested
- [ ] Malformed/missing/invalid required headers
- [ ] Security attack payload & Drop table query string as payload
- [ ] Unauthorized/forbidden access (tested separately after matrix loop)

---

---

## 10. Execution & Self-Healing Logic (STRICT)

### 10.1 CRITICAL STATUS CODE RULE (NON-NEGOTIABLE)
For EVERY negative test case:
- Expected result: 4xx or 5xx
- If API returns 2xx → this is a SERVER VALIDATION BUG

---

### 10.2 Self-Healing Mechanism (ONLY for 4xx/5xx)

Healing rules:
- Actual API response is the source of truth ONLY if status is 4xx/5xx
- Update expectedStatus and expectedResponse accordingly
- NEVER accept 2xx for negative cases

---

### 10.3 Iteration Rule
- Continue healing until:
  - All negative cases return 4xx/5xx
  - OR any negative case returns 2xx → SKIP HEALING & MARK AS SERVER BUG

---

### 10.4 Batch Healing Rule (MANDATORY – LOOP PREVENTION)

The agent MUST NOT heal test cases one by one.

Healing MUST follow a batch-based strategy:
- Execute the test suite ONCE per iteration
- Collect ALL failed test cases before applying any updates
- Group failures by error signature
- Apply updates to ALL matching test cases in ONE pass
- Re-run tests ONLY after all grouped updates are applied

Healing per individual test failure is STRICTLY FORBIDDEN.

---

### 10.5 Error Signature Definition (MANDATORY)

Error Signature =
  <actualStatusCode> + "|" + <error.message OR error.code OR serialized error body>

Examples:
- 400|username is required
- 401|Unauthorized
- 422|Invalid request payload

All test cases sharing the same error signature MUST be healed together.

---

### 10.6 Global 2xx Detection & Skip Healing Rule (NON-NEGOTIABLE)

Before performing ANY healing:
- Scan ALL failed negative cases
- If ANY negative case returns 2xx:
  - SKIP healing
  - DO NOT update any POJO for 2xx
  - Add TODO on such cases as CRITICAL SERVER BUGS and provide the scenario names

This validation MUST happen before grouping or healing.

---

## 10.7 Re-Execution Constraint (STRICT)

Within a single batch healing iteration:
- Tests may run at most ONCE before healing
- Tests may run at most ONCE after batch healing
- Multiple batch re-runs are NOT allowed

For field-by-field healing (fallback mode):
- Each field may be re-run multiple times with `--grep`
- Limit to max 3 re-runs per field to prevent infinite loops

---

### 10.8 Healing Deduplication Rule

If a test case already has matching expectedStatus and expectedResponse:
- It MUST NOT be healed again
- Skip unless backend response changes

---

### 10.9 Field-Level Error Normalization (RECOMMENDED)

If multiple invalid variants of the same field
(null, empty, missing, wrong type)
produce the same backend error,
the agent SHOULD normalize them to a shared expectedResponse.

---

## 10.10 Field-by-Field Healing Strategy (FOR STUBBORN CASES)

When batch healing (section 10.4) doesn't resolve all failures after one re-run:
- Switch to field-by-field healing mode
- Follow the **Console-First Workflow** below — DO NOT skip any step

### Console-First Workflow (MANDATORY — NON-NEGOTIABLE)

The agent MUST follow this exact sequence. Skipping or reordering steps is STRICTLY FORBIDDEN.

**Step 1: RUN the test suite**
```bash
npx playwright test <test-path> --reporter=line
```

**Step 2: READ the full console/stdout output**
- The agent MUST read the complete stdout output produced by the test command
- This is where all HEAL_DATA blocks and test results are printed
- DO NOT proceed without reading the console output first

**Step 3: PARSE all `---HEAL_DATA_START---` / `---HEAL_DATA_END---` blocks from the console output**
- Extract `key`, `scenario`, `actualStatus`, and `actualResponse` from each block
- Build a list of all failing test cases with their actual data
- **2xx CHECK:** If any HEAL_DATA block has `actualStatus` in the 2xx range (200-299), that test case is a **SERVER BUG** — DO NOT heal it. Mark it with a TODO comment and skip it.
- If no HEAL_DATA blocks are found in the console output, DO NOT fabricate data — re-run the test or report the issue

**Step 4: IDENTIFY which tests still fail (EXCLUDING 2xx)**
- Cross-reference the parsed HEAL_DATA with the test results (pass/fail) from the console
- Only act on tests that are confirmed failing in the console output **AND** have a non-2xx actualStatus
- Any test returning 2xx for a negative case MUST be skipped from healing and flagged as a critical server bug

**Step 5: DERIVE `--grep` pattern from parsed data ONLY**
- Use the `scenario` value extracted in Step 3 as the grep pattern
- Pattern: `npx playwright test <test-path> --grep "<scenario-value-from-console>" --reporter=line`
- Example: `--grep "Field 'username' is missing"`

**Step 6: UPDATE the POJO** for the failing case, then re-run with the same grep to confirm
- **SAFETY CHECK:** NEVER update `expectedStatus` to a 2xx value. If the grep re-run returns 2xx, skip healing for that case and flag as server bug.

**Step 7: REPEAT** Steps 1-6 for the next failing field. Max 3 retries per field.

### Grep Pattern Derivation Rules (MANDATORY)
1. **Primary:** Use the full `scenario` value parsed from HEAL_DATA in the console (e.g., `--grep "Field 'username' is missing"`)
2. **Fallback (if scenario too long or has special chars):** Use the field name extracted from the scenario (e.g., `--grep "username"`)
   - This will match ALL variants for that field (missing, null, empty, wrong type) — this is acceptable for field-level isolation
3. **NEVER** use the POJO key directly as a grep pattern (e.g., `--grep "usernameMissing"` will NOT match any test title)
4. **NEVER** fabricate or guess a grep pattern — it MUST come from data you actually read from the console output
5. **NEVER** assume a field name without first confirming it exists in the HEAL_DATA parsed from stdout

### When to Use Field-by-Field:
- After batch healing completes but some cases still fail
- When error signatures are inconsistent across field variants
- To debug complex nested object/array validation issues

## 11. REQUEST FILE EXAMPLE (POJO Matrix)

import { ApiTestCase } from "../ContractApiTestTypes";

export interface GetOtpRequest {
  username: string;
  countryCode: string;
  organizationId: string;
}

export const contractsPositivePayload = (): GetOtpRequest => ({
  username: '2222222229',
  countryCode: '+91',
  organizationId: '5eb393ee95fab7468a79d189',
});

export const apiTestMatrix: Record<string, ApiTestCase<GetOtpRequest>> = {
  // ============= FIELD MISSING CASES (Use destructuring IIFE pattern) =============
  usernameMissing: {
    scenario: "Field 'username' is missing",
    payload: (() => {
      const { username, ...rest } = contractsPositivePayload();
      return rest;
    })(),
    expectedStatus: 400,
    expectedResponse: { success: false, message: "username is required" }
  },
  countryCodeMissing: {
    scenario: "Field 'countryCode' is missing",
    payload: (() => {
      const { countryCode, ...rest } = contractsPositivePayload();
      return rest;
    })(),
    expectedStatus: 400,
    expectedResponse: { success: false, message: "countryCode is required" }
  },

  // ============= FIELD NULL CASES (Use spread operator pattern) =============
  usernameNull: {
    scenario: "Field 'username' is null",
    payload: { ...contractsPositivePayload(), username: null },
    expectedStatus: 400,
    expectedResponse: { success: false, message: "username cannot be null" }
  },
  countryCodeNull: {
    scenario: "Field 'countryCode' is null",
    payload: { ...contractsPositivePayload(), countryCode: null },
    expectedStatus: 400,
    expectedResponse: { success: false, message: "countryCode cannot be null" }
  },

  // ============= FIELD EMPTY STRING CASES (Use spread operator pattern) =============
  usernameEmpty: {
    scenario: "Field 'username' is empty string",
    payload: { ...contractsPositivePayload(), username: '' },
    expectedStatus: 400,
    expectedResponse: { success: false, message: "username is required" }
  },
  organizationIdEmpty: {
    scenario: "Field 'organizationId' is empty string",
    payload: { ...contractsPositivePayload(), organizationId: '' },
    expectedStatus: 400,
    expectedResponse: { success: false, message: "organizationId is required" }
  },

  // ============= WRONG TYPE CASES (Use spread operator pattern) =============
  usernameWrongType: {
    scenario: "Field 'username' has wrong type (number)",
    payload: { ...contractsPositivePayload(), username: 123 },
    expectedStatus: 400,
    expectedResponse: { success: false, message: "username must be a string" }
  },

  // ============= PAYLOAD-LEVEL EDGE CASES =============
  extraFieldPresent: {
    scenario: "Extra/unexpected field present in payload",
    payload: { ...contractsPositivePayload(), extraField: 'extra' },
    expectedStatus: 400,
    expectedResponse: { success: false }
  }
};

---

## 11.1 HTTP Method-Specific Request Handling

### For GET Requests (Query Parameters)
When the HTTP method is GET, use `pwApiLib.buildQueryParams()` to convert payload objects to query strings:

```typescript
// GET request with query parameters
const queryParams = await pwApiLib.buildQueryParams(data.payload);

const apiCallData = await apiManager.vpService.getListOfScholarshipPrograms(
  clientHeaders,
  queryParams
);
```

The `buildQueryParams()` method:
- Automatically filters out null and undefined values
- Converts object payload to proper query string format (e.g., `?page=1&limit=10&organizationId=xyz`)
- Handles type conversions appropriately

### For POST/PUT/PATCH Requests (Body Payload)
Pass the payload directly as the request body to the API service method:

```typescript
// POST/PUT/PATCH request with body payload
const apiCallData = await apiManager.vpService.createResource(
  data.payload,
  clientHeaders
);
```

The payload object is sent directly in the HTTP request body.

### For DELETE Requests
Pass required identifiers in the URL path or query string:

```typescript
// DELETE request
const apiCallData = await apiManager.vpService.deleteResource(
  resourceId,
  clientHeaders
);
```

---

## 12. TEST EXAMPLE (Key-by-Key Response Validation Pattern)

**IMPORTANT:** Use key-by-key response validation for all contract tests. This prevents JSON serialization key-ordering issues from causing false failures.

For nested objects: Use `stringToContain` with individual JSON.stringify of each field
For primitives/arrays: Use direct `valueToEqual` comparison

### Example 1: GET Request (Query Parameters)

```typescript
import { test } from "../../../src/fixtures/TestFixtures";
import { apiTestMatrix } from "../../../data/pojo/request/queryParams/vpService/erpListOfProgramQPTestMatrix";

test.describe(
  "Contract tests for VPService erpListOfPrograms API",
  { tag: ["@apiContracts"] },
  () => {
    let clientHeaders: Record<string, string> = {};

    test.beforeAll(async ({ pwApiLib }) => {
      clientHeaders = pwApiLib.generateCommonHeaders();
    });

    for (const [key, data] of Object.entries(apiTestMatrix)) {
      test(`${data.scenario}`, async ({
        apiManager,
        customAssert,
        pwApiLib
      }) => {
        // Build query string from payload using pwApiLib
        const queryParams = await pwApiLib.buildQueryParams(data.payload);

        // Make API call
        const apiCallData = await apiManager.vpService.getListOfScholarshipPrograms(
          clientHeaders,
          queryParams
        );

        // Extract status and body
        const status = apiCallData.responseData.status();
        const response = await apiCallData.responseData.json();

        // Mandatory log for agent self-healing
        console.log(`---HEAL_DATA_START---
        {
          "key": "${key}",
          "scenario": "${data.scenario}",
          "actualStatus": ${status},
          "actualResponse": ${JSON.stringify(response)}
        }
        ---HEAL_DATA_END---`);

        // Assert status
        await customAssert.valueToEqual(status, data.expectedStatus);

        // Fail if actual has extra fields not defined in expected
        await customAssert.valueToEqual(
          JSON.stringify(Object.keys(response).sort()),
          JSON.stringify(Object.keys(data.expectedResponse).sort()),
        );

        // Assert response using key-by-key validation
        for (const [responseKey, expectedValue] of Object.entries(data.expectedResponse)) {
          if (typeof expectedValue === 'object' && expectedValue !== null && !Array.isArray(expectedValue)) {
            // For nested objects: validate with stringToContain
            await customAssert.stringToContain(
              JSON.stringify(response[responseKey]),
              JSON.stringify(expectedValue)
            );
          } else {
            // For primitives and arrays: direct equality
            await customAssert.valueToEqual(response[responseKey], expectedValue);
          }
        }
      });
    }
  }
);
```

### Example 2: POST Request (Body Payload)

```typescript
import { test } from "../../../src/fixtures/TestFixtures";
import { apiTestMatrix } from "../../../data/pojo/listCategoriesQp";

test.describe(
  "Contract tests for VPService ListCategories API",
  { tag: ["@apiContracts"] },
  () => {
    let clientToken: string;
    let randomId: string;
    let clientHeaders: Record<string, string> = {};

    test.beforeAll(async ({ pwApiLib }) => {
      randomId = pwApiLib.generateRandomId();
      clientHeaders = pwApiLib.generateCommonHeaders({ randomId: randomId });
      clientToken = (await pwApiLib.authenticateUser(
          process.env.USERNAME!,
          process.env.PASSWORD!,
          clientHeaders
      )).access_token!;
      clientHeaders = pwApiLib.generateAuthHeaders(clientToken, clientHeaders);
    });

    for (const [key, data] of Object.entries(apiTestMatrix)) {
      test(`${data.scenario}`, async ({
        apiManager,
        customAssert,
    }) => {
        // Pass payload directly as body for POST/PUT/PATCH requests
        const apiCallData = await apiManager.vpService.createCategory(
          data.payload,
          clientHeaders
        );

        // Extract status and body
        const status = apiCallData.responseData.status();
        const response = await apiCallData.responseData.json();

        // Mandatory log for agent self-healing
        console.log(`---HEAL_DATA_START---
        {
          "key": "${key}",
          "actualStatus": ${status},
          "actualResponse": ${JSON.stringify(response)}
        }
        ---HEAL_DATA_END---`);

        // Assert status
        await customAssert.valueToEqual(status, data.expectedStatus);

        // Fail if actual has extra fields not defined in expected
        await customAssert.valueToEqual(
        JSON.stringify(Object.keys(response).sort()),
        JSON.stringify(Object.keys(data.expectedResponse).sort()),
        );


        // Assert response using key-by-key validation
        for (const [responseKey, expectedValue] of Object.entries(data.expectedResponse)) {
          if (typeof expectedValue === 'object' && expectedValue !== null && !Array.isArray(expectedValue)) {
            // For nested objects: validate with stringToContain
            await customAssert.stringToContain(
              JSON.stringify(response[responseKey]),
              JSON.stringify(expectedValue)
            );
          } else {
            // For primitives and arrays: direct equality
            await customAssert.valueToEqual(response[responseKey], expectedValue);
          }
        }
      });
    }
  }
);
```

## 13. Authorization Testing Pattern (SEPARATE FROM MATRIX)

Authorization/forbidden access tests MUST NOT be included in the `apiTestMatrix` POJO.

Instead, create a **dedicated standalone test** after the negative payload loop:

### Pattern:

```typescript
// After the negative payload for-loop completes...

test("Invalid authorization header - should return 401", async ({
  apiManager,
  customAssert,
  pwApiLib,
}) => {
  const randomId = pwApiLib.generateRandomId();
  const invalidHeaders = pwApiLib.generateCommonHeaders({ randomId: randomId });
  // No auth token added - simulates missing authorization

  const apiCallData = await apiManager.yourService.yourApiMethod(
    contractsPositivePayload(),
    invalidHeaders
  );

  const status = apiCallData.responseData.status();

  await customAssert.valueToEqual(status, 401);
});
```

### Rules:
- Use **positive payload** to isolate header/auth issue
- Validate **only status code** (401 or 403 as applicable)
- Do NOT validate response body
- Placed **outside and after** the matrix loop
- Keep POJO matrix clean (no auth scenarios)

----

## 14. Agent Execution & Self-Healing Loop (MANDATORY)

1. Execute Playwright contract tests using `--reporter=json`
2. **READ the full console/stdout output** from the test execution
3. **PARSE** ALL `---HEAL_DATA_START---` / `---HEAL_DATA_END---` blocks from the console output
4. Perform GLOBAL 2xx check on the parsed HEAL_DATA
5. Group failures by error signature
6. Heal ALL grouped cases in one update
7. Re-run tests once
8. Repeat until:
   - All tests pass
   - OR any 2xx appears → SKIP UPDATION/HEALING FOR 2xx
9. If batch re-run still has failures for 4xx/5xx:
   - Switch to field-by-field healing mode (Section 10.10)
   - **READ the console output** from the batch re-run
   - **PARSE** all HEAL_DATA blocks from that console output
   - For each still-failing test case found in the parsed console data:
     a. Extract the `scenario` value from its HEAL_DATA block (as read from console)
     b. Use the scenario string (or unique substring) as grep pattern — NEVER guess
     c. Run: `npx playwright test <test-path> --grep "<scenario-from-console>" --reporter=line`
     d. **READ the console output** from this grep run
     e. **PARSE** the HEAL_DATA from this grep run's console output
     f. Update the POJO based on parsed data and re-run with the same grep to confirm
     g. Max 3 retries per field to prevent infinite loops
   - Continue until all fields pass or max retries exhausted

### CRITICAL: Console Reading is NON-NEGOTIABLE
- At EVERY step above, the agent MUST read the actual console/stdout output BEFORE making any healing decisions
- The agent MUST NOT assume, infer, or hallucinate field names, scenario strings, status codes, or response bodies
- ALL healing data MUST come from parsed `---HEAL_DATA_START---` / `---HEAL_DATA_END---` blocks found in the console output
- If console output is truncated or HEAL_DATA blocks are not found, the agent MUST re-run the test to get fresh output

----   

## 15. STDOUT-ONLY DATA EXTRACTION (STRICT – NON-NEGOTIABLE)

The agent MUST extract all healing data ONLY from:
- Playwright stdout
- JSON reporter output printed to stdout
- Explicit `---HEAL_DATA_START---` and `---HEAL_DATA_END---` blocks

### ABSOLUTE PROHIBITIONS
The agent MUST NOT:
- Create or write `.txt`, `.json`, `.py`, `.log`, or any helper files
- Generate external scripts to parse responses
- Persist intermediate data outside in-memory context
- Ask the user to manually upload result files

### ALLOWED COMMAND PATTERN (ONLY)
```bash
npx playwright test <test-path> --reporter=json
```

### Use this pattern for healing by field by field for 4xx/5xx. Refer the example commands
```bash
# Example: grep by exact scenario substring from HEAL_DATA
npx playwright test tests/api/contracts/vpService/upsertScholarshipPhase.spec.ts --grep "Field 'username' is missing" --reporter=line

# Example: grep by field name to run ALL variants of that field
npx playwright test tests/api/contracts/vpService/upsertScholarshipPhase.spec.ts --grep "username" --reporter=line
```