import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  flag: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  locked?: boolean;
  autoDetected?: boolean;
}

export function LanguageBadge({ flag, label, sublabel, onPress, locked, autoDetected }: Props) {
  return (
    <TouchableOpacity
      style={[styles.container, locked && styles.containerLocked]}
      onPress={onPress}
      disabled={locked || !onPress}
    >
      <View style={styles.flagContainer}>
        <Text style={styles.flag}>{flag}</Text>
        {locked && <Text style={styles.lockIcon}>🔒</Text>}
      </View>
      <View>
        <Text style={[styles.label, locked && styles.labelLocked]}>{label}</Text>
        {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
        {autoDetected && <Text style={styles.autoDetected}>Auto-detected</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  containerLocked: {
    opacity: 0.8,
    borderColor: Colors.textMuted,
  },
  flagContainer: {
    position: 'relative',
  },
  flag: {
    fontSize: 22,
  },
  lockIcon: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    fontSize: 12,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 6,
    overflow: 'hidden',
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  labelLocked: {
    color: Colors.textSecondary,
  },
  sublabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  autoDetected: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    fontStyle: 'italic',
  },
});
