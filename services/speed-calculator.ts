/**
 * Speed and distance calculation utilities
 */

import { CONVERSION } from "@/constants/config";
import type { LocationPoint } from "@/types";

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in meters
 */
export function haversineDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const R = 6371000; // Earth's radius in meters
  const lat1Rad = toRadians(point1.latitude);
  const lat2Rad = toRadians(point2.latitude);
  const deltaLat = toRadians(point2.latitude - point1.latitude);
  const deltaLon = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Minimum speed threshold to filter GPS noise (km/h)
// Speeds below this are considered stationary
const GPS_NOISE_THRESHOLD_KMH = 1.0;

/**
 * Calculate speed from GPS data or fallback to distance/time
 * Filters out GPS noise for stationary detection
 * @returns Speed in km/h
 */
export function calculateSpeed(
  currentLocation: LocationPoint,
  prevLocation: LocationPoint | null
): number {
  let speed = 0;

  // Prefer GPS-provided speed (more accurate)
  if (currentLocation.speed !== null && currentLocation.speed >= 0) {
    speed = currentLocation.speed * CONVERSION.MS_TO_KMH;
  } else if (prevLocation) {
    // Fallback: calculate from distance/time
    const distance = haversineDistance(prevLocation, currentLocation);
    const timeDiff =
      (currentLocation.timestamp - prevLocation.timestamp) / 1000; // seconds

    if (timeDiff > 0) {
      const speedMs = distance / timeDiff;
      speed = speedMs * CONVERSION.MS_TO_KMH;
    }
  }

  // Filter out GPS noise - speeds below threshold are considered stationary
  if (speed < GPS_NOISE_THRESHOLD_KMH) {
    return 0;
  }

  return speed;
}

/**
 * Convert km/h to mph
 */
export function kmhToMph(kmh: number): number {
  return kmh * CONVERSION.KMH_TO_MPH;
}

/**
 * Convert mph to km/h
 */
export function mphToKmh(mph: number): number {
  return mph * CONVERSION.MPH_TO_KMH;
}

/**
 * Convert meters to kilometers
 */
export function metersToKm(meters: number): number {
  return meters * CONVERSION.METERS_TO_KM;
}

/**
 * Convert meters to miles
 */
export function metersToMiles(meters: number): number {
  return meters * CONVERSION.METERS_TO_MILES;
}

/**
 * Calculate average speed from distance and duration
 * @param distance Distance in meters
 * @param duration Duration in seconds
 * @returns Average speed in km/h
 */
export function calculateAverageSpeed(
  distance: number,
  duration: number
): number {
  if (duration <= 0) return 0;
  const hours = duration / 3600;
  const km = distance / 1000;
  return km / hours;
}

/**
 * Calculate total distance from location points
 * @returns Total distance in meters
 */
export function calculateTotalDistance(points: LocationPoint[]): number {
  if (points.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += haversineDistance(points[i - 1], points[i]);
  }

  return totalDistance;
}

/**
 * Calculate max speed from location points
 * @returns Max speed in km/h
 */
export function calculateMaxSpeed(points: LocationPoint[]): number {
  if (points.length === 0) return 0;

  let maxSpeed = 0;
  for (let i = 0; i < points.length; i++) {
    const speed = calculateSpeed(points[i], i > 0 ? points[i - 1] : null);
    if (speed > maxSpeed) {
      maxSpeed = speed;
    }
  }

  return maxSpeed;
}

/**
 * Format speed for display
 */
export function formatSpeed(
  speed: number,
  unit: "kmh" | "mph",
  decimals = 0
): string {
  const displaySpeed = unit === "mph" ? kmhToMph(speed) : speed;
  return displaySpeed.toFixed(decimals);
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number, unit: "kmh" | "mph"): string {
  if (unit === "mph") {
    const miles = metersToMiles(meters);
    return miles < 1
      ? `${(miles * 5280).toFixed(0)} ft`
      : `${miles.toFixed(2)} mi`;
  }

  const km = metersToKm(meters);
  return km < 1 ? `${meters.toFixed(0)} m` : `${km.toFixed(2)} km`;
}

/**
 * Format duration in HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
