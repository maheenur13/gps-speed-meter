/**
 * Custom hook for GPS tracking with edge case handling
 */

import * as Location from "expo-location";
import { useCallback, useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { STATIONARY_CONFIG } from "@/constants/config";
import {
  addLocationPoint,
  completeTrip,
  createTrip,
  getActiveTrip,
  initDatabase,
  updateTripStats,
} from "@/database";
import {
  checkPermissionStatus,
  startFullTracking,
  stopFullTracking,
} from "@/services/location";
import {
  configureNotifications,
  hideTrackingNotification,
  requestNotificationPermissions,
  showTrackingNotification,
  updateTrackingNotification,
} from "@/services/notification";
import { calculateSpeed, haversineDistance } from "@/services/speed-calculator";
import { useSettingsStore } from "@/stores/settings-store";
import { useTripStore } from "@/stores/trip-store";
import type { LocationPoint } from "@/types";

export function useTracking() {
  const tripStore = useTripStore();
  const settings = useSettingsStore();

  // Use refs to avoid stale closures in callbacks
  const tripIdRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);
  const lastLocationRef = useRef<LocationPoint | null>(null);
  const totalDistanceRef = useRef(0);
  const maxSpeedRef = useRef(0);
  const tripStartTimeRef = useRef<number | null>(null);

  // Refs for tracking state
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stationaryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastGpsUpdateRef = useRef<number>(Date.now());
  const gpsLossTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Ref to hold the location callback (to avoid circular dependency)
  const locationCallbackRef = useRef<
    ((location: Location.LocationObject) => void) | null
  >(null);

  // Configure notifications on mount
  useEffect(() => {
    configureNotifications();
  }, []);

  // Sync refs with store state
  useEffect(() => {
    tripIdRef.current = tripStore.currentTripId;
    isPausedRef.current = tripStore.isPaused;
    lastLocationRef.current = tripStore.lastLocation;
    totalDistanceRef.current = tripStore.totalDistance;
    maxSpeedRef.current = tripStore.maxSpeed;
  }, [
    tripStore.currentTripId,
    tripStore.isPaused,
    tripStore.lastLocation,
    tripStore.totalDistance,
    tripStore.maxSpeed,
  ]);

  // Check for active trip on mount or when app comes to foreground
  const checkForActiveTrip = useCallback(async () => {
    try {
      const db = await initDatabase();
      const activeTrip = await getActiveTrip(db);

      if (activeTrip && !tripStore.isTracking) {
        console.log("Restoring active trip:", activeTrip.id);

        // Update refs immediately
        tripIdRef.current = activeTrip.id;
        isPausedRef.current = false;
        totalDistanceRef.current = activeTrip.totalDistance;
        maxSpeedRef.current = activeTrip.maxSpeed;
        tripStartTimeRef.current = activeTrip.startTime;

        // Restore tracking state from database
        tripStore.restoreTracking(
          activeTrip.id,
          activeTrip.startTime,
          activeTrip.totalDistance,
          activeTrip.maxSpeed,
          activeTrip.avgSpeed
        );

        // Restart location tracking using the ref
        if (locationCallbackRef.current) {
          console.log("Restarting GPS tracking for restored trip");
          await startFullTracking(locationCallbackRef.current);
        }
      }
    } catch (error) {
      console.error("Error checking for active trip:", error);
    }
  }, [tripStore]);

  // Check for active trip on mount
  useEffect(() => {
    checkForActiveTrip();
  }, [checkForActiveTrip]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      const wasInBackground = appStateRef.current.match(/inactive|background/);
      const isNowActive = nextAppState === "active";
      const isGoingToBackground = nextAppState.match(/inactive|background/);

      if (wasInBackground && isNowActive) {
        // App came to foreground - check for active trip
        checkForActiveTrip();
        // Hide notification when app is in foreground (optional - user can see the app)
        hideTrackingNotification();
      }

      if (isGoingToBackground && tripIdRef.current && !isPausedRef.current) {
        // App going to background while tracking - show notification
        // Calculate elapsed time directly from ref
        const currentElapsedTime = tripStartTimeRef.current
          ? Math.floor((Date.now() - tripStartTimeRef.current) / 1000)
          : 0;
        showTrackingNotification(
          tripStore.currentSpeed,
          totalDistanceRef.current,
          currentElapsedTime,
          settings.unit
        );
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [checkForActiveTrip, tripStore.currentSpeed, settings.unit]);

  // Elapsed time timer
  useEffect(() => {
    if (tripStore.isTracking && !tripStore.isPaused) {
      timerRef.current = setInterval(() => {
        tripStore.updateElapsedTime();

        // Speed decay: if no GPS update for 3 seconds, assume stationary
        const timeSinceLastUpdate = Date.now() - lastGpsUpdateRef.current;
        if (timeSinceLastUpdate > 3000 && tripStore.currentSpeed > 0) {
          console.log("No GPS update for 3s, setting speed to 0");
          tripStore.updateLocation(
            tripStore.lastLocation!,
            0 // Set speed to 0
          );
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [
    tripStore.isTracking,
    tripStore.isPaused,
    tripStore.currentSpeed,
    tripStore.lastLocation,
  ]);

  // GPS loss detection
  const checkGpsLoss = useCallback(() => {
    // Don't check for GPS loss when paused - we're intentionally not processing updates
    if (isPausedRef.current) {
      return;
    }

    const timeSinceLastUpdate = Date.now() - lastGpsUpdateRef.current;

    // If no GPS update for 10 seconds, mark as lost
    if (timeSinceLastUpdate > 10000 && tripStore.gpsStatus !== "lost") {
      tripStore.updateGpsStatus("lost");
    }
  }, [tripStore]);

  useEffect(() => {
    if (tripStore.isTracking) {
      gpsLossTimeoutRef.current = setInterval(checkGpsLoss, 5000);
    } else if (gpsLossTimeoutRef.current) {
      clearInterval(gpsLossTimeoutRef.current);
      gpsLossTimeoutRef.current = null;
    }

    return () => {
      if (gpsLossTimeoutRef.current) {
        clearInterval(gpsLossTimeoutRef.current);
      }
    };
  }, [tripStore.isTracking, checkGpsLoss]);

  // Handle stationary detection (uses refs for current values)
  const handleStationaryDetection = useCallback(
    (speed: number) => {
      if (!settings.autoPauseEnabled || isPausedRef.current) {
        return;
      }

      const threshold =
        settings.unit === "mph"
          ? settings.autoPauseThreshold * 0.621371
          : settings.autoPauseThreshold;

      if (speed < threshold) {
        // Start stationary timer if not already started
        if (!stationaryTimerRef.current) {
          stationaryTimerRef.current = setTimeout(() => {
            if (tripIdRef.current && !isPausedRef.current) {
              tripStore.pauseTracking();
            }
            stationaryTimerRef.current = null;
          }, STATIONARY_CONFIG.duration * 1000);
        }
      } else {
        // Clear stationary timer if moving
        if (stationaryTimerRef.current) {
          clearTimeout(stationaryTimerRef.current);
          stationaryTimerRef.current = null;
        }

        // Auto-resume if was auto-paused
        if (isPausedRef.current && speed >= threshold) {
          tripStore.resumeTracking();
        }
      }
    },
    [
      settings.autoPauseEnabled,
      settings.autoPauseThreshold,
      settings.unit,
      tripStore,
    ]
  );

  // Handle location updates - uses refs to get current values
  const handleLocationUpdate = useCallback(
    async (location: Location.LocationObject) => {
      // Use refs to get current values (avoid stale closure)
      const currentTripId = tripIdRef.current;
      const currentIsPaused = isPausedRef.current;

      console.log("Location update received:", {
        tripId: currentTripId,
        isPaused: currentIsPaused,
        speed: location.coords.speed,
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });

      // Always update GPS timestamp to prevent false "GPS lost" when paused
      lastGpsUpdateRef.current = Date.now();

      if (!currentTripId) {
        console.log("Skipping - no active trip");
        return;
      }

      if (currentIsPaused) {
        console.log("Skipping calculation - trip is paused (GPS still active)");
        return;
      }

      const db = await initDatabase();

      const newPoint: Omit<LocationPoint, "id"> = {
        tripId: currentTripId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        speed: location.coords.speed,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      // Calculate speed using ref for last location
      const speed = calculateSpeed(
        newPoint as LocationPoint,
        lastLocationRef.current
      );

      console.log("Calculated speed:", speed, "km/h");

      // Calculate distance from last point
      // Only count distance if we're actually moving (speed > 0 after noise filter)
      let distanceIncrement = 0;
      if (lastLocationRef.current && speed > 0) {
        distanceIncrement = haversineDistance(
          lastLocationRef.current,
          newPoint
        );
        console.log("Distance increment:", distanceIncrement, "m (speed > 0)");
      } else {
        console.log(
          "Distance NOT added: speed =",
          speed,
          ", hasLastLocation =",
          !!lastLocationRef.current
        );
      }

      // Update store (this will also update our refs via the effect)
      tripStore.updateLocation(newPoint as LocationPoint, speed);
      if (distanceIncrement > 0) {
        console.log("Updating store distance by:", distanceIncrement);
        tripStore.updateDistance(distanceIncrement);
      }

      // Handle stationary detection
      handleStationaryDetection(speed);

      // Update the live notification with current stats
      const newDistance = totalDistanceRef.current + distanceIncrement;
      // Calculate elapsed time directly to avoid stale closure
      const currentElapsedTime = tripStartTimeRef.current
        ? Math.floor((Date.now() - tripStartTimeRef.current) / 1000)
        : 0;
      updateTrackingNotification(
        speed,
        newDistance,
        currentElapsedTime,
        settings.unit
      );

      // Save to database
      try {
        await addLocationPoint(db, newPoint);
        await updateTripStats(db, currentTripId, {
          totalDistance: newDistance,
          maxSpeed: Math.max(maxSpeedRef.current, speed),
          avgSpeed: tripStore.avgSpeed,
        });
      } catch (error) {
        console.error("Error saving location:", error);
      }
    },
    [tripStore, handleStationaryDetection, settings.unit]
  );

  // Keep the ref updated with the latest callback
  useEffect(() => {
    locationCallbackRef.current = handleLocationUpdate;
  }, [handleLocationUpdate]);

  // Start tracking
  const startTracking = useCallback(async (): Promise<boolean> => {
    try {
      // Check permissions first
      const permissions = await checkPermissionStatus();
      if (permissions.foreground !== "granted") {
        console.error("Foreground permission not granted");
        return false;
      }

      const db = await initDatabase();
      const tripId = await createTrip(db);

      // Update ref immediately so callback has the right value
      tripIdRef.current = tripId;
      isPausedRef.current = false;
      lastLocationRef.current = null;
      totalDistanceRef.current = 0;
      maxSpeedRef.current = 0;
      tripStartTimeRef.current = Date.now();

      // Update store
      tripStore.startTracking(tripId);

      console.log("Starting GPS tracking for trip:", tripId);

      const success = await startFullTracking(handleLocationUpdate);
      if (!success) {
        tripIdRef.current = null;
        tripStore.stopTracking();
        console.error("Failed to start tracking");
        return false;
      }

      // Request notification permissions and show initial tracking notification
      const hasNotificationPermission = await requestNotificationPermissions();
      if (hasNotificationPermission) {
        await showTrackingNotification(0, 0, 0, settings.unit);
        console.log("Tracking notification shown");
      } else {
        console.log("Notification permission denied - notification won't show");
      }

      console.log("GPS tracking started successfully");
      return true;
    } catch (error) {
      console.error("Error starting trip:", error);
      tripIdRef.current = null;
      tripStore.stopTracking();
      return false;
    }
  }, [tripStore, handleLocationUpdate, settings.unit]);

  // Stop tracking
  const stopTracking = useCallback(async (): Promise<void> => {
    try {
      await stopFullTracking();

      const currentTripId = tripIdRef.current;
      if (currentTripId) {
        const db = await initDatabase();
        await completeTrip(db, currentTripId);
      }

      // Hide the tracking notification
      await hideTrackingNotification();

      // Clear refs
      tripIdRef.current = null;
      isPausedRef.current = false;
      lastLocationRef.current = null;
      tripStartTimeRef.current = null;

      // Clear timers
      if (stationaryTimerRef.current) {
        clearTimeout(stationaryTimerRef.current);
        stationaryTimerRef.current = null;
      }

      tripStore.stopTracking();
      tripStore.reset();
    } catch (error) {
      console.error("Error stopping trip:", error);
    }
  }, [tripStore]);

  // Pause tracking
  const pauseTracking = useCallback(() => {
    isPausedRef.current = true;
    tripStore.pauseTracking();
  }, [tripStore]);

  // Resume tracking
  const resumeTracking = useCallback(() => {
    isPausedRef.current = false;
    tripStore.resumeTracking();
  }, [tripStore]);

  return {
    // State
    isTracking: tripStore.isTracking,
    isPaused: tripStore.isPaused,
    currentSpeed: tripStore.currentSpeed,
    totalDistance: tripStore.totalDistance,
    avgSpeed: tripStore.avgSpeed,
    maxSpeed: tripStore.maxSpeed,
    elapsedTime: tripStore.elapsedTime,
    gpsStatus: tripStore.gpsStatus,
    accuracy: tripStore.accuracy,

    // Actions
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
  };
}
