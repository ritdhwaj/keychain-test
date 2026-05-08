/**
 * Test Data Loader Utility
 * Loads test data from JSON files based on ENV environment variable
 * Can accept either a JSON filename or a complete JSON object from test
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Get current environment from process.env.ENV
 * @returns 'staging' or 'production'
 */
function getEnvironment(): string {
  const env = process.env.ENV || 'staging';
  return env;
}

/**
 * Load test data from JSON file or use provided JSON object
 * @param filePathOrObject - Either complete file path (string) or complete JSON object
 * @returns Test data object for the current environment
 * @throws Error if file path is not provided or file doesn't exist
 */
export function loadTestData(filePathOrObject: string | any): any {
  try {
    const env = getEnvironment();
    let allData: any;

    // If object is provided directly, use it
    if (typeof filePathOrObject === 'object') {
      allData = filePathOrObject;
    } 
    // If string is provided, load from file path
    else if (typeof filePathOrObject === 'string') {
      if (!fs.existsSync(filePathOrObject)) {
        throw new Error(`Test data file not found at path: ${filePathOrObject}`);
      }

      const rawData = fs.readFileSync(filePathOrObject, 'utf-8');
      allData = JSON.parse(rawData);
    }
    else {
      throw new Error(`Test data file path must be provided. Expected string or object, got: ${typeof filePathOrObject}`);
    }

    if (!allData[env]) {
      throw new Error(`Environment "${env}" not found in provided test data`);
    }

    return allData[env];
  } catch (error) {
    console.error('❌ Failed to load test data:', error);
    throw error;
  }
}

/**
 * Get value from nested object using dot notation
 * @param pathStr - Dot-separated path (e.g., "batch.defaultBatchName", "exam.classLevels.0")
 * @param filePathOrObject - File path (string) or JSON object
 * @returns Value at the specified path
 */
export function getValue(
  pathStr: string,
  filePathOrObject: string | any
): any {
  try {
    const testData = loadTestData(filePathOrObject);
    return pathStr.split('.').reduce((current, key) => {
      if (current === null || current === undefined) {
        return undefined;
      }
      return current[key];
    }, testData);
  } catch (error) {
    console.warn(`⚠️  Could not retrieve value at path "${pathStr}":`, error);
    return undefined;
  }
}

/**
 * Maps a specific environment block from a JSON file to a TypeScript POJO
 * @param filePath - Path to the .json file
 * @returns The parsed data for the current ENV, typed as T
 */
export function mapJsonFile<T>(input: string|any): T {
const env = process.env.ENV || 'staging';
  let allData: any;

  try {
    // 1. If input is a string, it's a file path -> Read it
    if (typeof input === 'string') {
      const rawData = fs.readFileSync(input, 'utf-8');
      allData = JSON.parse(rawData);
    } 
    // 2. If input is already an object (from your import), use it directly
    else if (typeof input === 'object' && input !== null) {
      allData = input;
    } else {
      throw new Error("Input must be a file path string or a JSON object");
    }

    // 3. Extract the environment-specific block (staging/production)
    if (!allData[env]) {
      throw new Error(`Environment "${env}" not found in the data provided.`);
    }

    // 4. Return as the POJO type <T>
    return allData[env] as T;

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to map JSON: ${msg}`);
  }
}



/**
 * 
 * @param value - To pass the value 
 * @returns - To return the value
 */
export function required<T>(value: T | undefined): T {
  if (value === undefined) {
    value="" as unknown as T; // Assigning empty string to value if it's undefined
  }
  return value;
}
