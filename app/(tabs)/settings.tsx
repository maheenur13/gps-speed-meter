/**
 * Settings Screen
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useSettingsStore } from '@/stores/settings-store';
import { exportTripsAsCSV, exportTripsAsJSON } from '@/utils/export';
import type { SpeedUnit, SpeedometerMode } from '@/types';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const settings = useSettingsStore();

  const handleUnitChange = (unit: SpeedUnit) => {
    settings.setUnit(unit);
  };

  const handleSpeedometerModeChange = (mode: SpeedometerMode) => {
    settings.setSpeedometerMode(mode);
  };

  const handleExport = (format: 'csv' | 'json') => {
    Alert.alert(
      'Export Trips',
      `Export all trips as ${format.toUpperCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            try {
              if (format === 'csv') {
                await exportTripsAsCSV();
              } else {
                await exportTripsAsJSON();
              }
            } catch (error) {
              Alert.alert('Export Failed', 'Unable to export trips. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => settings.resetSettings(),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Settings</ThemedText>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Units Section */}
        <SettingsSection title="Units">
          <SettingsRow label="Speed Unit">
            <SegmentedControl
              options={[
                { label: 'km/h', value: 'kmh' },
                { label: 'mph', value: 'mph' },
              ]}
              selectedValue={settings.unit}
              onChange={(value) => handleUnitChange(value as SpeedUnit)}
            />
          </SettingsRow>
        </SettingsSection>

        {/* Display Section */}
        <SettingsSection title="Display">
          <SettingsRow label="Speedometer Style">
            <SegmentedControl
              options={[
                { label: 'Analog', value: 'analog' },
                { label: 'Digital', value: 'digital' },
              ]}
              selectedValue={settings.speedometerMode}
              onChange={(value) => handleSpeedometerModeChange(value as SpeedometerMode)}
            />
          </SettingsRow>
          <SettingsRow label="Keep Screen On">
            <Switch
              value={settings.keepScreenOn}
              onValueChange={settings.setKeepScreenOn}
              trackColor={{ false: '#3f3f46', true: '#22c55e' }}
              thumbColor="#fff"
            />
          </SettingsRow>
        </SettingsSection>

        {/* Tracking Section */}
        <SettingsSection title="Tracking">
          <SettingsRow label="Auto-Pause When Stationary">
            <Switch
              value={settings.autoPauseEnabled}
              onValueChange={settings.setAutoPause}
              trackColor={{ false: '#3f3f46', true: '#22c55e' }}
              thumbColor="#fff"
            />
          </SettingsRow>
          {settings.autoPauseEnabled && (
            <SettingsRow label="Pause Threshold">
              <ThemedText style={styles.thresholdValue}>
                {settings.autoPauseThreshold} {settings.unit === 'kmh' ? 'km/h' : 'mph'}
              </ThemedText>
            </SettingsRow>
          )}
        </SettingsSection>

        {/* Export Section */}
        <SettingsSection title="Data Export">
          <Pressable
            style={styles.exportButton}
            onPress={() => handleExport('csv')}
          >
            <ThemedText style={styles.exportButtonIcon}>📄</ThemedText>
            <View style={styles.exportButtonContent}>
              <ThemedText style={styles.exportButtonTitle}>Export as CSV</ThemedText>
              <ThemedText style={styles.exportButtonSubtitle}>
                Spreadsheet compatible format
              </ThemedText>
            </View>
          </Pressable>
          <Pressable
            style={styles.exportButton}
            onPress={() => handleExport('json')}
          >
            <ThemedText style={styles.exportButtonIcon}>📋</ThemedText>
            <View style={styles.exportButtonContent}>
              <ThemedText style={styles.exportButtonTitle}>Export as JSON</ThemedText>
              <ThemedText style={styles.exportButtonSubtitle}>
                Developer friendly format
              </ThemedText>
            </View>
          </Pressable>
        </SettingsSection>

        {/* Reset Section */}
        <SettingsSection title="Advanced">
          <Pressable
            style={styles.resetButton}
            onPress={handleResetSettings}
          >
            <ThemedText style={styles.resetButtonText}>Reset All Settings</ThemedText>
          </Pressable>
        </SettingsSection>

        {/* App Info */}
        <View style={styles.appInfo}>
          <ThemedText style={styles.appInfoText}>GPS Speed Meter v1.0.0</ThemedText>
          <ThemedText style={styles.appInfoSubtext}>
            Built with Expo + React Native
          </ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

// Settings Section Component
function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

// Settings Row Component
function SettingsRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      {children}
    </View>
  );
}

// Segmented Control Component
function SegmentedControl({
  options,
  selectedValue,
  onChange,
}: {
  options: { label: string; value: string }[];
  selectedValue: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.segmentedControl}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          style={[
            styles.segmentedOption,
            selectedValue === option.value && styles.segmentedOptionSelected,
          ]}
          onPress={() => onChange(option.value)}
        >
          <ThemedText
            style={[
              styles.segmentedOptionText,
              selectedValue === option.value && styles.segmentedOptionTextSelected,
            ]}
          >
            {option.label}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f12',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fafafa',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#18181b',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fafafa',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#27272a',
    borderRadius: 8,
    padding: 2,
  },
  segmentedOption: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentedOptionSelected: {
    backgroundColor: '#3f3f46',
  },
  segmentedOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#71717a',
  },
  segmentedOptionTextSelected: {
    color: '#fafafa',
  },
  thresholdValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#a1a1aa',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  exportButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  exportButtonContent: {
    flex: 1,
  },
  exportButtonTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fafafa',
  },
  exportButtonSubtitle: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  resetButton: {
    padding: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ef4444',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appInfoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#52525b',
  },
  appInfoSubtext: {
    fontSize: 12,
    color: '#3f3f46',
    marginTop: 4,
  },
});
