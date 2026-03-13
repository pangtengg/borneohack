import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { PushToTalk } from '../../components/PushToTalk';
import { LanguageBadge } from '../../components/LanguageBadge';
import { WaveformIndicator } from '../../components/WaveformIndicator';
import { startRecording, stopRecording } from '../../lib/audioRecorder';
import { playBase64Audio } from '../../lib/audioPlayer';
import { translateSpeech, translatePhrase } from '../../lib/api';
import { useAppStore } from '../../lib/store';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';
import { CountryPill } from '../../components/CountryPill';
import { CountryPickerModal } from '../../components/CountryPickerModal';
import { PanicToggle } from '../../components/PanicToggle';
import { PhraseBankGrid } from '../../components/PhraseBankGrid';
import { ManualFallbackModal } from '../../components/ManualFallbackModal';
import { detectCountry, CountryInfo, saveOverrideCountry } from '../../lib/countryDetect';
import { EMERGENCY_PHRASES, Phrase } from '../../constants/phrases';
import { detectDialect } from '../../lib/utils/dialectDetect';
import { tryGhostMatch } from '../../lib/utils/ghostMatch';
import { applyGlossaryPatch } from '../../lib/utils/glossaryPatch';
import { PatchResult, GhostMatchResult } from '../../lib/types/dialect';
import { PatchedCard } from '../../components/PatchedCard';
import { GhostCard } from '../../components/GhostCard';
import { DialectBadge } from '../../components/DialectBadge';

interface TranslationResult {
  sourceText: string;
  sourceLang: string;
  translatedText: string;
  targetLang: string;
  role: 'speaker' | 'other';
  patchResult?: PatchResult;
  isGhostMatch?: boolean;
  ghostMatchResult?: Extract<GhostMatchResult, { found: true }>;
  audioBase64?: string;
}

