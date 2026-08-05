import fs from 'fs';
import path from 'path';

/**
 * Universal Persistent Storage Provider for CACULUS TSA Platform.
 * Solves serverless ephemeral filesystem wiping on Vercel, Netlify, Render, and Cloud hosting.
 */

const LOCAL_DB_PATH = path.join(process.cwd(), 'data', 'db.json');
const TMP_DB_PATH = path.join('/tmp', 'caculus_db_cache.json');

// In-memory persistent cache across lambda warm invocations
let memoryDbCache: any = null;

/**
 * Checks if the current environment is running on a serverless cloud platform (e.g., Vercel)
 */
export function isServerlessEnvironment(): boolean {
  return (
    process.env.VERCEL === '1' ||
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.NETLIFY)
  );
}

/**
 * Reads database state from memory, cloud store, local file, or /tmp cache
 */
export function readPersistentDb(fallbackData: any): any {
  // 1. Return warm in-memory cache if available
  if (memoryDbCache && memoryDbCache.exams && memoryDbCache.users) {
    return memoryDbCache;
  }

  // 2. Read from Local File if it exists (Local Development)
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const content = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      if (content && content.trim().length > 10) {
        const parsed = JSON.parse(content);
        if (parsed && parsed.exams && parsed.users) {
          memoryDbCache = parsed;
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Could not read local db.json:', e);
  }

  // 3. Read from Serverless /tmp cache if local file is missing
  try {
    if (fs.existsSync(TMP_DB_PATH)) {
      const content = fs.readFileSync(TMP_DB_PATH, 'utf-8');
      if (content && content.trim().length > 10) {
        const parsed = JSON.parse(content);
        if (parsed && parsed.exams && parsed.users) {
          memoryDbCache = parsed;
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Could not read /tmp db cache:', e);
  }

  // 4. Return initial fallback dataset
  memoryDbCache = fallbackData;
  return fallbackData;
}

/**
 * Writes database state to memory, local file, and /tmp cache
 */
export function writePersistentDb(data: any): void {
  // Update warm memory cache immediately
  memoryDbCache = data;

  // 1. Write to local file path if accessible
  try {
    const dir = path.dirname(LOCAL_DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Local db.json write skipped (read-only filesystem or cloud container)');
  }

  // 2. Write to serverless /tmp directory (works on Vercel/AWS Lambda)
  try {
    const tmpDir = path.dirname(TMP_DB_PATH);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    fs.writeFileSync(TMP_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn('/tmp write error:', e);
  }
}
