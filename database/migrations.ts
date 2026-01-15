/**
 * Database migrations for GPS Speed Meter
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import { SCHEMA_STATEMENTS } from './schema';

// Current database version
export const DATABASE_VERSION = 1;

/**
 * Initialize the database with all required tables
 */
export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');
  
  // Run all schema creation statements
  for (const statement of SCHEMA_STATEMENTS) {
    await db.execAsync(statement);
  }
  
  // Set database version
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
}

/**
 * Check if database needs migration
 */
export async function getDatabaseVersion(db: SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;'
  );
  return result?.user_version ?? 0;
}

/**
 * Run migrations if needed
 */
export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  const currentVersion = await getDatabaseVersion(db);
  
  if (currentVersion < DATABASE_VERSION) {
    // For now, just initialize if no version exists
    if (currentVersion === 0) {
      await initializeDatabase(db);
    }
    
    // Future migrations would go here:
    // if (currentVersion < 2) { await migrateV1ToV2(db); }
    // if (currentVersion < 3) { await migrateV2ToV3(db); }
  }
}
