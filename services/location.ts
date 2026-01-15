/**
 * Location service for GPS tracking
 */

import * as Location from 'expo-location';
import { GPS_CONFIG } from '@/constants/config';
import type { PermissionStatus } from '@/types';
import {
  startBackgroundLocationUpdates,
  stopBackgroundLocationUpdates,
  setBackgroundLocationCallback,
} from './background-task';

// Location subscription handle
let foregroundSubscription: Location.LocationSubscription | null = null;

/**
 * Request foreground location permission
 */
export async function requestForegroundPermission(): Promise<PermissionStatus> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return mapPermissionStatus(status);
}

/**
 * Request background location permission
 */
export async function requestBackgroundPermission(): Promise<PermissionStatus> {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  return mapPermissionStatus(status);
}

/**
 * Check current permission status
 */
export async function checkPermissionStatus(): Promise<{
  foreground: PermissionStatus;
  background: PermissionStatus;
}> {
  const foreground = await Location.getForegroundPermissionsAsync();
  const background = await Location.getBackgroundPermissionsAsync();

  return {
    foreground: mapPermissionStatus(foreground.status),
    background: mapPermissionStatus(background.status),
  };
}

/**
 * Map Expo permission status to our PermissionStatus type
 */
function mapPermissionStatus(
  status: Location.PermissionStatus
): PermissionStatus {
  switch (status) {
    case Location.PermissionStatus.GRANTED:
      return 'granted';
    case Location.PermissionStatus.DENIED:
      return 'denied';
    case Location.PermissionStatus.UNDETERMINED:
      return 'undetermined';
    default:
      return 'undetermined';
  }
}

/**
 * Check if location services are enabled
 */
export async function isLocationServicesEnabled(): Promise<boolean> {
  return await Location.hasServicesEnabledAsync();
}

/**
 * Get current location once
 */
export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: GPS_CONFIG.accuracy,
    });
    return location;
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}

/**
 * Start foreground location tracking
 */
export async function startForegroundTracking(
  callback: (location: Location.LocationObject) => void
): Promise<boolean> {
  try {
    // Stop any existing subscription
    await stopForegroundTracking();

    console.log('Starting foreground location tracking with config:', GPS_CONFIG);

    foregroundSubscription = await Location.watchPositionAsync(
      {
        accuracy: GPS_CONFIG.accuracy,
        distanceInterval: GPS_CONFIG.distanceInterval,
        timeInterval: GPS_CONFIG.timeInterval,
      },
      (location) => {
        console.log('Foreground location received:', {
          lat: location.coords.latitude.toFixed(6),
          lng: location.coords.longitude.toFixed(6),
          speed: location.coords.speed?.toFixed(2),
          accuracy: location.coords.accuracy?.toFixed(0),
        });
        callback(location);
      }
    );

    console.log('Foreground tracking started successfully');
    return true;
  } catch (error) {
    console.error('Error starting foreground tracking:', error);
    return false;
  }
}

/**
 * Stop foreground location tracking
 */
export async function stopForegroundTracking(): Promise<void> {
  if (foregroundSubscription) {
    foregroundSubscription.remove();
    foregroundSubscription = null;
    console.log('Foreground tracking stopped');
  }
}

/**
 * Start background location tracking
 */
export async function startBackgroundTracking(
  callback: (locations: Location.LocationObject[]) => void
): Promise<boolean> {
  try {
    setBackgroundLocationCallback(callback);
    await startBackgroundLocationUpdates();
    console.log('Background tracking started');
    return true;
  } catch (error) {
    // Background tracking may fail in Expo Go - this is expected
    console.warn('Background tracking not available:', error);
    return false;
  }
}

/**
 * Stop background location tracking
 */
export async function stopBackgroundTracking(): Promise<void> {
  try {
    setBackgroundLocationCallback(null);
    await stopBackgroundLocationUpdates();
  } catch (error) {
    console.warn('Error stopping background tracking:', error);
  }
}

/**
 * Start full location tracking (foreground + background)
 * Returns true if at least foreground tracking started
 */
export async function startFullTracking(
  onLocation: (location: Location.LocationObject) => void
): Promise<boolean> {
  // Start foreground tracking (required)
  const foregroundStarted = await startForegroundTracking(onLocation);
  
  if (!foregroundStarted) {
    console.error('Failed to start foreground tracking');
    return false;
  }

  // Try to start background tracking (optional - may fail in Expo Go)
  try {
    await startBackgroundTracking((locations) => {
      console.log('Background locations received:', locations.length);
      locations.forEach(onLocation);
    });
  } catch (error) {
    console.warn('Background tracking unavailable, using foreground only');
  }

  // Return true as long as foreground works
  return foregroundStarted;
}

/**
 * Stop all location tracking
 */
export async function stopFullTracking(): Promise<void> {
  await stopForegroundTracking();
  await stopBackgroundTracking();
}
