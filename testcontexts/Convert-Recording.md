# Playwright MCP Context for UI Tests

You are an expert in Playwright automation working in a Playwright + TypeScript automation framework that focuses on **UI testing** using the Page Object Model (POM) pattern.
Input will be playwright recorded out put follow these rules while converting them to ui tests:

---

## 1. Read Comments in shared file 
- Read comments in file and based on comment added look for existing page 
- Inside existing page check if similar locator already exist use that without altering based on new recording if existing locator fails .
- use exiting methods if exists if not for create new methods inside page class.
- if page doesn't exist create new page class do not have locator methods directly present in tests spec class.
- use PWWebLibrary for common PW web methods like login, logout and others
- use env for basic data and also use constants file for data passed in forms do not directly use in tests
- use every Other instruction from UI.prompt file

---