// app/(survivor)/(tabs)/settings.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { useAppStore } from '../../../lib/store';
import { saveEnabledDialectNames } from '../../../lib/dialectStorage';
import { useAuth } from '../../../lib/auth/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const {
    detectedLanguage,
    ghostEnabled,
    dialectEnabled,
    setGhostEnabled,
    setDialectEnabled,
    installedGhostPacks,
    installedGlossaries,
    enabledDialectNames,
    toggleDialectEnabled,
  } = useAppStore();

  const [dialectDropdownOpen, setDialectDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth' as any);
          },
        },
      ]
    );
  };

  const handleToggleDialect = async (dialectName: string) => {
    toggleDialectEnabled(dialectName);
    const next = enabledDialectNames.includes(dialectName)
      ? enabledDialectNames.filter((n) => n !== dialectName)
      : [...enabledDialectNames, dialectName];
    await saveEnabledDialectNames(next);
  };

  const allDialects = Array.from(
    new Set([
      ...installedGhostPacks.map((p) => p.dialect),
      ...installedGlossaries.map((g) => g.dialect),
    ])
  ).sort();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Detected language */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AUTO-DETECTED LOCAL LANGUAGE</Text>
        {detectedLanguage ? (
          <View style={styles.detectedCard}>
            <Text style={styles.detectedFlag}>{detectedLanguage.flag}</Text>
            <View>
              <Text style={styles.detectedLabel}>{detectedLanguage.label}</Text>
              <Text style={styles.detectedRegion}>{detectedLanguage.region}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.sectionDesc}>No location detected yet. Go to Home to detect.</Text>
        )}
      </View>

      {/* Dialect Bank - unified */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DIALECT BANK</Text>
        <Text style={styles.sectionDesc}>
          Choose dialects for STT in Report, Convo, and Broadcast. Each dialect includes its phrase bank.
        </Text>

        <View style={[styles.explainerCard, { borderColor: Colors.info }]}>
          <Text style={[styles.explainerTitle, { color: Colors.info }]}>🗣️ Dialects</Text>
          <Text style={styles.explainerBody}>
            Each dialect has a phrase bank (audio) and glossary (text patching). Enable dialects for Report, Convo, and Broadcast.
          </Text>
        </View>

        {/* Single dialect toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Enable dialect processing</Text>
          <Switch
            value={dialectEnabled || ghostEnabled}
            onValueChange={(v) => {
              setDialectEnabled(v);
              setGhostEnabled(v);
            }}
            trackColor={{ false: Colors.surfaceElevated, true: Colors.info }}
            thumbColor="#fff"
          />
        </View>

        {/* Dialect dropdown with checkboxes */}
        <Pressable
          style={styles.dropdown}
          onPress={() => setDialectDropdownOpen(!dialectDropdownOpen)}
        >
          <Text style={styles.dropdownLabel}>
            {allDialects.length} dialect(s) · {enabledDialectNames.length} selected
          </Text>
          <Text style={styles.dropdownChevron}>{dialectDropdownOpen ? '▲' : '▼'}</Text>
        </Pressable>
        {dialectDropdownOpen && (
          <View style={styles.dialectList}>
            {allDialects.map((dialectName) => {
              const ghostPack = installedGhostPacks.find((p) => p.dialect === dialectName);
              const glossary = installedGlossaries.find((g) => g.dialect === dialectName);
              const ghostCount = ghostPack?.phrases.length ?? 0;
              const glossCount = glossary?.entries.length ?? 0;
              const isEnabled = enabledDialectNames.includes(dialectName);
              return (
                <TouchableOpacity
                  key={dialectName}
                  style={styles.dialectItem}
                  onPress={() => handleToggleDialect(dialectName)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dialectCheckRow}>
                    <View style={[styles.checkbox, isEnabled && styles.checkboxChecked]}>
                      {isEnabled && <Text style={styles.checkboxTick}>✓</Text>}
                    </View>
                    <Text style={styles.dialectName}>{dialectName}</Text>
                  </View>
                  <Text style={styles.dialectMeta}>
                    {ghostCount} phrases · {glossCount} glossary entries
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABOUT VOICEBRIDGE</Text>
        <Text style={styles.aboutText}>
          VoiceBridge is a stress-adaptive, location-aware multilingual communication tool for disaster
          response in Southeast Asia. Built for BorneoHack.
        </Text>
        <View style={styles.sdgRow}>
          {['SDG 11', 'SDG 10', 'SDG 17'].map((sdg) => (
            <View key={sdg} style={styles.sdgBadge}>
              <Text style={styles.sdgText}>{sdg}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, gap: 24, paddingBottom: 40 },
  section: { gap: 12 },
  sectionTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  sectionDesc: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  dropdownFlag: { fontSize: 24 },
  dropdownLabel: { flex: 1, color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  dropdownChevron: { color: Colors.textMuted, fontSize: 14 },
  dropdownList: { marginTop: 4, gap: 4 },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    gap: 10,
  },
  dropdownItemActive: { borderColor: Colors.accent, backgroundColor: `${Colors.accent}11` },
  dropdownItemFlag: { fontSize: 20 },
  dropdownItemLabel: { flex: 1, color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  checkmark: { color: Colors.accent, fontSize: 16, fontWeight: '700' },
  detectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
  },
  detectedFlag: { fontSize: 32 },
  detectedLabel: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  detectedRegion: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  urlInput: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginTop: 8,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    gap: 12,
  },
  linkIcon: { fontSize: 24 },
  linkContent: { flex: 1 },
  linkTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  linkDesc: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  linkArrow: { color: Colors.textMuted, fontSize: 24 },
  explainerCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  explainerTitle: { fontSize: 16, fontWeight: '700' },
  explainerBody: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  toggleLabel: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  dialectList: { marginTop: 4, gap: 8 },
  dialectItem: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
  },
  dialectCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { borderColor: Colors.accent, backgroundColor: Colors.accent },
  checkboxTick: { color: Colors.background, fontSize: 14, fontWeight: '700' },
  dialectName: { flex: 1, color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  dialectMeta: { color: Colors.textMuted, fontSize: 12, marginTop: 6, marginLeft: 36 },
  aboutText: { color: Colors.textSecondary, fontSize: 14, lineHeight: 22 },
  sdgRow: { flexDirection: 'row', gap: 8 },
  sdgBadge: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sdgText: { color: Colors.accent, fontSize: 12, fontWeight: '700' },
  signOutButton: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutText: { color: Colors.danger, fontSize: 16, fontWeight: '700' },
});
