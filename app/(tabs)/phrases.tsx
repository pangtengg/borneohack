import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { PhraseCard } from '../../components/PhraseCard';
import { EMERGENCY_PHRASES, PHRASE_CATEGORIES } from '../../constants/phrases';
import { translatePhrase } from '../../lib/api';
import { playBase64Audio } from '../../lib/audioPlayer';
import { useAppStore } from '../../lib/store';

export default function PhrasesScreen() {
  const { detectedLanguage, myLanguage } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<string>('medical');
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);

  const targetLang = detectedLanguage?.lang ?? 'ms';
  const targetLabel = detectedLanguage?.label ?? 'Malay';
  const targetFlag = detectedLanguage?.flag ?? '🇲🇾';

  const filtered = EMERGENCY_PHRASES.filter((p) => p.category === activeCategory);
  const activeCat = PHRASE_CATEGORIES.find((c) => c.id === activeCategory);

  const handlePhrasePress = async (phraseKey: string, phraseText: string) => {
    if (loadingKey) return;
    setLoadingKey(phraseKey);
    setPlayingKey(null);

    try {
      const result = await translatePhrase({ phraseKey, phraseText, targetLang });
      setPlayingKey(phraseKey);
      await playBase64Audio(result.audioBase64);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not play phrase. Check your connection.');
    } finally {
      setLoadingKey(null);
      // Keep playing indicator for a moment then clear
      setTimeout(() => setPlayingKey(null), 3000);
    }
  };

  return (
    <View style={styles.container}>
      {/* Target language bar */}
      <View style={styles.targetBar}>
        <Text style={styles.targetBarText}>
          Playing in:{' '}
          <Text style={styles.targetBarLang}>
            {targetFlag} {targetLabel}
          </Text>
          <Text style={styles.targetBarNote}> (auto-detected)</Text>
        </Text>
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScrollView}
        contentContainerStyle={styles.catRow}
      >
        {PHRASE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.catTab,
              activeCategory === cat.id && { backgroundColor: cat.color, borderColor: cat.color },
            ]}
            onPress={() => setActiveCategory(cat.id)}
          >
            <Text style={styles.catIcon}>{cat.icon}</Text>
            <Text
              style={[
                styles.catLabel,
                activeCategory === cat.id && { color: '#fff' },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Phrases grid */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.grid}>
        <Text style={styles.gridHint}>Tap a phrase to translate and play it aloud</Text>
        <View style={styles.phraseGrid}>
          {filtered.map((phrase) => (
            <PhraseCard
              key={phrase.key}
              phrase={phrase}
              categoryColor={activeCat?.color ?? Colors.accent}
              isLoading={loadingKey === phrase.key}
              isPlaying={playingKey === phrase.key}
              onPress={() => handlePhrasePress(phrase.key, phrase.text)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  targetBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  targetBarText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  targetBarLang: {
    color: Colors.accent,
    fontWeight: '700',
  },
  targetBarNote: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  catScrollView: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  catRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  catTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  catIcon: { fontSize: 16 },
  catLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: { flex: 1 },
  grid: { padding: 16, gap: 12, paddingBottom: 40 },
  gridHint: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  phraseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
});
