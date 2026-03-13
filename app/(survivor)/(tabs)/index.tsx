import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { useT } from '@/lib/i18n';

export default function SurvivorHomeScreen() {
  const router = useRouter();
  const t = useT();

  const ACTIONS = [
    { id: 'report', icon: '📋', title: t('home.report'), desc: t('home.report.desc'), color: Colors.survivor, route: '/(survivor)/report' },
    { id: 'convo', icon: '💬', title: t('home.convo'), desc: t('home.convo.desc'), color: Colors.info, route: '/(survivor)/convo' },
    { id: 'broadcast', icon: '📡', title: t('home.broadcast'), desc: t('home.broadcast.desc'), color: Colors.relay, route: '/(survivor)/broadcast' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{t('home.title')}</Text>
        <Text style={styles.heroSubtitle}>{t('home.subtitle')}</Text>
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
