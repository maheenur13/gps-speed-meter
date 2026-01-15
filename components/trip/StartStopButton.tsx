/**
 * Start/Stop button for trip tracking
 */

import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  useDerivedValue,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";

interface StartStopButtonProps {
  isTracking: boolean;
  isPaused: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  disabled?: boolean;
}

export function StartStopButton({
  isTracking,
  isPaused,
  onStart,
  onStop,
  onPause,
  onResume,
  disabled = false,
}: StartStopButtonProps) {
  const scale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  // Pulse animation when tracking
  useDerivedValue(() => {
    if (isTracking && !isPaused) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      );
    } else {
      pulseOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isTracking, isPaused]);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    if (!isTracking) {
      onStart();
    } else if (isPaused) {
      onResume();
    } else {
      onPause();
    }
  };

  const getButtonContent = () => {
    if (!isTracking) {
      return {
        text: "START",
        color: "#22c55e",
        iconName: "play" as const,
      };
    }
    if (isPaused) {
      return {
        text: "RESUME",
        color: "#3b82f6",
        iconName: "play" as const,
      };
    }
    return {
      text: "PAUSE",
      color: "#f59e0b",
      iconName: "pause" as const,
    };
  };

  const { text, color, iconName } = getButtonContent();

  return (
    <View style={styles.container}>
      {/* Main button */}
      <Animated.View style={[styles.buttonWrapper, animatedButtonStyle]}>
        {/* Pulse effect */}
        <Animated.View
          style={[styles.pulse, { backgroundColor: color }, animatedPulseStyle]}
        />

        <Pressable
          style={[
            styles.button,
            { backgroundColor: color },
            disabled && styles.disabled,
          ]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
        >
          <MaterialCommunityIcons name={iconName} size={20} color="#fff" />
          <ThemedText style={styles.text}>{text}</ThemedText>
        </Pressable>
      </Animated.View>

      {/* Stop button (only shown when tracking) */}
      {isTracking && (
        <Pressable style={styles.stopButton} onPress={onStop}>
          <MaterialCommunityIcons name="stop" size={18} color="#fff" />
          <ThemedText style={styles.stopText}>STOP</ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginVertical: 20,
  },
  buttonWrapper: {
    position: "relative",
  },
  pulse: {
    position: "absolute",
    width: 140,
    height: 56,
    borderRadius: 28,
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 132,
    height: 48,
    borderRadius: 24,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 1,
  },
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#dc2626",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stopText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 1,
  },
});
