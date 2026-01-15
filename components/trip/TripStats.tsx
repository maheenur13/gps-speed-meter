/**
 * Trip statistics display component
 */

import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  formatDistance,
  formatDuration,
  formatSpeed,
} from "@/services/speed-calculator";
import { useSettingsStore } from "@/stores/settings-store";

interface TripStatsProps {
  distance: number; // meters
  avgSpeed: number; // km/h
  maxSpeed: number; // km/h
  duration: number; // seconds
  compact?: boolean;
}

export function TripStats({
  distance,
  avgSpeed,
  maxSpeed,
  duration,
  compact = false,
}: TripStatsProps) {
  const { unit } = useSettingsStore();

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <StatItem
          label="Distance"
          value={formatDistance(distance, unit)}
          compact
        />
        <View style={styles.compactDivider} />
        <StatItem
          label="Avg"
          value={`${formatSpeed(avgSpeed, unit)} ${unit === "kmh" ? "km/h" : "mph"}`}
          compact
        />
        <View style={styles.compactDivider} />
        <StatItem
          label="Time"
          value={formatDuration(duration)}
          compact
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <StatItem
          label="Distance"
          value={formatDistance(distance, unit)}
          iconName="map-marker-distance"
          iconColor="#22c55e"
        />
        <StatItem
          label="Duration"
          value={formatDuration(duration)}
          iconName="clock-outline"
          iconColor="#3b82f6"
        />
      </View>
      <View style={styles.row}>
        <StatItem
          label="Avg Speed"
          value={`${formatSpeed(avgSpeed, unit)} ${unit === "kmh" ? "km/h" : "mph"}`}
          iconName="chart-line"
          iconColor="#f59e0b"
        />
        <StatItem
          label="Max Speed"
          value={`${formatSpeed(maxSpeed, unit)} ${unit === "kmh" ? "km/h" : "mph"}`}
          iconName="rocket-launch"
          iconColor="#ef4444"
        />
      </View>
    </View>
  );
}

interface StatItemProps {
  label: string;
  value: string;
  iconName?: string;
  iconColor?: string;
  compact?: boolean;
}

function StatItem({ label, value, iconName, iconColor, compact }: StatItemProps) {
  if (compact) {
    return (
      <View style={styles.compactItem}>
        <ThemedText style={styles.compactLabel}>{label}</ThemedText>
        <ThemedText style={styles.compactValue}>{value}</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.statItem}>
      <View style={styles.statHeader}>
        {iconName && (
          <MaterialCommunityIcons
            name={iconName as any}
            size={16}
            color={iconColor || "#71717a"}
          />
        )}
        <ThemedText style={styles.statLabel}>{label}</ThemedText>
      </View>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#18181b",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: "#27272a",
    borderRadius: 12,
    padding: 12,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#71717a",
    fontWeight: "500",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fafafa",
  },
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181b",
    borderRadius: 12,
    padding: 12,
  },
  compactItem: {
    flex: 1,
    alignItems: "center",
  },
  compactDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#3f3f46",
    marginHorizontal: 8,
  },
  compactLabel: {
    fontSize: 10,
    color: "#71717a",
    fontWeight: "500",
    marginBottom: 2,
  },
  compactValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fafafa",
  },
});
