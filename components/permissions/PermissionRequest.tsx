/**
 * Permission request UI component
 */

import React from 'react';
import { View, StyleSheet, Pressable, Linking, Platform } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import type { PermissionStatus } from '@/types';

interface PermissionRequestProps {
  foregroundStatus: PermissionStatus;
  backgroundStatus: PermissionStatus;
  onRequestForeground: () => void;
  onRequestBackground: () => void;
  isLoading?: boolean;
}

export function PermissionRequest({
  foregroundStatus,
  backgroundStatus,
  onRequestForeground,
  onRequestBackground,
  isLoading = false,
}: PermissionRequestProps) {
  const needsForeground = foregroundStatus !== 'granted';
  const needsBackground = !needsForeground && backgroundStatus !== 'granted';
  const allGranted = !needsForeground && !needsBackground;

  if (allGranted) {
    return null;
  }

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const isDenied = foregroundStatus === 'denied' || backgroundStatus === 'denied';

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <ThemedText style={styles.icon}>📍</ThemedText>
      </View>

      <ThemedText style={styles.title}>
        {needsForeground
          ? 'Location Permission Required'
          : 'Background Location Required'}
      </ThemedText>

      <ThemedText style={styles.description}>
        {needsForeground
          ? 'GPS Speed Meter needs access to your location to measure your speed and track your journey.'
          : 'To continue tracking when the app is in the background, please allow "Always" location access.'}
      </ThemedText>

      {isDenied ? (
        <View style={styles.deniedContainer}>
          <ThemedText style={styles.deniedText}>
            Location access was denied. Please enable it in Settings.
          </ThemedText>
          <Pressable style={styles.settingsButton} onPress={openSettings}>
            <ThemedText style={styles.settingsButtonText}>Open Settings</ThemedText>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={needsForeground ? onRequestForeground : onRequestBackground}
          disabled={isLoading}
        >
          <ThemedText style={styles.buttonText}>
            {isLoading ? 'Requesting...' : 'Grant Permission'}
          </ThemedText>
        </Pressable>
      )}

      <View style={styles.statusContainer}>
        <StatusItem
          label="Foreground"
          status={foregroundStatus}
        />
        <StatusItem
          label="Background"
          status={backgroundStatus}
        />
      </View>
    </View>
  );
}

function StatusItem({
  label,
  status,
}: {
  label: string;
  status: PermissionStatus;
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'granted':
        return '#22c55e';
      case 'denied':
        return '#ef4444';
      default:
        return '#71717a';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'granted':
        return '✓';
      case 'denied':
        return '✕';
      default:
        return '○';
    }
  };

  return (
    <View style={styles.statusItem}>
      <ThemedText style={[styles.statusIcon, { color: getStatusColor() }]}>
        {getStatusIcon()}
      </ThemedText>
      <ThemedText style={styles.statusLabel}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#0f0f12',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fafafa',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    marginBottom: 32,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  deniedContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  deniedText: {
    fontSize: 14,
    color: '#f59e0b',
    textAlign: 'center',
    marginBottom: 16,
  },
  settingsButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  settingsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusLabel: {
    fontSize: 13,
    color: '#71717a',
  },
});
