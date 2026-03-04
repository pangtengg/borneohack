import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { LanguageBadge } from '../../components/LanguageBadge';
import { detectLanguageFromCoords, DetectedLanguage } from '../../lib/languageMap';
import { useAppStore } from '../../lib/store';

const MODES = [
  {
    id: 'survivor',
    icon: '🆘',
    title: 'Survivor',
    description: 'I need help. Speak and be understood instantly.',
    color: Colors.survivor,
    route: '/bridge?mode=survivor',
  },
  {
    id: 'rescuer',
    icon: '🦺',
    title: 'Rescuer',
    description: 'I am helping others. Two-way translation bridge.',
    color: Colors.rescuer,
    route: '/bridge?mode=rescuer',
  },
  {
    id: 'relay',
    icon: '📡',
    title: 'Relay Volunteer',
    description: 'Bridge communication across an evacuation zone.',
    color: Colors.relay,
    route: '/bridge?mode=relay',
  },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { setDetectedLanguage } = useAppStore();
  const [detected, setDetected] = useState<DetectedLanguage | null>(null);
  const [locating, setLocating] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          const fallback: DetectedLanguage = { lang: 'en', label: 'English', flag: '🌐', region: 'Unknown' };
          setDetected(fallback);
          setDetectedLanguage(fallback);
          setLocating(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const lang = detectLanguageFromCoords(loc.coords.latitude, loc.coords.longitude);
        setDetected(lang);
        setDetectedLanguage(lang);
      } catch {
        const fallback: DetectedLanguage = { lang: 'en', label: 'English', flag: '🌐', region: 'Unknown' };
        setDetected(fallback);
        setDetectedLanguage(fallback);
      } finally {
        setLocating(false);
      }
    })();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Location header */}
      <View style={styles.locationRow}>
        <Text style={styles.locationLabel}>Local language detected:</Text>
        {locating ? (
          <View style={styles.locatingRow}>
            <ActivityIndicator color={Colors.accent} size="small" />
            <Text style={styles.locatingText}>Detecting location...</Text>
          </View>
        ) : detected ? (
          <LanguageBadge
            flag={detected.flag}
            label={detected.label}
            sublabel={detected.region}
          />
        ) : null}
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Disaster{'\n'}Voice Bridge</Text>
        <Text style={styles.heroSubtitle}>
          Real-time multilingual communication{'\n'}for emergency responders in Southeast Asia
        </Text>
      </View>

      {/* Mode cards */}
      <Text style={styles.sectionLabel}>SELECT YOUR ROLE</Text>
      <View style={styles.modes}>
        {MODES.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            style={[styles.modeCard, { borderColor: mode.color }]}
            onPress={() => router.push(mode.route as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.modeIconBg, { backgroundColor: `${mode.color}22` }]}>
              <Text style={styles.modeIcon}>{mode.icon}</Text>
            </View>
            <View style={styles.modeContent}>
              <Text style={[styles.modeTitle, { color: mode.color }]}>{mode.title}</Text>
              <Text style={styles.modeDesc}>{mode.description}</Text>
            </View>
            <Text style={[styles.modeArrow, { color: mode.color }]}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick launch phrase bank */}
      <TouchableOpacity
        style={styles.phraseBankButton}
        onPress={() => router.push('/phrases')}
        activeOpacity={0.8}
      >
        <Text style={styles.phraseBankIcon}>⚡</Text>
        <View>
          <Text style={styles.phraseBankTitle}>Emergency Phrase Bank</Text>
          <Text style={styles.phraseBankSubtitle}>One-tap phrases — no speaking required</Text>
        </View>
        <Text style={styles.modeArrow}>›</Text>
      </TouchableOpacity>

      {/* SDG tag */}
      <View style={styles.sdgRow}>
        <Text style={styles.sdgText}>SDG 11 · SDG 10 · SDG 17</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  locationRow: {
    gap: 8,
  },
  locationLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  locatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locatingText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  hero: {
    paddingVertical: 8,
    gap: 10,
  },
  heroTitle: {
    color: Colors.textPrimary,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 44,
  },
  heroSubtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  modes: {
    gap: 12,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 14,
  },
  modeIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIcon: {
    fontSize: 28,
  },
  modeContent: {
    flex: 1,
    gap: 4,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modeDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  modeArrow: {
    color: Colors.textMuted,
    fontSize: 28,
    fontWeight: '300',
  },
  phraseBankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    padding: 16,
    gap: 14,
  },
  phraseBankIcon: {
    fontSize: 28,
  },
  phraseBankTitle: {
    color: Colors.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  phraseBankSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  sdgRow: {
    alignItems: 'center',
    paddingTop: 8,
  },
  sdgText: {
    color: Colors.textMuted,
    fontSize: 12,
    letterSpacing: 1,
  },
});
