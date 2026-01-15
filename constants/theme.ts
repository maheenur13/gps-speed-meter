/**
 * Theme constants for GPS Speed Meter
 * Dark-mode focused design with green accent
 */

import { Platform } from 'react-native';

// Brand colors
export const Brand = {
  primary: '#22c55e',      // Green - primary accent
  primaryDark: '#16a34a',  // Darker green
  secondary: '#3b82f6',    // Blue - secondary actions
  danger: '#ef4444',       // Red - stop/delete
  warning: '#f59e0b',      // Orange - pause/caution
  success: '#22c55e',      // Green - same as primary
};

// Dark theme colors (main theme)
export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#687076',
    background: '#ffffff',
    backgroundSecondary: '#f4f4f5',
    tint: Brand.primary,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: Brand.primary,
    border: '#e4e4e7',
  },
  dark: {
    text: '#fafafa',
    textSecondary: '#a1a1aa',
    background: '#0f0f12',
    backgroundSecondary: '#18181b',
    tint: Brand.primary,
    icon: '#71717a',
    tabIconDefault: '#71717a',
    tabIconSelected: Brand.primary,
    border: '#27272a',
  },
};

// Grayscale palette for dark mode
export const Gray = {
  50: '#fafafa',
  100: '#f4f4f5',
  200: '#e4e4e7',
  300: '#d4d4d8',
  400: '#a1a1aa',
  500: '#71717a',
  600: '#52525b',
  700: '#3f3f46',
  800: '#27272a',
  900: '#18181b',
  950: '#0f0f12',
};

// Font families
export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Spacing scale
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius scale
export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};
