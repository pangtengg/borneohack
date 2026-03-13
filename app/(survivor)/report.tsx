import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { PhraseBankGrid } from '../../components/PhraseBankGrid';
import { EMERGENCY_PHRASES, Phrase } from '../../constants/phrases';
import { translatePhrase } from '../../lib/api';
import { playBase64Audio } from '../../lib/audioPlayer';
import { useAppStore } from '../../lib/store';
import { createReport, updateLocation } from '../../lib/supabase';
import { useAuth } from '../../lib/auth/AuthContext';

export default function ReportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { targetLanguage, detectedCountry } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
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

      // Automatically submit report based on phrase
      if (user) {
        setIsSubmitting(true);
        const { error } = await createReport({
          user_id: user.id,
          category: phrase.category === 'children' ? 'vulnerable' : phrase.category,
          description: `Emergency phrase triggered: ${phrase.text}`,
          urgency: phrase.urgency || 5,
          original_language: targetLanguage || 'en',
          latitude: detectedCountry?.latitude,
          longitude: detectedCountry?.longitude,
          location_address: detectedCountry?.region || detectedCountry?.name,
        });
        setIsSubmitting(false);
        if (error) {
          Alert.alert('Error', error.message || 'Failed to submit report. Please try again.');
          console.error('Report submission error:', error);
        } else {
          Alert.alert('Success', 'Report successfully sent to authorities.');
        }
      }
    } catch {
      setPhraseLoadingKey(null);
      setIsSubmitting(false);
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
