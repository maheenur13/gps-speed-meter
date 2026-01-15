/**
 * Digital speedometer with large, clear typography
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  useDerivedValue,
  interpolateColor,
} from 'react-native-reanimated';
import { useSettingsStore } from '@/stores/settings-store';
import { kmhToMph } from '@/services/speed-calculator';
import { ThemedText } from '@/components/themed-text';

interface DigitalSpeedometerProps {
  speed: number; // Current speed in km/h
  size?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_SIZE = Math.min(SCREEN_WIDTH - 40, 340);

export function DigitalSpeedometer({
  speed,
  size = DEFAULT_SIZE,
}: DigitalSpeedometerProps) {
  const { unit, maxSpeedScale } = useSettingsStore();

  // Convert speed to display unit
  const displaySpeed = unit === 'mph' ? kmhToMph(speed) : speed;
  const speedRatio = Math.min(displaySpeed / maxSpeedScale, 1);

  // Animated color based on speed
  const colorProgress = useSharedValue(0);

  useDerivedValue(() => {
    colorProgress.value = withTiming(speedRatio, { duration: 300 });
  }, [speedRatio]);

  const animatedSpeedStyle = useAnimatedStyle(() => {
    // Green -> Yellow -> Orange -> Red as speed increases
    const color = interpolateColor(
      colorProgress.value,
      [0, 0.4, 0.7, 1],
      ['#22c55e', '#eab308', '#f97316', '#ef4444']
    );

    return {
      color,
    };
  });

  // Format speed with leading zeros for consistent width
  const formattedSpeed = Math.round(displaySpeed).toString().padStart(3, ' ');

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer ring */}
      <View style={[styles.outerRing, { width: size, height: size, borderRadius: size / 2 }]}>
        {/* Progress ring */}
        <View
          style={[
            styles.progressRing,
            {
              width: size - 16,
              height: size - 16,
              borderRadius: (size - 16) / 2,
            },
          ]}
        >
          {/* Inner dark circle */}
          <View
            style={[
              styles.innerCircle,
              {
                width: size - 32,
                height: size - 32,
                borderRadius: (size - 32) / 2,
              },
            ]}
          >
            {/* Speed display */}
            <View style={styles.speedContainer}>
              <Animated.Text
                style={[
                  styles.speedText,
                  { fontSize: size * 0.28 },
                  animatedSpeedStyle,
                ]}
              >
                {formattedSpeed.trim()}
              </Animated.Text>
              <ThemedText style={styles.unitText}>
                {unit === 'kmh' ? 'km/h' : 'mph'}
              </ThemedText>
            </View>

            {/* Speed bar indicator */}
            <View style={styles.speedBarContainer}>
              <View style={styles.speedBarBackground}>
                <Animated.View
                  style={[
                    styles.speedBarFill,
                    {
                      width: `${speedRatio * 100}%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.speedBarLabels}>
                <ThemedText style={styles.speedBarLabel}>0</ThemedText>
                <ThemedText style={styles.speedBarLabel}>
                  {Math.round(maxSpeedScale / 2)}
                </ThemedText>
                <ThemedText style={styles.speedBarLabel}>{maxSpeedScale}</ThemedText>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  progressRing: {
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#3f3f46',
  },
  innerCircle: {
    backgroundColor: '#0f0f12',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  speedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  speedText: {
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: -2,
    includeFontPadding: false,
  },
  unitText: {
    fontSize: 18,
    color: '#71717a',
    fontWeight: '500',
    marginTop: -5,
  },
  speedBarContainer: {
    width: '70%',
    alignItems: 'center',
  },
  speedBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#27272a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  speedBarFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  speedBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
  speedBarLabel: {
    fontSize: 10,
    color: '#52525b',
  },
});
