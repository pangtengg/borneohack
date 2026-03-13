import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { SUPPORTED_LANGUAGES } from '../../../constants/languages';
import { useAppStore } from '../../../lib/store';
import { saveGhostEnabled, saveDialectEnabled } from '../../../lib/dialectStorage';
import { useAuth } from '../../../lib/auth/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const {
    myLanguage,
    myLanguageLabel,
    myLanguageFlag,
    detectedLanguage,
    setMyLanguage,
    serverUrl,
    setServerUrl,
    ghostEnabled,
    dialectEnabled,
    installedGhostPacks,
    installedGlossaries,
  } = useAppStore();

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
            router.replace('/auth');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* My language */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MY LANGUAGE</Text>
        <Text style={styles.sectionDesc}>
          The language you speak. Voice output will be translated into this language.
        </Text>
        <View style={styles.langGrid}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langOption, myLanguage === lang.code && styles.langOptionActive]}
              onPress={() => setMyLanguage(lang.code, lang.label, lang.flag)}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text style={[styles.langLabel, myLanguage === lang.code && { color: Colors.accent }]}>{lang.label}</Text>
              {myLanguage === lang.code && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </View>

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

      {/* Backend URL */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BACKEND SERVER URL</Text>
        <Text style={styles.sectionDesc}>Point to your local or deployed Express server.</Text>
        <TextInput
          style={styles.input}
          value={serverUrl}
          onChangeText={setServerUrl}
          placeholder="http://192.168.x.x:3001"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Profile shortcut */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.linkCard} onPress={() => router.push('/(survivor)/(tabs)/profile' as any)}>
          <Text style={styles.linkIcon}>👤</Text>
          <View style={styles.linkContent}>
            <Text style={styles.linkTitle}>Profile</Text>
            <Text style={styles.linkDesc}>Manage your personal info and emergency contacts</Text>
          </View>
          <Text style={styles.linkArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Dialect section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DIALECT TOOLS</Text>
        <Text style={styles.sectionDesc}>Community-powered translation for local dialects</Text>

        <View style={[styles.explainerCard, { borderColor: '#7C3AED' }]}>
          <Text style={styles.explainerTitle}>👻 Ghost Interpreter</Text>
          <Text style={styles.explainerBody}>Acoustic matching for endangered & minority dialects. Toggle on to use.</Text>
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Ghost Interpreter Active</Text>
          <Switch
            value={ghostEnabled}
            onValueChange={saveGhostEnabled}
            trackColor={{ false: Colors.surfaceElevated, true: '#7C3AED' }}
            thumbColor="#fff"
          />
        </View>
        <Text style={styles.listHeader}>INSTALLED PACKS ({installedGhostPacks.length})</Text>
        {installedGhostPacks.map((pack) => (
          <View key={pack.packId} style={styles.packCard}>
            <Text style={styles.packDialect}>{pack.dialect}</Text>
            <Text style={styles.packRegion}>{pack.region} • {pack.phrases.length} phrases</Text>
          </View>
        ))}

        <View style={[styles.explainerCard, { borderColor: Colors.info }]}>
          <Text style={[styles.explainerTitle, { color: Colors.info }]}>📖 Dialect Glossary</Text>
          <Text style={styles.explainerBody}>Word-level patching for regional slang. Toggle on to use.</Text>
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Dialect Glossary Active</Text>
          <Switch
            value={dialectEnabled}
            onValueChange={saveDialectEnabled}
            trackColor={{ false: Colors.surfaceElevated, true: Colors.info }}
            thumbColor="#fff"
          />
        </View>
        <Text style={styles.listHeader}>INSTALLED GLOSSARIES ({installedGlossaries.length})</Text>
        {installedGlossaries.map((pack) => (
          <View key={pack.packId} style={[styles.packCard, { borderLeftColor: Colors.info }]}>
            <Text style={styles.packDialect}>{pack.dialect}</Text>
            <Text style={styles.packRegion}>{pack.region || 'General'} • {pack.entries.length} entries</Text>
          </View>
        ))}
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}> Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABOUT VOICEBRIDGE</Text>
        <Text style={styles.aboutText}>
          VoiceBridge is a stress-adaptive, location-aware multilingual communication tool for disaster response in Southeast Asia. Built for BorneoHack.
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
  langGrid: { gap: 8 },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
    gap: 12,
  },
  langOptionActive: { borderColor: Colors.accent, backgroundColor: `${Colors.accent}11` },
  langFlag: { fontSize: 24 },
  langLabel: { flex: 1, color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },
  checkmark: { color: Colors.accent, fontSize: 18, fontWeight: '700' },
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
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
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
  explainerTitle: { color: '#7C3AED', fontSize: 16, fontWeight: '700' },
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
  listHeader: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  packCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#7C3AED',
  },
  packDialect: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  packRegion: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
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
    borderColor: '#ff4444',
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '700',
  },
});
