/**
 * Toggle switch between analog and digital speedometer modes
 */

import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { useSettingsStore } from "@/stores/settings-store";
import type { SpeedometerMode } from "@/types";

export function SpeedometerToggle() {
  const { speedometerMode, setSpeedometerMode } = useSettingsStore();

  const handleToggle = (mode: SpeedometerMode) => {
    setSpeedometerMode(mode);
  };

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withSpring(speedometerMode === "analog" ? 0 : 90, {
            damping: 15,
            stiffness: 120,
          }),
        },
      ],
    };
  });

  return (
    <View style={styles.container}>
      {/* Background track */}
      <View style={styles.track}>
        {/* Animated indicator */}
        <Animated.View style={[styles.indicator, animatedIndicatorStyle]} />

        {/* Analog button */}
        <Pressable style={styles.button} onPress={() => handleToggle("analog")}>
          <MaterialCommunityIcons
            name="gauge"
            size={16}
            color={speedometerMode === "analog" ? "#22c55e" : "#71717a"}
          />
          <ThemedText
            style={[
              styles.buttonText,
              speedometerMode === "analog" && styles.activeText,
            ]}
          >
            Analog
          </ThemedText>
        </Pressable>

        {/* Digital button */}
        <Pressable style={styles.button} onPress={() => handleToggle("digital")}>
          <MaterialCommunityIcons
            name="numeric"
            size={16}
            color={speedometerMode === "digital" ? "#22c55e" : "#71717a"}
          />
          <ThemedText
            style={[
              styles.buttonText,
              speedometerMode === "digital" && styles.activeText,
            ]}
          >
            Digital
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 12,
  },
  track: {
    flexDirection: "row",
    backgroundColor: "#27272a",
    borderRadius: 20,
    padding: 4,
    position: "relative",
  },
  indicator: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 86,
    height: 32,
    backgroundColor: "#3f3f46",
    borderRadius: 16,
  },
  button: {
    width: 86,
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    zIndex: 1,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#71717a",
  },
  activeText: {
    color: "#ffffff",
  },
});
