import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';
import { useAppStore } from '../../lib/store';

export default function SettingsScreen() {
  const {
    myLanguage,
    myLanguageLabel,
    myLanguageFlag,
    detectedLanguage,
    setMyLanguage,
    serverUrl,
    setServerUrl,
  } = useAppStore();


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
              style={[
                styles.langOption,
                myLanguage === lang.code && styles.langOptionActive,
              ]}
              onPress={() => setMyLanguage(lang.code, lang.label, lang.flag)}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text
                style={[
                  styles.langLabel,
                  myLanguage === lang.code && { color: Colors.accent },
                ]}
              >
                {lang.label}
              </Text>
              {myLanguage === lang.code && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Detected language info */}
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
        <Text style={styles.sectionDesc}>
          Point to your local or deployed Express server.
        </Text>
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

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABOUT VOICEBRIDGE</Text>
        <Text style={styles.aboutText}>
          VoiceBridge is a stress-adaptive, location-aware multilingual communication
          tool for disaster response in Southeast Asia. Built for BorneoHack.
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
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  sectionDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
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
  langOptionActive: {
    borderColor: Colors.accent,
    backgroundColor: `${Colors.accent}11`,
  },
  langFlag: { fontSize: 24 },
  langLabel: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
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
  aboutText: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
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
});
