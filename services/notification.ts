/**
 * Notification service for live tracking updates
 */

import type { SpeedUnit } from "@/types";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  formatDistance,
  formatDuration,
  formatSpeed,
} from "./speed-calculator";

// Notification identifiers
const TRACKING_NOTIFICATION_ID = "gps-tracking-notification";
const TRACKING_CHANNEL_ID = "gps-tracking-channel";

// Track if notification channel is set up
let isChannelConfigured = false;

/**
 * Configure notification settings and channel
 */
export async function configureNotifications(): Promise<void> {
  // Set notification handler for foreground notifications
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    }),
  });

  // Create Android notification channel
  if (Platform.OS === "android" && !isChannelConfigured) {
    await Notifications.setNotificationChannelAsync(TRACKING_CHANNEL_ID, {
      name: "GPS Tracking",
      importance: Notifications.AndroidImportance.LOW, // Low = no sound, but visible
      vibrationPattern: [0], // No vibration
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
      description: "Shows current speed and trip progress while tracking",
    });
    isChannelConfigured = true;
  }
}

/**
 * Format tracking stats for notification display
 */
function formatNotificationBody(
  speed: number,
  distance: number,
  duration: number,
  unit: SpeedUnit
): string {
  const speedText = `${formatSpeed(speed, unit)} ${
    unit === "kmh" ? "km/h" : "mph"
  }`;
  const distanceText = formatDistance(distance, unit);
  const durationText = formatDuration(duration);

  return `${speedText} • ${distanceText} • ${durationText}`;
}

/**
 * Show or update the tracking notification
 */
export async function showTrackingNotification(
  speed: number,
  distance: number,
  duration: number,
  unit: SpeedUnit
): Promise<void> {
  try {
    // Ensure channel is configured
    await configureNotifications();

    const body = formatNotificationBody(speed, distance, duration, unit);

    await Notifications.scheduleNotificationAsync({
      identifier: TRACKING_NOTIFICATION_ID,
      content: {
        title: "🚗 GPS Speed Meter - Tracking",
        body,
        data: { type: "tracking" },
        sticky: false, // Allow user to dismiss
        autoDismiss: false,
        ...(Platform.OS === "android" && {
          priority: Notifications.AndroidNotificationPriority.LOW,
          categoryIdentifier: "tracking",
        }),
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error("Error showing tracking notification:", error);
  }
}

/**
 * Update the tracking notification with new stats
 * (Same as show - will replace existing notification with same ID)
 */
export async function updateTrackingNotification(
  speed: number,
  distance: number,
  duration: number,
  unit: SpeedUnit
): Promise<void> {
  await showTrackingNotification(speed, distance, duration, unit);
}

/**
 * Hide/dismiss the tracking notification
 */
export async function hideTrackingNotification(): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(TRACKING_NOTIFICATION_ID);
  } catch (error) {
    console.error("Error hiding tracking notification:", error);
  }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === "granted") {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Check if notification permissions are granted
 */
export async function hasNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}
