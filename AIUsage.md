# AI-Powered Test Generation Guide

This project leverages **Test Contexts** to enable AI agents (like Antigravity or other MCP-enabled agents) to generate high-quality, consistent, and maintainable automation code.

## 🧠 What are Test Contexts?

Test Contexts are specialized Markdown files located in the `testcontexts/` directory. They contain:
- **Architecture Rules**: Standards for Page Object Models (POM), fixtures, and directory structure.
- **Coding Standards**: Rules for locators, assertions, and TypeScript patterns.
- **Domain Knowledge**: Project-specific information about the Conduit app, authentication flows, and API structures.
- **Reference Examples**: Gold-standard snippets that the AI should emulate.

## 🛠️ How to Use with AI Agents

When interacting with an AI coding assistant, follow these steps to ensure the best results:

### 1. Attach the Relevant Context
Before asking for a new test or refactor, provide the agent with the appropriate context file.
- **For UI Tests**: Use `testcontexts/UITestsGenerator.md` and `testcontexts/PageObjectModel.md`.
- **For API Tests**: Use `testcontexts/api.md`.
- **For Debugging**: Use `testcontexts/Debugging.md`.

### 2. Formulate Your Prompt
Use a prompt that references the context. **Example:**
> "Using the patterns in @UITestsGenerator.md and @PageObjectModel.md, create a new UI test for the User Settings page. It should verify that the user can update their profile picture URL and that the change persists after a reload."

### 3. Agent Execution
The agent will:
1. Read the provided markdown context.
2. Analyze existing POMs and fixtures.
3. Generate code that matches the project's exact style, using semantic locators and standard error handling.

## 📂 Key Context Files

| File | Use Case |
|------|----------|
| `UITestsGenerator.md` | Creating new Playwright UI test specs. |
| `PageObjectModel.md` | Building or updating Page Object classes in `src/pages/`. |
| `api.md` | Generating API tests, schema validations, and endpoint interactions. |
| `TestData.md` | Managing dynamic data generation and environment variables. |
| `Debugging.md` | Troubleshooting failed tests or flaky locators. |
| `Convert-Recording.md`| Converting manual browser recordings into structured POM actions. |

## 🚀 Best Practices

- **Mention Specific Files**: Don't just say "make a test." Say "make a test using @TestFixtures.ts and following @UITestsGenerator.md."
- **Stay Context-Aware**: If the agent suggests a pattern that contradicts the context, remind it: "Refer to the locator rules in @UITestsGenerator.md section 2."
- **Iterative Improvement**: If you find a new pattern that works well, update the relevant context file so the AI "learns" it for future tasks.
