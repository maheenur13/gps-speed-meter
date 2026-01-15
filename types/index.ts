/**
 * Core type definitions for GPS Speed Meter app
 */

// Location point from GPS
export interface LocationPoint {
  id?: number;
  tripId: number;
  latitude: number;
  longitude: number;
  speed: number | null; // m/s from GPS
  altitude: number | null;
  accuracy: number | null;
  timestamp: number;
}

// Trip status
export type TripStatus = 'active' | 'paused' | 'completed';

// Trip record
export interface Trip {
  id: number;
  startTime: number;
  endTime: number | null;
  totalDistance: number; // meters
  maxSpeed: number; // km/h
  avgSpeed: number; // km/h
  status: TripStatus;
}

// Speed unit preference
export type SpeedUnit = 'kmh' | 'mph';

// Speedometer display mode
export type SpeedometerMode = 'analog' | 'digital';

// User settings
export interface Settings {
  unit: SpeedUnit;
  speedometerMode: SpeedometerMode;
  maxSpeedScale: number; // Max value for gauge (e.g., 220 for km/h)
  autoPauseEnabled: boolean;
  autoPauseThreshold: number; // km/h below which to auto-pause
  keepScreenOn: boolean;
}

// Current tracking state
export interface TrackingState {
  isTracking: boolean;
  isPaused: boolean;
  currentSpeed: number; // km/h
  currentTripId: number | null;
  totalDistance: number; // meters
  avgSpeed: number; // km/h
  maxSpeed: number; // km/h
  elapsedTime: number; // seconds
  lastLocation: LocationPoint | null;
  gpsStatus: 'searching' | 'acquired' | 'lost';
  accuracy: number | null;
}

// GPS permission status
export type PermissionStatus = 
  | 'undetermined'
  | 'granted'
  | 'denied'
  | 'restricted';

// Export format
export type ExportFormat = 'csv' | 'json';

// Trip with calculated duration
export interface TripWithDuration extends Trip {
  duration: number; // seconds
}
