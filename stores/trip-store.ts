/**
 * Zustand store for current trip tracking state
 */

import { create } from 'zustand';
import type { TrackingState, LocationPoint } from '@/types';

interface TripState extends TrackingState {
  // Trip start time for elapsed time calculation
  tripStartTime: number | null;
  
  // Actions
  startTracking: (tripId: number) => void;
  restoreTracking: (tripId: number, startTime: number, totalDistance: number, maxSpeed: number, avgSpeed: number) => void;
  stopTracking: () => void;
  pauseTracking: () => void;
  resumeTracking: () => void;
  updateLocation: (location: LocationPoint, speed: number) => void;
  updateDistance: (distance: number) => void;
  updateGpsStatus: (status: 'searching' | 'acquired' | 'lost') => void;
  setAccuracy: (accuracy: number | null) => void;
  updateElapsedTime: () => void;
  reset: () => void;
}

const initialState: TrackingState & { tripStartTime: number | null } = {
  isTracking: false,
  isPaused: false,
  currentSpeed: 0,
  currentTripId: null,
  totalDistance: 0,
  avgSpeed: 0,
  maxSpeed: 0,
  elapsedTime: 0,
  lastLocation: null,
  gpsStatus: 'searching',
  accuracy: null,
  tripStartTime: null,
};

export const useTripStore = create<TripState>()((set, get) => ({
  ...initialState,

  startTracking: (tripId) =>
    set({
      isTracking: true,
      isPaused: false,
      currentTripId: tripId,
      tripStartTime: Date.now(),
      totalDistance: 0,
      avgSpeed: 0,
      maxSpeed: 0,
      elapsedTime: 0,
      gpsStatus: 'searching',
    }),

  // Restore tracking state from database (when app resumes)
  restoreTracking: (tripId, startTime, totalDistance, maxSpeed, avgSpeed) => {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    set({
      isTracking: true,
      isPaused: false,
      currentTripId: tripId,
      tripStartTime: startTime,
      totalDistance,
      maxSpeed,
      avgSpeed,
      elapsedTime,
      gpsStatus: 'searching',
    });
  },

  stopTracking: () =>
    set({
      isTracking: false,
      isPaused: false,
      currentTripId: null,
      tripStartTime: null,
    }),

  pauseTracking: () =>
    set({ isPaused: true }),

  resumeTracking: () =>
    set({ isPaused: false }),

  updateLocation: (location, speed) => {
    const state = get();
    const newMaxSpeed = Math.max(state.maxSpeed, speed);
    
    set({
      currentSpeed: speed,
      lastLocation: location,
      maxSpeed: newMaxSpeed,
      gpsStatus: 'acquired',
      accuracy: location.accuracy,
    });
  },

  updateDistance: (distance) => {
    const state = get();
    const newTotalDistance = state.totalDistance + distance;
    
    // Calculate average speed using fresh elapsed time from tripStartTime
    // This avoids stale elapsedTime issues
    const elapsedSeconds = state.tripStartTime 
      ? (Date.now() - state.tripStartTime) / 1000 
      : 0;
    const elapsedHours = elapsedSeconds / 3600;
    const avgSpeed = elapsedHours > 0 
      ? (newTotalDistance / 1000) / elapsedHours 
      : 0;
    
    set({
      totalDistance: newTotalDistance,
      avgSpeed,
    });
  },

  updateGpsStatus: (gpsStatus) =>
    set({ gpsStatus }),

  setAccuracy: (accuracy) =>
    set({ accuracy }),

  updateElapsedTime: () => {
    const state = get();
    if (state.tripStartTime && state.isTracking && !state.isPaused) {
      const now = Date.now();
      const elapsedTime = Math.floor((now - state.tripStartTime) / 1000);
      
      // Recalculate average speed with fresh elapsed time
      const elapsedHours = elapsedTime / 3600;
      const avgSpeed = elapsedHours > 0 
        ? (state.totalDistance / 1000) / elapsedHours 
        : 0;
      
      set({ elapsedTime, avgSpeed });
    }
  },

  reset: () => set(initialState),
}));
