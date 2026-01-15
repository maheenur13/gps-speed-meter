/**
 * Background location task registration and handling
 */

import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { BACKGROUND_LOCATION_TASK } from '@/constants/config';

// Type for background location data
interface BackgroundLocationData {
  locations: Location.LocationObject[];
}

// Callback type for processing locations
type LocationCallback = (locations: Location.LocationObject[]) => void;

// Store the callback for processing background locations
let backgroundLocationCallback: LocationCallback | null = null;

/**
 * Set the callback for processing background locations
 */
export function setBackgroundLocationCallback(callback: LocationCallback | null): void {
  backgroundLocationCallback = callback;
}

/**
 * Define the background location task
 * This must be called at the module level (outside of components)
 */
TaskManager.defineTask(
  BACKGROUND_LOCATION_TASK,
  ({ data, error }: { data: unknown; error: TaskManager.TaskManagerError | null }) => {
    if (error) {
      console.error('Background location task error:', error);
      return;
    }

    const locationData = data as BackgroundLocationData;
    if (locationData?.locations && backgroundLocationCallback) {
      backgroundLocationCallback(locationData.locations);
    }
  }
);

/**
 * Check if background location task is registered
 */
export async function isBackgroundLocationTaskRegistered(): Promise<boolean> {
  return await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
}

/**
 * Start background location updates
 */
export async function startBackgroundLocationUpdates(): Promise<void> {
  const isRegistered = await isBackgroundLocationTaskRegistered();
  
  if (!isRegistered) {
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 5,
      timeInterval: 1000,
      foregroundService: {
        notificationTitle: 'GPS Speed Meter',
        notificationBody: 'Tracking your speed and distance',
        notificationColor: '#1a1a2e',
      },
      activityType: Location.ActivityType.AutomotiveNavigation,
      showsBackgroundLocationIndicator: true,
      pausesUpdatesAutomatically: false,
    });
  }
}

/**
 * Stop background location updates
 */
export async function stopBackgroundLocationUpdates(): Promise<void> {
  const isRegistered = await isBackgroundLocationTaskRegistered();
  
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}
