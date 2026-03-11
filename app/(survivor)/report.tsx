import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { PhraseBankGrid } from '../../components/PhraseBankGrid';
import { EMERGENCY_PHRASES, Phrase } from '../../constants/phrases';
import { translatePhrase } from '../../lib/api';
import { playBase64Audio } from '../../lib/audioPlayer';
import { useAppStore } from '../../lib/store';

export default function ReportScreen() {
  const router = useRouter();
  const { targetLanguage } = useAppStore();
  const [phraseLoadingKey, setPhraseLoadingKey] = useState<string | null>(null);
  const [phrasePlayingKey, setPhrasePlayingKey] = useState<string | null>(null);

  const handlePlayPhrase = async (phrase: Phrase) => {
    if (phraseLoadingKey) return;
    setPhraseLoadingKey(phrase.key);
    setPhrasePlayingKey(null);
    try {
      const result = await translatePhrase({ phraseKey: phrase.key, phraseText: phrase.text, targetLang: targetLanguage });
      setPhrasePlayingKey(phrase.key);
      await playBase64Audio(result.audioBase64);
    } catch {
      setPhraseLoadingKey(null);
    } finally {
      setPhraseLoadingKey(null);
      setTimeout(() => setPhrasePlayingKey(null), 3000);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderTitle}>📋 Make a Report</Text>
        <Text style={styles.placeholderDesc}>
          AI voice flow coming soon. Answer standard questions to create a report.
        </Text>
        <Text style={styles.placeholderHint}>Use quick phrases below for now:</Text>
      </View>

      <ScrollView style={styles.phrasesSection} contentContainerStyle={styles.phrasesContent}>
        <PhraseBankGrid
          phrases={EMERGENCY_PHRASES}
          onPlayPhrase={handlePlayPhrase}
          isLoadingKey={phraseLoadingKey}
          isPlayingKey={phrasePlayingKey}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  placeholder: {
    padding: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  placeholderTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700' },
  placeholderDesc: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  placeholderHint: { color: Colors.textMuted, fontSize: 12, marginTop: 8 },
  phrasesSection: { flex: 1 },
  phrasesContent: { padding: 20, paddingBottom: 40 },
});
