/**
 * GPS status indicator component
 */

import { ThemedText } from '@/components/themed-text';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface GpsStatusIndicatorProps {
  status: 'searching' | 'acquired' | 'lost';
  accuracy: number | null;
}

export function GpsStatusIndicator({ status, accuracy }: GpsStatusIndicatorProps) {
  const pulseOpacity = useSharedValue(1);
  console.log({ status });

  useDerivedValue(() => {
    if (status === 'searching') {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );
    } else {
      pulseOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [status]);

  const animatedDotStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const getStatusColor = () => {
    switch (status) {
      case 'acquired':
        return '#22c55e';
      case 'lost':
        return '#ef4444';
      case 'searching':
      default:
        return '#f59e0b';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'acquired':
        return accuracy ? `GPS ±${Math.round(accuracy)}m` : 'GPS Active';
      case 'lost':
        return 'GPS Lost';
      case 'searching':
      default:
        return 'Searching GPS...';
    }
  };

  const getAccuracyBars = () => {
    if (!accuracy) return 0;
    if (accuracy <= 5) return 4;
    if (accuracy <= 10) return 3;
    if (accuracy <= 25) return 2;
    return 1;
  };

  const bars = getAccuracyBars();

  return (
    <View style={styles.container}>
      {/* Status dot */}
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: getStatusColor() },
          animatedDotStyle,
        ]}
      />

      {/* Status text */}
      <ThemedText style={styles.text}>{getStatusText()}</ThemedText>

      {/* Accuracy bars */}
      {status === 'acquired' && (
        <View style={styles.barsContainer}>
          {[1, 2, 3, 4].map((barIndex) => (
            <View
              key={barIndex}
              style={[
                styles.bar,
                {
                  height: 4 + barIndex * 3,
                  backgroundColor: barIndex <= bars ? '#22c55e' : '#3f3f46',
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    color: '#a1a1aa',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginLeft: 4,
  },
  bar: {
    width: 3,
    borderRadius: 1,
  },
});
