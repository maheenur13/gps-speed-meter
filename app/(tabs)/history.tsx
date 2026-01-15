/**
 * History Screen - Trip History List
 */

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { TripCard } from "@/components/trip";
import { getAllTrips, initDatabase } from "@/database";
import type { TripWithDuration } from "@/types";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [trips, setTrips] = useState<TripWithDuration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTrips = useCallback(async () => {
    try {
      const db = await initDatabase();
      const allTrips = await getAllTrips(db);
      setTrips(allTrips);
    } catch (error) {
      console.error("Error loading trips:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Reload trips whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTrips();
  };

  const handleTripPress = (tripId: number) => {
    router.push(`/trip/${tripId}`);
  };

  const renderItem = useCallback(
    ({ item }: { item: TripWithDuration }) => (
      <TripCard trip={item} onPress={() => handleTripPress(item.id)} />
    ),
    []
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name="map-marker-path" size={40} color="#22c55e" />
      </View>
      <ThemedText style={styles.emptyTitle}>No Trips Yet</ThemedText>
      <ThemedText style={styles.emptyDescription}>
        Start your first trip from the home screen to see your journey history
        here.
      </ThemedText>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <ThemedText style={styles.listHeaderText}>
        {trips.length} {trips.length === 1 ? "Trip" : "Trips"}
      </ThemedText>
    </View>
  );

  if (isLoading) {
    return (
      <View
        style={[styles.container, styles.centered, { paddingTop: insets.top }]}
      >
        <ThemedText style={styles.loadingText}>Loading trips...</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Trip History</ThemedText>
      </View>

      {/* Trip list */}
      {trips.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlashList
          data={trips}
          renderItem={renderItem}
          estimatedItemSize={120}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#22c55e"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f12",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fafafa",
  },
  listContent: {
    paddingBottom: 20,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listHeaderText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#71717a",
  },
  loadingText: {
    fontSize: 16,
    color: "#71717a",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#18181b",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fafafa",
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: "#71717a",
    textAlign: "center",
    lineHeight: 22,
  },
});
