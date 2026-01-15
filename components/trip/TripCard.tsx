/**
 * Trip card for history list
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useSettingsStore } from '@/stores/settings-store';
import { formatDistance, formatSpeed, formatDuration } from '@/services/speed-calculator';
import type { TripWithDuration } from '@/types';

interface TripCardProps {
  trip: TripWithDuration;
  onPress: () => void;
}

export function TripCard({ trip, onPress }: TripCardProps) {
  const { unit } = useSettingsStore();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (isYesterday) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = () => {
    switch (trip.status) {
      case 'active':
        return '#22c55e';
      case 'paused':
        return '#f59e0b';
      case 'completed':
        return '#3b82f6';
      default:
        return '#71717a';
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      {/* Status indicator */}
      <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.date}>{formatDate(trip.startTime)}</ThemedText>
          {trip.status !== 'completed' && (
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}20` }]}>
              <ThemedText style={[styles.statusText, { color: getStatusColor() }]}>
                {trip.status.toUpperCase()}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatPill
            icon="📍"
            value={formatDistance(trip.totalDistance, unit)}
          />
          <StatPill
            icon="⏱️"
            value={formatDuration(trip.duration)}
          />
          <StatPill
            icon="📊"
            value={`${formatSpeed(trip.avgSpeed, unit)} ${unit === 'kmh' ? 'km/h' : 'mph'}`}
          />
        </View>

        {/* Max speed */}
        {trip.maxSpeed > 0 && (
          <View style={styles.maxSpeedRow}>
            <ThemedText style={styles.maxSpeedLabel}>Max:</ThemedText>
            <ThemedText style={styles.maxSpeedValue}>
              {formatSpeed(trip.maxSpeed, unit)} {unit === 'kmh' ? 'km/h' : 'mph'}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Chevron */}
      <ThemedText style={styles.chevron}>›</ThemedText>
    </Pressable>
  );
}

function StatPill({ icon, value }: { icon: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <ThemedText style={styles.statIcon}>{icon}</ThemedText>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  statusIndicator: {
    width: 4,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  date: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fafafa',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statIcon: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#a1a1aa',
  },
  maxSpeedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  maxSpeedLabel: {
    fontSize: 12,
    color: '#71717a',
  },
  maxSpeedValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  chevron: {
    fontSize: 24,
    color: '#52525b',
    marginRight: 16,
  },
});
