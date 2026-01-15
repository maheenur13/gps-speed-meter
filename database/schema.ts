/**
 * SQLite database schema definitions
 */

// SQL statements for creating tables
export const CREATE_TRIPS_TABLE = `
  CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    total_distance REAL DEFAULT 0,
    max_speed REAL DEFAULT 0,
    avg_speed REAL DEFAULT 0,
    status TEXT DEFAULT 'active'
  );
`;

export const CREATE_LOCATION_POINTS_TABLE = `
  CREATE TABLE IF NOT EXISTS location_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    speed REAL,
    altitude REAL,
    accuracy REAL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
  );
`;

// Create index for faster trip queries
export const CREATE_TRIP_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_location_points_trip_id 
  ON location_points(trip_id);
`;

// Create index for timestamp ordering
export const CREATE_TIMESTAMP_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_location_points_timestamp 
  ON location_points(timestamp);
`;

// All schema statements in order
export const SCHEMA_STATEMENTS = [
  CREATE_TRIPS_TABLE,
  CREATE_LOCATION_POINTS_TABLE,
  CREATE_TRIP_INDEX,
  CREATE_TIMESTAMP_INDEX,
];
