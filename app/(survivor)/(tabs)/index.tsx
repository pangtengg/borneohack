import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { detectCountry, CountryInfo } from '../../../lib/countryDetect';
import { useAppStore } from '../../../lib/store';
import { useAuth } from '../../../lib/auth/AuthContext';

const ACTIONS = [
  { id: 'report', icon: '📋', title: 'Report', desc: 'Make a report. Talk to AI, answer questions.', color: Colors.survivor, route: '/(survivor)/report' },
  { id: 'convo', icon: '💬', title: 'Convo', desc: 'Chat with officers. Voice & text translation.', color: Colors.info, route: '/(survivor)/convo' },
  { id: 'broadcast', icon: '📡', title: 'Broadcast', desc: 'Location-based emergency broadcasts.', color: Colors.relay, route: '/(survivor)/broadcast' },
];

export default function SurvivorHomeScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { detectedCountry, setDetectedCountry } = useAppStore();
  const [detecting, setDetecting] = useState(true);

  useEffect(() => {
    setDetecting(true);
    detectCountry().then((country) => {
      setDetectedCountry(country);
      setDetecting(false);
    });
  }, [setDetectedCountry]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth');
  };

  return (
    <View style={styles.container}>
      {/* Location Badge - Auto Detected */}
      <View style={styles.locationCard}>
        <Text style={styles.locationLabel}>📍 Your Location Detected</Text>
        {detecting ? (
          <View style={styles.detectingRow}>
            <ActivityIndicator size="small" color={Colors.accent} />
            <Text style={styles.detectingText}>Detecting...</Text>
          </View>
        ) : detectedCountry ? (
          <View style={styles.locationRow}>
            <Text style={styles.locationFlag}>{detectedCountry.flag}</Text>
            <View>
              <Text style={styles.locationName}>{detectedCountry.name}</Text>
              <Text style={styles.locationLang}>
                Language: {detectedCountry.langFlag} {detectedCountry.langLabel}
              </Text>
            </View>
            {detectedCountry.status === 'cached' && (
              <Text style={styles.cachedBadge}>📶 Cached</Text>
            )}
          </View>
        ) : (
          <Text style={styles.locationError}>Unable to detect location</Text>
        )}
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Disaster Voice Bridge</Text>
        <Text style={styles.heroSubtitle}>
          Choose an action below to communicate during emergencies
        </Text>
      </View>

      <View style={styles.actions}>
        {ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionCard, { borderColor: action.color }]}
            onPress={() => router.push(action.route as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBg, { backgroundColor: `${action.color}22` }]}>
              <Text style={styles.actionIcon}>{action.icon}</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: action.color }]}>{action.title}</Text>
              <Text style={styles.actionDesc}>{action.desc}</Text>
            </View>
            <Text style={[styles.actionArrow, { color: action.color }]}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sdgRow}>
        <Text style={styles.sdgText}>SDG 11 · SDG 10 · SDG 17</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  // Location Card
  locationCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 20,
  },
  locationLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  detectingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detectingText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationFlag: {
    fontSize: 32,
  },
  locationName: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  locationLang: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  cachedBadge: {
    marginLeft: 'auto',
    backgroundColor: `${Colors.accent}22`,
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  locationError: {
    color: Colors.danger,
    fontSize: 14,
  },
  hero: {
    marginBottom: 24,
    gap: 8,
  },
  heroTitle: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    gap: 14,
    flex: 1,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 18,
    gap: 16,
  },
  actionIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: { fontSize: 28 },
  actionContent: { flex: 1, gap: 4 },
  actionTitle: { fontSize: 18, fontWeight: '700' },
  actionDesc: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  actionArrow: { fontSize: 28, fontWeight: '300' },
  sdgRow: { alignItems: 'center', paddingTop: 20 },
  sdgText: { color: Colors.textMuted, fontSize: 12, letterSpacing: 1 },
});
