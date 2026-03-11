import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';

export default function BroadcastScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderTitle}>📡 Broadcasts</Text>
        <Text style={styles.placeholderDesc}>
          Location-based emergency broadcasts. Translated to your preferred language.
        </Text>
        <Text style={styles.placeholderHint}>Coming soon. Broadcasts will appear here based on your GPS location.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  placeholder: {
    padding: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 8,
  },
  placeholderTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700' },
  placeholderDesc: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  placeholderHint: { color: Colors.textMuted, fontSize: 12, marginTop: 8 },
});
