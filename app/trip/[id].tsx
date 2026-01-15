/**
 * Trip Detail Screen
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { TripStats } from '@/components/trip';
import { useSettingsStore } from '@/stores/settings-store';
import { initDatabase, getTripById, getLocationPointsForTrip, deleteTrip } from '@/database';
import { formatSpeed, formatDistance, formatDuration } from '@/services/speed-calculator';
import { exportTripAsJSON, exportTripAsGPX } from '@/utils/export';
import type { Trip, LocationPoint } from '@/types';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unit } = useSettingsStore();
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [points, setPoints] = useState<LocationPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const tripId = parseInt(id, 10);

  useEffect(() => {
    const loadTrip = async () => {
      try {
        const db = await initDatabase();
        const tripData = await getTripById(db, tripId);
        const locationPoints = await getLocationPointsForTrip(db, tripId);
        
        setTrip(tripData);
        setPoints(locationPoints);
      } catch (error) {
        console.error('Error loading trip:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (tripId) {
      loadTrip();
    }
  }, [tripId]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExportJSON = async () => {
    try {
      await exportTripAsJSON(tripId);
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export trip. Please try again.');
    }
  };

  const handleExportGPX = async () => {
    try {
      await exportTripAsGPX(tripId);
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export trip. Please try again.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Trip',
      'Are you sure you want to delete this trip? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await initDatabase();
              await deleteTrip(db, tripId);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Unable to delete trip. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <ThemedText style={styles.loadingText}>Loading trip...</ThemedText>
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Stack.Screen options={{ title: 'Trip Not Found' }} />
        <ThemedText style={styles.errorText}>Trip not found</ThemedText>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
        </Pressable>
      </View>
    );
  }

  const duration = trip.endTime
    ? Math.floor((trip.endTime - trip.startTime) / 1000)
    : 0;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: `Trip ${trip.id}`,
          headerStyle: { backgroundColor: '#0f0f12' },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Date and Time */}
        <View style={styles.dateContainer}>
          <ThemedText style={styles.date}>{formatDate(trip.startTime)}</ThemedText>
          <ThemedText style={styles.time}>
            {formatTime(trip.startTime)}
            {trip.endTime && ` — ${formatTime(trip.endTime)}`}
          </ThemedText>
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, getStatusStyle(trip.status)]}>
          <ThemedText style={styles.statusText}>
            {trip.status.toUpperCase()}
          </ThemedText>
        </View>

        {/* Main Stats */}
        <TripStats
          distance={trip.totalDistance}
          avgSpeed={trip.avgSpeed}
          maxSpeed={trip.maxSpeed}
          duration={duration}
        />

        {/* Detailed Stats */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Details</ThemedText>
          <View style={styles.detailsCard}>
            <DetailRow
              label="Total Distance"
              value={formatDistance(trip.totalDistance, unit)}
            />
            <DetailRow
              label="Average Speed"
              value={`${formatSpeed(trip.avgSpeed, unit)} ${unit === 'kmh' ? 'km/h' : 'mph'}`}
            />
            <DetailRow
              label="Maximum Speed"
              value={`${formatSpeed(trip.maxSpeed, unit)} ${unit === 'kmh' ? 'km/h' : 'mph'}`}
            />
            <DetailRow
              label="Duration"
              value={formatDuration(duration)}
            />
            <DetailRow
              label="Location Points"
              value={points.length.toString()}
              isLast
            />
          </View>
        </View>

        {/* Export Options */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Export</ThemedText>
          <View style={styles.exportButtons}>
            <Pressable style={styles.exportButton} onPress={handleExportJSON}>
              <ThemedText style={styles.exportIcon}>📋</ThemedText>
              <ThemedText style={styles.exportLabel}>JSON</ThemedText>
            </Pressable>
            <Pressable style={styles.exportButton} onPress={handleExportGPX}>
              <ThemedText style={styles.exportIcon}>🗺️</ThemedText>
              <ThemedText style={styles.exportLabel}>GPX</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Delete Button */}
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <ThemedText style={styles.deleteButtonText}>Delete Trip</ThemedText>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function DetailRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !isLast && styles.detailRowBorder]}>
      <ThemedText style={styles.detailLabel}>{label}</ThemedText>
      <ThemedText style={styles.detailValue}>{value}</ThemedText>
    </View>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'active':
      return { backgroundColor: '#22c55e20', borderColor: '#22c55e' };
    case 'paused':
      return { backgroundColor: '#f59e0b20', borderColor: '#f59e0b' };
    case 'completed':
      return { backgroundColor: '#3b82f620', borderColor: '#3b82f6' };
    default:
      return { backgroundColor: '#71717a20', borderColor: '#71717a' };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f12',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#71717a',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  dateContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  date: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fafafa',
  },
  time: {
    fontSize: 14,
    color: '#71717a',
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fafafa',
    letterSpacing: 0.5,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  detailsCard: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  detailLabel: {
    fontSize: 15,
    color: '#a1a1aa',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fafafa',
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  exportButton: {
    flex: 1,
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  exportIcon: {
    fontSize: 24,
  },
  exportLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fafafa',
  },
  deleteButton: {
    marginTop: 32,
    backgroundColor: '#7f1d1d',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fecaca',
  },
});
