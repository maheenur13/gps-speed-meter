/**
 * App configuration constants
 */

import * as Location from 'expo-location';

// GPS tracking configuration
export const GPS_CONFIG = {
  // High accuracy for speed measurement
  accuracy: Location.Accuracy.BestForNavigation,
  // Update every 1 meter of movement (more responsive)
  distanceInterval: 1,
  // Or every 500ms for smoother updates
  timeInterval: 500,
  // Show settings dialog if location is disabled
  mayShowUserSettingsDialog: true,
} as const;

// Background task configuration
export const BACKGROUND_LOCATION_TASK = 'background-location-task';

// Stationary detection
export const STATIONARY_CONFIG = {
  // Speed below which user is considered stationary (km/h)
  threshold: 1,
  // Duration in seconds before auto-pause kicks in
  duration: 5,
} as const;

// Speedometer scales
export const SPEED_SCALES = {
  kmh: {
    max: 220,
    majorTicks: [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220],
    minorTickCount: 4,
  },
  mph: {
    max: 140,
    majorTicks: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140],
    minorTickCount: 4,
  },
} as const;

// Default settings
export const DEFAULT_SETTINGS = {
  unit: 'kmh' as const,
  speedometerMode: 'analog' as const,
  maxSpeedScale: 220,
  autoPauseEnabled: false, // Disabled by default - user can enable in settings
  autoPauseThreshold: 2, // 2 km/h threshold for walking
  keepScreenOn: true,
} as const;

// Database configuration
export const DATABASE_NAME = 'gps_speed_meter.db';

// UI timing
export const UI_CONFIG = {
  // Speed update animation duration (ms)
  speedAnimationDuration: 150,
  // Needle animation spring config
  needleSpring: {
    damping: 15,
    stiffness: 100,
  },
} as const;

// Conversion factors
export const CONVERSION = {
  MS_TO_KMH: 3.6,
  KMH_TO_MPH: 0.621371,
  MPH_TO_KMH: 1.60934,
  METERS_TO_KM: 0.001,
  METERS_TO_MILES: 0.000621371,
} as const;
