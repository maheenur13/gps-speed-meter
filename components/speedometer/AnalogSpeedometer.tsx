/**
 * Classic analog speedometer with SVG gauge and animated needle
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Circle,
  Path,
  Text as SvgText,
  G,
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
  useDerivedValue,
} from 'react-native-reanimated';
import { useSettingsStore } from '@/stores/settings-store';
import { SPEED_SCALES, UI_CONFIG } from '@/constants/config';
import { kmhToMph } from '@/services/speed-calculator';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface AnalogSpeedometerProps {
  speed: number; // Current speed in km/h
  size?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_SIZE = Math.min(SCREEN_WIDTH - 40, 340);

export function AnalogSpeedometer({
  speed,
  size = DEFAULT_SIZE,
}: AnalogSpeedometerProps) {
  const { unit, maxSpeedScale } = useSettingsStore();
  const scale = SPEED_SCALES[unit];

  // Convert speed to display unit
  const displaySpeed = unit === 'mph' ? kmhToMph(speed) : speed;
  
  // Gauge dimensions
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.38;
  const innerRadius = radius * 0.85;
  
  // Angle range: -135° to 135° (270° total arc)
  const startAngle = -225;
  const endAngle = 45;
  const angleRange = endAngle - startAngle;

  // Animated needle rotation
  const needleRotation = useSharedValue(startAngle);

  useDerivedValue(() => {
    const clampedSpeed = Math.min(Math.max(displaySpeed, 0), maxSpeedScale);
    const speedRatio = clampedSpeed / maxSpeedScale;
    const targetAngle = startAngle + speedRatio * angleRange;
    
    needleRotation.value = withSpring(targetAngle, UI_CONFIG.needleSpring);
  }, [displaySpeed, maxSpeedScale]);

  // Needle path
  const needleLength = radius * 0.75;
  const needleBaseWidth = 8;

  const animatedNeedleProps = useAnimatedProps(() => {
    const angle = (needleRotation.value * Math.PI) / 180;
    const tipX = centerX + Math.cos(angle) * needleLength;
    const tipY = centerY + Math.sin(angle) * needleLength;
    
    // Base points perpendicular to needle direction
    const perpAngle = angle + Math.PI / 2;
    const baseX1 = centerX + Math.cos(perpAngle) * needleBaseWidth;
    const baseY1 = centerY + Math.sin(perpAngle) * needleBaseWidth;
    const baseX2 = centerX - Math.cos(perpAngle) * needleBaseWidth;
    const baseY2 = centerY - Math.sin(perpAngle) * needleBaseWidth;
    
    // Tail point (opposite direction)
    const tailX = centerX - Math.cos(angle) * 15;
    const tailY = centerY - Math.sin(angle) * 15;

    return {
      d: `M ${tipX} ${tipY} L ${baseX1} ${baseY1} L ${tailX} ${tailY} L ${baseX2} ${baseY2} Z`,
    };
  });

  // Generate tick marks
  const generateTicks = () => {
    const ticks: React.ReactNode[] = [];
    const majorTicks = scale.majorTicks;
    
    majorTicks.forEach((value, index) => {
      const ratio = value / scale.max;
      const angle = ((startAngle + ratio * angleRange) * Math.PI) / 180;
      
      // Major tick
      const outerX = centerX + Math.cos(angle) * radius;
      const outerY = centerY + Math.sin(angle) * radius;
      const innerX = centerX + Math.cos(angle) * (radius - 15);
      const innerY = centerY + Math.sin(angle) * (radius - 15);
      
      ticks.push(
        <Path
          key={`major-${index}`}
          d={`M ${outerX} ${outerY} L ${innerX} ${innerY}`}
          stroke="#d4d4d8"
          strokeWidth={3}
          strokeLinecap="round"
        />
      );

      // Speed label
      const labelRadius = radius - 30;
      const labelX = centerX + Math.cos(angle) * labelRadius;
      const labelY = centerY + Math.sin(angle) * labelRadius;
      
      ticks.push(
        <SvgText
          key={`label-${index}`}
          x={labelX}
          y={labelY}
          fill="#e4e4e7"
          fontSize={size * 0.045}
          fontWeight="600"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {value}
        </SvgText>
      );

      // Minor ticks between major ticks
      if (index < majorTicks.length - 1) {
        const nextValue = majorTicks[index + 1];
        const step = (nextValue - value) / (scale.minorTickCount + 1);
        
        for (let i = 1; i <= scale.minorTickCount; i++) {
          const minorValue = value + step * i;
          const minorRatio = minorValue / scale.max;
          const minorAngle = ((startAngle + minorRatio * angleRange) * Math.PI) / 180;
          
          const minorOuterX = centerX + Math.cos(minorAngle) * radius;
          const minorOuterY = centerY + Math.sin(minorAngle) * radius;
          const minorInnerX = centerX + Math.cos(minorAngle) * (radius - 8);
          const minorInnerY = centerY + Math.sin(minorAngle) * (radius - 8);
          
          ticks.push(
            <Path
              key={`minor-${index}-${i}`}
              d={`M ${minorOuterX} ${minorOuterY} L ${minorInnerX} ${minorInnerY}`}
              stroke="#71717a"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          );
        }
      }
    });

    return ticks;
  };

  // Arc path for gauge background
  const arcPath = () => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + Math.cos(startRad) * radius;
    const y1 = centerY + Math.sin(startRad) * radius;
    const x2 = centerX + Math.cos(endRad) * radius;
    const y2 = centerY + Math.sin(endRad) * radius;
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 1 1 ${x2} ${y2}`;
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {/* Bezel gradient */}
          <LinearGradient id="bezelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#52525b" />
            <Stop offset="50%" stopColor="#3f3f46" />
            <Stop offset="100%" stopColor="#27272a" />
          </LinearGradient>
          
          {/* Dial face gradient */}
          <LinearGradient id="dialGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#1f1f23" />
            <Stop offset="100%" stopColor="#0f0f12" />
          </LinearGradient>
          
          {/* Needle gradient */}
          <LinearGradient id="needleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#ef4444" />
            <Stop offset="100%" stopColor="#dc2626" />
          </LinearGradient>
        </Defs>

        {/* Outer bezel */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={size * 0.47}
          fill="url(#bezelGradient)"
        />
        
        {/* Inner ring */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={size * 0.44}
          fill="#18181b"
          stroke="#3f3f46"
          strokeWidth={2}
        />

        {/* Dial face */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={size * 0.42}
          fill="url(#dialGradient)"
        />

        {/* Speed arc background */}
        <Path
          d={arcPath()}
          stroke="#27272a"
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
        />

        {/* Tick marks and labels */}
        <G>{generateTicks()}</G>

        {/* Needle */}
        <AnimatedPath
          animatedProps={animatedNeedleProps}
          fill="url(#needleGradient)"
        />

        {/* Center cap */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={15}
          fill="#27272a"
          stroke="#3f3f46"
          strokeWidth={2}
        />
        <Circle
          cx={centerX}
          cy={centerY}
          r={8}
          fill="#ef4444"
        />

        {/* Digital readout background */}
        <Rect
          x={centerX - 45}
          y={centerY + radius * 0.35}
          width={90}
          height={35}
          rx={6}
          fill="#0a0a0c"
          stroke="#27272a"
          strokeWidth={1}
        />

        {/* Current speed digital display */}
        <SvgText
          x={centerX}
          y={centerY + radius * 0.35 + 24}
          fill="#22c55e"
          fontSize={22}
          fontWeight="700"
          fontFamily="monospace"
          textAnchor="middle"
        >
          {Math.round(displaySpeed)}
        </SvgText>

        {/* Unit label */}
        <SvgText
          x={centerX}
          y={centerY + radius * 0.65}
          fill="#71717a"
          fontSize={14}
          fontWeight="500"
          textAnchor="middle"
        >
          {unit === 'kmh' ? 'km/h' : 'mph'}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
