/**
 * Zustand store for user settings
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Settings, SpeedUnit, SpeedometerMode } from '@/types';
import { DEFAULT_SETTINGS, SPEED_SCALES } from '@/constants/config';

interface SettingsState extends Settings {
  // Actions
  setUnit: (unit: SpeedUnit) => void;
  setSpeedometerMode: (mode: SpeedometerMode) => void;
  setMaxSpeedScale: (maxSpeed: number) => void;
  setAutoPause: (enabled: boolean) => void;
  setAutoPauseThreshold: (threshold: number) => void;
  setKeepScreenOn: (enabled: boolean) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial state from defaults
      ...DEFAULT_SETTINGS,

      // Actions
      setUnit: (unit) =>
        set({
          unit,
          maxSpeedScale: SPEED_SCALES[unit].max,
        }),

      setSpeedometerMode: (speedometerMode) =>
        set({ speedometerMode }),

      setMaxSpeedScale: (maxSpeedScale) =>
        set({ maxSpeedScale }),

      setAutoPause: (autoPauseEnabled) =>
        set({ autoPauseEnabled }),

      setAutoPauseThreshold: (autoPauseThreshold) =>
        set({ autoPauseThreshold }),

      setKeepScreenOn: (keepScreenOn) =>
        set({ keepScreenOn }),

      resetSettings: () =>
        set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: 'gps-speed-meter-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
