# Playwright MCP Context for API Tests

You are an expert in playwright automation and working in a Playwright + TypeScript automation framework that includes **API testing**.  
Follow these rules while generating or updating API tests:

---

## 1. Test Structure
- All API tests should be located under `tests/api/`.
- If an API test file for the given endpoint already exists, add only the new cases inside the existing file instead of rewriting from scratch.
- If no test file exists, create a new one following the existing naming convention.

---

## 2. Test Coverage
For every provided API request (e.g., a `curl` command):
- Write **positive test cases** (happy path, expected responses).
- Write **negative test cases** (invalid payloads, missing fields, incorrect headers, unauthorized access, etc.).
- check request body and based on type of data add cases for null and other possible combinations
- Cover all relevant **status codes** (200, 201, 400, 401, 403, 404, 500 as applicable).
- Add security related test cases
- Validate **response schema** against stored JSON schema files.

---

## 3. Request Handling
- Do not hardcode request payloads in the test.
- Create a **POJO (Plain Old JavaScript/TypeScript Object)** under `data/pojo/` for each request type.
- Pass data from the POJO into the test so that input can be easily updated or reused.
- Support multiple variations (valid & invalid) via different POJO instances.
- For any api with `/admin` in endpoint use adminToken from `PWApiLibrary.ts` for others use client token for authorization header
- Use `PWApiLibrary` from `src/api` class for commonly used methods (Authentications,headers)

---

## 4. Response Handling
- Validate responses against both:
  1. **Expected values** (status codes, response fields).
  2. **Schema validation** (using `ajv` or a similar validator).
- Store all schemas under `data/schema/` with clear naming (e.g., `getUser.schema.json`, `createOrder.schema.json`).
- Always reference the schema dynamically instead of embedding inline.

---

## 5. Environment Configuration
- API base URLs, authentication tokens, and environment details must come from `.env` files (`.env.staging`, `.env.production`, etc.).
- Always access env variables via `process.env`.
- Default to `.env.staging` if values are missing.

---

## 6. Utilities
- Use `ApiClient.ts` helper under `src/api/` to wrap Playwright's `request` context:
  - Methods: `get`, `post`, `put`, `delete`, etc.
  - Each method should automatically apply base URL and headers (e.g., `Authorization`).
  - use `fixtures/TestFixtures` for using ApiClient
  - Tests must use `fixtures/TestFixtures` instead of calling Playwright's raw request methods.

---

## 7. Assertions
- Use CustomAssert assertions from `utils/CustomAssertions.ts` all assertions if any assertion doesnt exist create and use from there, do not directly use expect.
- Assert:
  - Correct **status codes**.
  - **Response body values** (mandatory fields).
  - **Schema compliance** via JSON schema validation.
- For negative tests, assert correct error codes and messages.

---

## 8. Output Requirements
- Always generate **complete, runnable TypeScript code** with imports.
- Use proper TypeScript typing for request and response objects.
- Respect existing project structure and naming conventions.
- Do not duplicate existing code — only add new test cases, methods, or schemas when necessary.

---

# Example Workflow
1. Receive a `curl` command for an API.
2. Parse into a POJO request object (`data/pojo/SomeRequest.ts`).
3. If schema not present, generate and save under `data/schema/SomeResponse.schema.json`.
4. Add/update tests in `tests/api/SomeEndpoint.spec.ts`:
   - Positive test(s).
   - Negative test(s).
   - Schema validation.
5. Use `ApiClient.ts` wrapper for all API calls.
6. Run and iterate till it pass.