export default function ConvoScreen() {
  const {
    myLanguage,
    myLanguageLabel,
    myLanguageFlag,
    setMyLanguage,
    detectedCountry,
    setDetectedCountry,
    targetLanguage,
    targetLanguageLabel,
    targetLanguageFlag,
    panicMode,
    setPanicMode,
    ghostEnabled,
    dialectEnabled,
    detectedDialect,
    setDetectedDialect,
    installedGhostPacks,
    installedGlossaries,
  } = useAppStore();

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<TranslationResult[]>([]);
  const [showLangPicker, setShowLangPicker] = useState<'my' | null>(null);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [phraseLoadingKey, setPhraseLoadingKey] = useState<string | null>(null);
  const [phrasePlayingKey, setPhrasePlayingKey] = useState<string | null>(null);

  const config = { color: Colors.survivor, title: 'Convo', icon: '💬' };

  React.useEffect(() => {
    detectCountry().then(setDetectedCountry);
  }, [setDetectedCountry]);

  const handleRecord = useCallback(async () => {
    try {
      setIsRecording(true);
      await startRecording();
    } catch {
      Alert.alert('Microphone Error', 'Could not access microphone. Please check permissions.');
      setIsRecording(false);
    }
  }, []);

  const handleStopRecord = useCallback(
    async () => {
      setIsRecording(false);
      setIsProcessing(true);
      try {
        const audioData = await stopRecording();
        if (!audioData) {
          setIsProcessing(false);
          return;
        }
        const { base64: audioBase64, durationMillis } = audioData;
        const targetLang = targetLanguage;

        const result = await translateSpeech({
          audioBase64,
          latitude: detectedCountry?.latitude ?? 0,
          longitude: detectedCountry?.longitude ?? 0,
          myLanguage,
          targetLanguage: targetLang,
        });
        const transcript = result.sourceText || '';

        const dialectResult = detectDialect(transcript);
        setDetectedDialect(dialectResult);

        if (ghostEnabled && dialectResult.confidence >= 0.5) {
          const match = tryGhostMatch(
            { durationSeconds: durationMillis / 1000 },
            transcript,
            installedGhostPacks,
            dialectResult.name
          );
          if (match.found) {
            const ttsResult = await translatePhrase({
              phraseKey: 'ghost-' + Date.now().toString(),
              phraseText: match.canonical,
              targetLang,
            });
            setResults((prev) => [{
              sourceText: transcript,
              sourceLang: myLanguage,
              translatedText: match.canonical,
              targetLang,
              role: 'speaker',
              isGhostMatch: true,
              ghostMatchResult: match,
              audioBase64: ttsResult.audioBase64,
            }, ...prev.slice(0, 9)]);
            await playBase64Audio(ttsResult.audioBase64);
            setIsProcessing(false);
            return;
          }
        }

        let patchResult: PatchResult | undefined;
        let finalSourceText = transcript;
        let finalTranslatedText = result.translatedText;
        let finalAudioBase64 = result.audioBase64;

        if (dialectEnabled && dialectResult.confidence >= 0.5) {
          patchResult = applyGlossaryPatch(transcript, installedGlossaries, dialectResult.name);
          if (patchResult.patched) {
            const patchedMtResult = await translatePhrase({
              phraseKey: 'patch-' + Date.now().toString(),
              phraseText: patchResult.patchedText,
              targetLang,
            });
            finalTranslatedText = patchedMtResult.translatedText;
            finalAudioBase64 = patchedMtResult.audioBase64;
          }
        }

        setResults((prev) => [{
          sourceText: finalSourceText,
          sourceLang: myLanguage,
          translatedText: finalTranslatedText,
          targetLang,
          role: 'speaker',
          patchResult,
          audioBase64: finalAudioBase64,
        }, ...prev.slice(0, 9)]);
        await playBase64Audio(finalAudioBase64);
      } catch (e: unknown) {
        Alert.alert('Translation Error', e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    },
    [targetLanguage, myLanguage, ghostEnabled, dialectEnabled, installedGhostPacks, installedGlossaries, setDetectedDialect]
  );

  const triggerPanicSequence = async () => {
    try {
      setIsRecording(true);
      await startRecording();
      setTimeout(async () => {
        setIsRecording(false);
        setIsProcessing(true);
        try {
          const audioData = await stopRecording();
          if (audioData) {
            const result = await translateSpeech({
              audioBase64: audioData.base64,
              latitude: detectedCountry?.latitude ?? 0,
              longitude: detectedCountry?.longitude ?? 0,
              myLanguage,
              targetLanguage,
            });
            setResults((prev) => [{ ...result, role: 'speaker' } as TranslationResult, ...prev.slice(0, 9)]);
            await playBase64Audio(result.audioBase64);
          }
        } catch (e: unknown) {
          Alert.alert('Panic Error', e instanceof Error ? e.message : 'Error');
        } finally {
          setIsProcessing(false);
        }
      }, 8000);
    } catch {
      setIsRecording(false);
    }
  };

  const handlePanicToggle = (on: boolean) => {
    setPanicMode(on);
    if (on) triggerPanicSequence();
  };

  const handleCountrySelect = async (country: CountryInfo) => {
    await saveOverrideCountry(country.code);
    setDetectedCountry({ ...country, status: 'online' });
    setShowCountryPicker(false);
  };

  const handlePlayPhrase = async (phrase: Phrase) => {
    if (phraseLoadingKey) return;
    setPhraseLoadingKey(phrase.key);
    setPhrasePlayingKey(null);
    try {
      const result = await translatePhrase({ phraseKey: phrase.key, phraseText: phrase.text, targetLang: targetLanguage });
      setPhrasePlayingKey(phrase.key);
      await playBase64Audio(result.audioBase64);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not play phrase.');
    } finally {
      setPhraseLoadingKey(null);
      setTimeout(() => setPhrasePlayingKey(null), 3000);
    }
  };

  const handleManualTranslate = async (text: string) => {
    const result = await translatePhrase({ phraseKey: 'manual', phraseText: text, targetLang: targetLanguage });
    setResults((prev) => [{
      sourceText: text,
      sourceLang: myLanguage,
      translatedText: result.translatedText,
      targetLang: targetLanguage,
      role: 'speaker',
      audioBase64: result.audioBase64,
    }, ...prev.slice(0, 9)]);
    await playBase64Audio(result.audioBase64);
  };

  return (
    <View style={styles.container}>
      {panicMode && (
        <View style={styles.panicBanner}>
          <Text style={styles.panicBannerText}>⚡ PANIC MODE ACTIVE — tap PANIC to exit</Text>
        </View>
      )}

      <View style={styles.headerRow}>
        <View style={[styles.modeHeader, { borderBottomColor: config.color }]}>
          <Text style={styles.modeIcon}>{config.icon}</Text>
          <Text style={[styles.modeTitle, { color: config.color }]}>{config.title}</Text>
        </View>
        <CountryPill country={detectedCountry} onPress={() => setShowCountryPicker(true)} />
      </View>

      <View style={styles.langRow}>
        <LanguageBadge
          flag={myLanguageFlag}
          label={myLanguageLabel}
          sublabel="My language"
          onPress={() => setShowLangPicker('my')}
          locked={panicMode}
        />
        <Text style={styles.arrowSep}>⇄</Text>
        <LanguageBadge
          flag={targetLanguageFlag}
          label={targetLanguageLabel}
          autoDetected
          locked={panicMode}
        />
      </View>

      <View style={styles.panicToggleRow}>
        <PanicToggle isActive={panicMode} onToggle={handlePanicToggle} />
      </View>

      {showLangPicker && !panicMode && (
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
        <View style={styles.singlePanelWrapper}>
          <View style={styles.singlePanel}>
            <PushToTalk
              onPressIn={() => { if (!panicMode) handleRecord(); }}
              onPressOut={() => { if (!panicMode) handleStopRecord(); }}
              isRecording={isRecording}
              isProcessing={isProcessing}
              color={config.color}
              label={panicMode ? 'Auto-Recording...' : 'Hold to Speak'}
            />
            {isRecording && <WaveformIndicator isActive color={config.color} />}
            <View style={{ marginTop: 8 }}>
              <DialectBadge dialectName={detectedDialect.name} confidence={detectedDialect.confidence} />
            </View>
          </View>
          <PhraseBankGrid
            phrases={EMERGENCY_PHRASES}
            onPlayPhrase={handlePlayPhrase}
            isLoadingKey={phraseLoadingKey}
            isPlayingKey={phrasePlayingKey}
          />
          <TouchableOpacity style={styles.manualBtn} onPress={() => setShowManualFallback(true)}>
            <Text style={styles.manualBtnText}>Manual ✏️</Text>
          </TouchableOpacity>
        </View>

        {results.length > 0 && (
          <View style={styles.history}>
            <Text style={styles.historyLabel}>TRANSLATION LOG</Text>
            {results.map((r, i) => {
              if (r.isGhostMatch && r.ghostMatchResult) {
                return (
                  <GhostCard
                    key={i}
                    match={r.ghostMatchResult}
                    onReplay={() => r.audioBase64 && playBase64Audio(r.audioBase64)}
                  />
                );
              }
              return (
                <PatchedCard
                  key={i}
                  sourceText={r.sourceText}
                  sourceLang={r.sourceLang}
                  translatedText={r.translatedText}
                  targetLang={r.targetLang}
                  role={r.role}
                  color={config.color}
                  patchResult={r.patchResult}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      <CountryPickerModal
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        onSelect={handleCountrySelect}
        currentCountry={detectedCountry}
      />
      <ManualFallbackModal
        visible={showManualFallback}
        onClose={() => setShowManualFallback(false)}
        onTranslateAndSpeak={handleManualTranslate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  panicBanner: { backgroundColor: Colors.danger, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  panicBannerText: { color: '#fff', fontWeight: '700', fontSize: 12, letterSpacing: 0.5 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 },
  modeIcon: { fontSize: 22 },
  modeTitle: { fontSize: 16, fontWeight: '700' },
  langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  arrowSep: { color: Colors.textSecondary, fontSize: 20 },
  panicToggleRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, marginBottom: 10 },
  langPicker: { backgroundColor: Colors.surface, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  langPickerTitle: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1, paddingHorizontal: 20, marginBottom: 8 },
  langPickerList: { paddingHorizontal: 16, gap: 8 },
  langPickerItem: { alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
  langPickerFlag: { fontSize: 24 },
  langPickerLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600' },
  resultsContainer: { flex: 1 },
  resultsContent: { padding: 20, gap: 20, paddingBottom: 40 },
  singlePanelWrapper: { gap: 16 },
  singlePanel: { alignItems: 'center', paddingVertical: 10, gap: 16 },
  manualBtn: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border, marginTop: 8 },
  manualBtnText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  history: { gap: 10 },
  historyLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
});
