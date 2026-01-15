/**
 * Export utilities for trip data
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { initDatabase, getAllTrips, getLocationPointsForTrip } from '@/database';
import type { TripWithDuration, LocationPoint } from '@/types';
import { formatDuration, metersToKm } from '@/services/speed-calculator';

/**
 * Export all trips as CSV
 */
export async function exportTripsAsCSV(): Promise<void> {
  const db = await initDatabase();
  const trips = await getAllTrips(db);

  if (trips.length === 0) {
    throw new Error('No trips to export');
  }

  // CSV header
  const header = [
    'Trip ID',
    'Start Time',
    'End Time',
    'Duration',
    'Distance (km)',
    'Avg Speed (km/h)',
    'Max Speed (km/h)',
    'Status',
  ].join(',');

  // CSV rows
  const rows = trips.map((trip) => [
    trip.id,
    new Date(trip.startTime).toISOString(),
    trip.endTime ? new Date(trip.endTime).toISOString() : '',
    formatDuration(trip.duration),
    metersToKm(trip.totalDistance).toFixed(2),
    trip.avgSpeed.toFixed(1),
    trip.maxSpeed.toFixed(1),
    trip.status,
  ].join(','));

  const csv = [header, ...rows].join('\n');

  // Save and share
  await saveAndShare(csv, 'trips.csv', 'text/csv');
}

/**
 * Export all trips as JSON
 */
export async function exportTripsAsJSON(): Promise<void> {
  const db = await initDatabase();
  const trips = await getAllTrips(db);

  if (trips.length === 0) {
    throw new Error('No trips to export');
  }

  // Get location points for each trip
  const tripsWithPoints = await Promise.all(
    trips.map(async (trip) => {
      const points = await getLocationPointsForTrip(db, trip.id);
      return {
        ...trip,
        startTimeISO: new Date(trip.startTime).toISOString(),
        endTimeISO: trip.endTime ? new Date(trip.endTime).toISOString() : null,
        distanceKm: metersToKm(trip.totalDistance),
        durationFormatted: formatDuration(trip.duration),
        locationPoints: points.map((p) => ({
          latitude: p.latitude,
          longitude: p.longitude,
          speed: p.speed,
          altitude: p.altitude,
          accuracy: p.accuracy,
          timestamp: p.timestamp,
          timestampISO: new Date(p.timestamp).toISOString(),
        })),
      };
    })
  );

  const json = JSON.stringify(
    {
      exportDate: new Date().toISOString(),
      appVersion: '1.0.0',
      totalTrips: trips.length,
      trips: tripsWithPoints,
    },
    null,
    2
  );

  // Save and share
  await saveAndShare(json, 'trips.json', 'application/json');
}

/**
 * Export a single trip as JSON
 */
export async function exportTripAsJSON(tripId: number): Promise<void> {
  const db = await initDatabase();
  const trips = await getAllTrips(db);
  const trip = trips.find((t) => t.id === tripId);

  if (!trip) {
    throw new Error('Trip not found');
  }

  const points = await getLocationPointsForTrip(db, tripId);

  const tripData = {
    exportDate: new Date().toISOString(),
    trip: {
      ...trip,
      startTimeISO: new Date(trip.startTime).toISOString(),
      endTimeISO: trip.endTime ? new Date(trip.endTime).toISOString() : null,
      distanceKm: metersToKm(trip.totalDistance),
      durationFormatted: formatDuration(trip.duration),
      locationPoints: points.map((p) => ({
        latitude: p.latitude,
        longitude: p.longitude,
        speed: p.speed,
        altitude: p.altitude,
        accuracy: p.accuracy,
        timestamp: p.timestamp,
        timestampISO: new Date(p.timestamp).toISOString(),
      })),
    },
  };

  const json = JSON.stringify(tripData, null, 2);
  const filename = `trip_${tripId}_${new Date().toISOString().split('T')[0]}.json`;
  
  await saveAndShare(json, filename, 'application/json');
}

/**
 * Export a single trip as GPX (GPS Exchange Format)
 */
export async function exportTripAsGPX(tripId: number): Promise<void> {
  const db = await initDatabase();
  const trips = await getAllTrips(db);
  const trip = trips.find((t) => t.id === tripId);

  if (!trip) {
    throw new Error('Trip not found');
  }

  const points = await getLocationPointsForTrip(db, tripId);

  const trackPoints = points
    .map((p) => {
      const time = new Date(p.timestamp).toISOString();
      const ele = p.altitude !== null ? `<ele>${p.altitude}</ele>` : '';
      return `      <trkpt lat="${p.latitude}" lon="${p.longitude}">
        ${ele}
        <time>${time}</time>
      </trkpt>`;
    })
    .join('\n');

  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GPS Speed Meter"
  xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Trip ${tripId}</name>
    <time>${new Date(trip.startTime).toISOString()}</time>
  </metadata>
  <trk>
    <name>Trip ${tripId}</name>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;

  const filename = `trip_${tripId}_${new Date().toISOString().split('T')[0]}.gpx`;
  
  await saveAndShare(gpx, filename, 'application/gpx+xml');
}

/**
 * Save content to file and open share dialog
 */
async function saveAndShare(
  content: string,
  filename: string,
  mimeType: string
): Promise<void> {
  const filePath = `${FileSystem.cacheDirectory}${filename}`;

  // Write file
  await FileSystem.writeAsStringAsync(filePath, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // Check if sharing is available
  const isAvailable = await Sharing.isAvailableAsync();
  
  if (isAvailable) {
    await Sharing.shareAsync(filePath, {
      mimeType,
      dialogTitle: `Export ${filename}`,
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
}
