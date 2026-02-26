import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { PushToTalk } from '../../components/PushToTalk';
import { LanguageBadge } from '../../components/LanguageBadge';
import { WaveformIndicator } from '../../components/WaveformIndicator';
import { startRecording, stopRecording } from '../../lib/audioRecorder';
import { playBase64Audio } from '../../lib/audioPlayer';
import { translateSpeech } from '../../lib/api';
import { useAppStore } from '../../lib/store';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';

type Mode = 'survivor' | 'rescuer' | 'relay';

const MODE_CONFIG: Record<Mode, { color: string; title: string; icon: string }> = {
  survivor: { color: Colors.survivor, title: 'Survivor Mode', icon: '🆘' },
  rescuer: { color: Colors.rescuer, title: 'Rescuer Mode', icon: '🦺' },
  relay: { color: Colors.relay, title: 'Relay Mode', icon: '📡' },
};

interface TranslationResult {
  sourceText: string;
  sourceLang: string;
  translatedText: string;
  targetLang: string;
  role: 'speaker' | 'other';
}

export default function BridgeScreen() {
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const mode = (modeParam as Mode) ?? 'survivor';
  const config = MODE_CONFIG[mode] ?? MODE_CONFIG.survivor;

  const { detectedLanguage, myLanguage, myLanguageLabel, myLanguageFlag } = useAppStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingOther, setIsRecordingOther] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingOther, setIsProcessingOther] = useState(false);
  const [results, setResults] = useState<TranslationResult[]>([]);
  const [showLangPicker, setShowLangPicker] = useState<'my' | null>(null);
  const { setMyLanguage } = useAppStore();

  const localLang = detectedLanguage?.lang ?? 'ms';
  const localLabel = detectedLanguage?.label ?? 'Malay';
  const localFlag = detectedLanguage?.flag ?? '🇲🇾';

  const handleRecord = useCallback(async (role: 'speaker' | 'other') => {
    const setRec = role === 'speaker' ? setIsRecording : setIsRecordingOther;
    const setProc = role === 'speaker' ? setIsProcessing : setIsProcessingOther;

    try {
      setRec(true);
      await startRecording();
    } catch (e) {
      Alert.alert('Microphone Error', 'Could not access microphone. Please check permissions.');
      setRec(false);
    }
  }, []);

  const handleStopRecord = useCallback(
    async (role: 'speaker' | 'other') => {
      const setRec = role === 'speaker' ? setIsRecording : setIsRecordingOther;
      const setProc = role === 'speaker' ? setIsProcessing : setIsProcessingOther;

      setRec(false);
      setProc(true);

      try {
        const audioBase64 = await stopRecording();
        if (!audioBase64) {
          setProc(false);
          return;
        }

        // Speaker translates into local (target) language; "other" translates into my language
        const targetLanguage = role === 'speaker' ? localLang : myLanguage;

        const result = await translateSpeech({
          audioBase64,
          latitude: 3.14,
          longitude: 101.68,
          myLanguage: myLanguage,
          targetLanguage,
        });

        setResults((prev) => [{ ...result, role }, ...prev.slice(0, 9)]);
        await playBase64Audio(result.audioBase64);
      } catch (e: any) {
        Alert.alert('Translation Error', e.message ?? 'Something went wrong. Please try again.');
      } finally {
        setProc(false);
      }
    },
    [localLang, myLanguage],
  );

  const isRescuerMode = mode === 'rescuer';

  return (
    <View style={styles.container}>
      {/* Mode header */}
      <View style={[styles.modeHeader, { borderBottomColor: config.color }]}>
        <Text style={styles.modeIcon}>{config.icon}</Text>
        <Text style={[styles.modeTitle, { color: config.color }]}>{config.title}</Text>
      </View>

      {/* Language row */}
      <View style={styles.langRow}>
        <LanguageBadge flag={myLanguageFlag} label={myLanguageLabel} sublabel="My language" onPress={() => setShowLangPicker('my')} />
        <Text style={styles.arrowSep}>⇄</Text>
        <LanguageBadge flag={localFlag} label={localLabel} sublabel="Local language" />
      </View>

      {/* Language picker */}
      {showLangPicker && (
        <View style={styles.langPicker}>
          <Text style={styles.langPickerTitle}>Select your language</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langPickerList}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langPickerItem, myLanguage === lang.code && { borderColor: config.color }]}
                onPress={() => {
                  setMyLanguage(lang.code, lang.label, lang.flag);
                  setShowLangPicker(null);
                }}
              >
                <Text style={styles.langPickerFlag}>{lang.flag}</Text>
                <Text style={styles.langPickerLabel}>{lang.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.resultsContent}>
        {/* Rescuer mode: two panels */}
        {isRescuerMode ? (
          <View style={styles.rescuerPanels}>
            {/* Rescuer panel (speaks in my language, survivor hears local) */}
            <View style={[styles.panel, { borderColor: Colors.rescuer }]}>
              <Text style={[styles.panelLabel, { color: Colors.rescuer }]}>🦺 Rescuer speaks</Text>
              <PushToTalk
                onPressIn={() => handleRecord('speaker')}
                onPressOut={() => handleStopRecord('speaker')}
                isRecording={isRecording}
                isProcessing={isProcessing}
                color={Colors.rescuer}
                label="Hold to speak"
              />
              {isRecording && <WaveformIndicator isActive color={Colors.rescuer} />}
            </View>

            {/* Survivor panel (speaks in local lang, rescuer hears in my language) */}
            <View style={[styles.panel, { borderColor: Colors.survivor }]}>
              <Text style={[styles.panelLabel, { color: Colors.survivor }]}>🆘 Survivor speaks</Text>
              <PushToTalk
                onPressIn={() => handleRecord('other')}
                onPressOut={() => handleStopRecord('other')}
                isRecording={isRecordingOther}
                isProcessing={isProcessingOther}
                color={Colors.survivor}
                label="Hold for survivor"
              />
              {isRecordingOther && <WaveformIndicator isActive color={Colors.survivor} />}
            </View>
          </View>
        ) : (
          /* Survivor / Relay: single push-to-talk */
          <View style={styles.singlePanel}>
            <PushToTalk
              onPressIn={() => handleRecord('speaker')}
              onPressOut={() => handleStopRecord('speaker')}
              isRecording={isRecording}
              isProcessing={isProcessing}
              color={config.color}
            />
            {isRecording && <WaveformIndicator isActive color={config.color} />}
          </View>
        )}

        {/* Translation history */}
        {results.length > 0 && (
          <View style={styles.history}>
            <Text style={styles.historyLabel}>TRANSLATION LOG</Text>
            {results.map((r, i) => (
              <View key={i} style={[styles.resultCard, { borderLeftColor: r.role === 'speaker' ? config.color : Colors.survivor }]}>
                <View style={styles.resultLangRow}>
                  <Text style={styles.resultLangTag}>{r.sourceLang.toUpperCase()}</Text>
                  <Text style={styles.resultLangArrow}>→</Text>
                  <Text style={styles.resultLangTag}>{r.targetLang.toUpperCase()}</Text>
                </View>
                <Text style={styles.resultOriginal}>"{r.sourceText}"</Text>
                <Text style={styles.resultTranslated}>"{r.translatedText}"</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modeIcon: { fontSize: 22 },
  modeTitle: { fontSize: 16, fontWeight: '700' },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  arrowSep: { color: Colors.textSecondary, fontSize: 20 },
  langPicker: {
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  langPickerTitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  langPickerList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  langPickerItem: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  langPickerFlag: { fontSize: 24 },
  langPickerLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600' },
  resultsContainer: { flex: 1 },
  resultsContent: { padding: 20, gap: 20, paddingBottom: 40 },
  singlePanel: { alignItems: 'center', paddingVertical: 30, gap: 16 },
  rescuerPanels: { gap: 16 },
  panel: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  panelLabel: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  history: { gap: 10 },
  historyLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    gap: 6,
  },
  resultLangRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultLangTag: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resultLangArrow: { color: Colors.textMuted, fontSize: 14 },
  resultOriginal: { color: Colors.textSecondary, fontSize: 13, fontStyle: 'italic' },
  resultTranslated: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
});
