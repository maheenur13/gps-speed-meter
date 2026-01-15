/**
 * Home Screen - Speedometer Dashboard
 */

import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GpsStatusIndicator } from '@/components/GpsStatusIndicator';
import { PermissionRequest } from '@/components/permissions';
import { AnalogSpeedometer, DigitalSpeedometer, SpeedometerToggle } from '@/components/speedometer';
import { ThemedText } from '@/components/themed-text';
import { StartStopButton, TripStats } from '@/components/trip';

import { initDatabase } from '@/database';
import { useTracking } from '@/hooks/useTracking';
import {
  checkPermissionStatus,
  requestBackgroundPermission,
  requestForegroundPermission,
} from '@/services/location';
import { useSettingsStore } from '@/stores/settings-store';
import type { PermissionStatus } from '@/types';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { speedometerMode, keepScreenOn } = useSettingsStore();

  // Use the tracking hook
  const {
    isTracking,
    isPaused,
    currentSpeed,
    totalDistance,
    avgSpeed,
    maxSpeed,
    elapsedTime,
    gpsStatus,
    accuracy,
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
  } = useTracking();

  // Permission and loading state
  const [isInitializing, setIsInitializing] = useState(true);
  const [foregroundPermission, setForegroundPermission] = useState<PermissionStatus>('undetermined');
  const [backgroundPermission, setBackgroundPermission] = useState<PermissionStatus>('undetermined');
  const [isLoadingPermission, setIsLoadingPermission] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);

  // Initialize database and check permissions on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        setDbInitialized(true);

        const status = await checkPermissionStatus();
        setForegroundPermission(status.foreground);
        setBackgroundPermission(status.background);
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  // Keep screen on when tracking
  useEffect(() => {
    if (keepScreenOn && isTracking && !isPaused) {
      activateKeepAwakeAsync('tracking');
    } else {
      deactivateKeepAwake('tracking');
    }

    return () => {
      deactivateKeepAwake('tracking');
    };
  }, [keepScreenOn, isTracking, isPaused]);

  // Request foreground permission
  const handleRequestForeground = async () => {
    setIsLoadingPermission(true);
    const status = await requestForegroundPermission();
    setForegroundPermission(status);
    setIsLoadingPermission(false);
  };

  // Request background permission
  const handleRequestBackground = async () => {
    setIsLoadingPermission(true);
    const status = await requestBackgroundPermission();
    setBackgroundPermission(status);
    setIsLoadingPermission(false);
  };

  // Handle start
  const handleStart = async () => {
    if (!dbInitialized) return;
    await startTracking();
  };

  // Handle stop
  const handleStop = async () => {
    await stopTracking();
  };

  // Check if permissions are granted
  const hasPermissions = foregroundPermission === 'granted' && backgroundPermission === 'granted';

  // Show loading screen while initializing
  if (isInitializing) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </View>
    );
  }

  // Show permission request if needed
  if (!hasPermissions) {
    return (
      <PermissionRequest
        foregroundStatus={foregroundPermission}
        backgroundStatus={backgroundPermission}
        onRequestForeground={handleRequestForeground}
        onRequestBackground={handleRequestBackground}
        isLoading={isLoadingPermission}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>GPS Speed Meter</ThemedText>
        <GpsStatusIndicator
          status={gpsStatus}
          accuracy={accuracy}
        />
      </View>

      {/* Speedometer */}
      <View style={styles.speedometerContainer}>
        {speedometerMode === 'analog' ? (
          <AnalogSpeedometer speed={currentSpeed} />
        ) : (
          <DigitalSpeedometer speed={currentSpeed} />
        )}
      </View>

      {/* Speedometer toggle */}
      <SpeedometerToggle />

      {/* Trip stats */}
      <TripStats
        distance={totalDistance}
        avgSpeed={avgSpeed}
        maxSpeed={maxSpeed}
        duration={elapsedTime}
      />

      {/* Start/Stop button */}
      <StartStopButton
        isTracking={isTracking}
        isPaused={isPaused}
        onStart={handleStart}
        onStop={handleStop}
        onPause={pauseTracking}
        onResume={resumeTracking}
        disabled={!dbInitialized}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f12',
    paddingHorizontal: 16,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fafafa',
  },
  speedometerContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#71717a',
  },
});
