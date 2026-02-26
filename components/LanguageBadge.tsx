import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  flag: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
}

export function LanguageBadge({ flag, label, sublabel, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} disabled={!onPress}>
      <Text style={styles.flag}>{flag}</Text>
      <View>
        <Text style={styles.label}>{label}</Text>
        {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
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
  flag: {
    fontSize: 22,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  sublabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
});
