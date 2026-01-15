/**
 * Database CRUD operations for trips and location points
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import type { Trip, LocationPoint, TripStatus, TripWithDuration } from '@/types';

// ============ TRIP QUERIES ============

/**
 * Create a new trip and return its ID
 */
export async function createTrip(db: SQLiteDatabase): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO trips (start_time, status) VALUES (?, ?)',
    [Date.now(), 'active']
  );
  return result.lastInsertRowId;
}

/**
 * Get a trip by ID
 */
export async function getTripById(
  db: SQLiteDatabase,
  tripId: number
): Promise<Trip | null> {
  const row = await db.getFirstAsync<{
    id: number;
    start_time: number;
    end_time: number | null;
    total_distance: number;
    max_speed: number;
    avg_speed: number;
    status: TripStatus;
  }>('SELECT * FROM trips WHERE id = ?', [tripId]);

  if (!row) return null;

  return {
    id: row.id,
    startTime: row.start_time,
    endTime: row.end_time,
    totalDistance: row.total_distance,
    maxSpeed: row.max_speed,
    avgSpeed: row.avg_speed,
    status: row.status,
  };
}

/**
 * Get all completed trips, ordered by start time descending
 */
export async function getAllTrips(db: SQLiteDatabase): Promise<TripWithDuration[]> {
  const rows = await db.getAllAsync<{
    id: number;
    start_time: number;
    end_time: number | null;
    total_distance: number;
    max_speed: number;
    avg_speed: number;
    status: TripStatus;
  }>('SELECT * FROM trips ORDER BY start_time DESC');

  return rows.map((row) => ({
    id: row.id,
    startTime: row.start_time,
    endTime: row.end_time,
    totalDistance: row.total_distance,
    maxSpeed: row.max_speed,
    avgSpeed: row.avg_speed,
    status: row.status,
    duration: row.end_time 
      ? Math.floor((row.end_time - row.start_time) / 1000) 
      : 0,
  }));
}

/**
 * Get the currently active trip
 */
export async function getActiveTrip(db: SQLiteDatabase): Promise<Trip | null> {
  const row = await db.getFirstAsync<{
    id: number;
    start_time: number;
    end_time: number | null;
    total_distance: number;
    max_speed: number;
    avg_speed: number;
    status: TripStatus;
  }>("SELECT * FROM trips WHERE status = 'active' LIMIT 1");

  if (!row) return null;

  return {
    id: row.id,
    startTime: row.start_time,
    endTime: row.end_time,
    totalDistance: row.total_distance,
    maxSpeed: row.max_speed,
    avgSpeed: row.avg_speed,
    status: row.status,
  };
}

/**
 * Update trip statistics
 */
export async function updateTripStats(
  db: SQLiteDatabase,
  tripId: number,
  stats: {
    totalDistance?: number;
    maxSpeed?: number;
    avgSpeed?: number;
  }
): Promise<void> {
  const updates: string[] = [];
  const values: (number | string)[] = [];

  if (stats.totalDistance !== undefined) {
    updates.push('total_distance = ?');
    values.push(stats.totalDistance);
  }
  if (stats.maxSpeed !== undefined) {
    updates.push('max_speed = ?');
    values.push(stats.maxSpeed);
  }
  if (stats.avgSpeed !== undefined) {
    updates.push('avg_speed = ?');
    values.push(stats.avgSpeed);
  }

  if (updates.length > 0) {
    values.push(tripId);
    await db.runAsync(
      `UPDATE trips SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }
}

/**
 * Update trip status
 */
export async function updateTripStatus(
  db: SQLiteDatabase,
  tripId: number,
  status: TripStatus
): Promise<void> {
  const endTime = status === 'completed' ? Date.now() : null;
  await db.runAsync(
    'UPDATE trips SET status = ?, end_time = COALESCE(?, end_time) WHERE id = ?',
    [status, endTime, tripId]
  );
}

/**
 * Complete a trip
 */
export async function completeTrip(
  db: SQLiteDatabase,
  tripId: number
): Promise<void> {
  await db.runAsync(
    'UPDATE trips SET status = ?, end_time = ? WHERE id = ?',
    ['completed', Date.now(), tripId]
  );
}

/**
 * Delete a trip and its location points
 */
export async function deleteTrip(
  db: SQLiteDatabase,
  tripId: number
): Promise<void> {
  // Foreign key cascade will delete location points
  await db.runAsync('DELETE FROM trips WHERE id = ?', [tripId]);
}

// ============ LOCATION POINT QUERIES ============

/**
 * Add a location point to a trip
 */
export async function addLocationPoint(
  db: SQLiteDatabase,
  point: Omit<LocationPoint, 'id'>
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO location_points 
     (trip_id, latitude, longitude, speed, altitude, accuracy, timestamp) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      point.tripId,
      point.latitude,
      point.longitude,
      point.speed,
      point.altitude,
      point.accuracy,
      point.timestamp,
    ]
  );
  return result.lastInsertRowId;
}

/**
 * Get all location points for a trip
 */
export async function getLocationPointsForTrip(
  db: SQLiteDatabase,
  tripId: number
): Promise<LocationPoint[]> {
  const rows = await db.getAllAsync<{
    id: number;
    trip_id: number;
    latitude: number;
    longitude: number;
    speed: number | null;
    altitude: number | null;
    accuracy: number | null;
    timestamp: number;
  }>(
    'SELECT * FROM location_points WHERE trip_id = ? ORDER BY timestamp ASC',
    [tripId]
  );

  return rows.map((row) => ({
    id: row.id,
    tripId: row.trip_id,
    latitude: row.latitude,
    longitude: row.longitude,
    speed: row.speed,
    altitude: row.altitude,
    accuracy: row.accuracy,
    timestamp: row.timestamp,
  }));
}

/**
 * Get the last location point for a trip
 */
export async function getLastLocationPoint(
  db: SQLiteDatabase,
  tripId: number
): Promise<LocationPoint | null> {
  const row = await db.getFirstAsync<{
    id: number;
    trip_id: number;
    latitude: number;
    longitude: number;
    speed: number | null;
    altitude: number | null;
    accuracy: number | null;
    timestamp: number;
  }>(
    'SELECT * FROM location_points WHERE trip_id = ? ORDER BY timestamp DESC LIMIT 1',
    [tripId]
  );

  if (!row) return null;

  return {
    id: row.id,
    tripId: row.trip_id,
    latitude: row.latitude,
    longitude: row.longitude,
    speed: row.speed,
    altitude: row.altitude,
    accuracy: row.accuracy,
    timestamp: row.timestamp,
  };
}

/**
 * Get location point count for a trip
 */
export async function getLocationPointCount(
  db: SQLiteDatabase,
  tripId: number
): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM location_points WHERE trip_id = ?',
    [tripId]
  );
  return result?.count ?? 0;
}

/**
 * Delete all location points for a trip
 */
export async function deleteLocationPointsForTrip(
  db: SQLiteDatabase,
  tripId: number
): Promise<void> {
  await db.runAsync('DELETE FROM location_points WHERE trip_id = ?', [tripId]);
}
