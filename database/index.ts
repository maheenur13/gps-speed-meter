/**
 * Database initialization and access
 */

import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { DATABASE_NAME } from '@/constants/config';
import { migrateDatabase } from './migrations';

let database: SQLiteDatabase | null = null;

/**
 * Get the database instance, initializing if needed
 */
export function getDatabase(): SQLiteDatabase {
  if (!database) {
    database = openDatabaseSync(DATABASE_NAME);
  }
  return database;
}

/**
 * Initialize the database with migrations
 */
export async function initDatabase(): Promise<SQLiteDatabase> {
  const db = getDatabase();
  await migrateDatabase(db);
  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (database) {
    database.closeSync();
    database = null;
  }
}

// Re-export queries for convenience
export * from './queries';
export * from './schema';
export * from './migrations';
