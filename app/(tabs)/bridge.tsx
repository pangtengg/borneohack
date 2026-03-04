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
  patchResult?: PatchResult;
  isGhostMatch?: boolean;
  ghostMatchResult?: Extract<GhostMatchResult, { found: true }>;
  audioBase64?: string;
}

export default function BridgeScreen() {
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const mode = (modeParam as Mode) ?? 'survivor';
  const config = MODE_CONFIG[mode] ?? MODE_CONFIG.survivor;

  const {
    myLanguage, myLanguageLabel, myLanguageFlag, setMyLanguage,
    detectedCountry, setDetectedCountry,
    targetLanguage, targetLanguageLabel, targetLanguageFlag,
    panicMode, setPanicMode,
    ghostEnabled, dialectEnabled,
    detectedDialect, setDetectedDialect,
    installedGhostPacks, installedGlossaries
  } = useAppStore();

  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingOther, setIsRecordingOther] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingOther, setIsProcessingOther] = useState(false);
  const [results, setResults] = useState<TranslationResult[]>([]);
  const [showLangPicker, setShowLangPicker] = useState<'my' | null>(null);

  // New state
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [phraseLoadingKey, setPhraseLoadingKey] = useState<string | null>(null);
  const [phrasePlayingKey, setPhrasePlayingKey] = useState<string | null>(null);

  // Initial country detection
  React.useEffect(() => {
    detectCountry().then(setDetectedCountry);
  }, [setDetectedCountry]);

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
        const audioData = await stopRecording();
        if (!audioData) {
          setProc(false);
          return;
        }

        const { base64: audioBase64, durationMillis } = audioData;

        // Speaker translates into target language; "other" translates into my language
        const targetLang = role === 'speaker' ? targetLanguage : myLanguage;

        // 1. Initial MT call to get the baseline transcript string
        const result = await translateSpeech({
          audioBase64,
          latitude: 3.14,
          longitude: 101.68,
          myLanguage: myLanguage,
          targetLanguage: targetLang,
        });

        const transcript = result.sourceText || '';

        // --- LAYER 1: DIALECT DETECTION ---
        const dialectResult = detectDialect(transcript);
        setDetectedDialect(dialectResult);

        // --- LAYER 2: GHOST MATCH ---
        if (ghostEnabled && dialectResult.confidence >= 0.5) {
          const match = tryGhostMatch(
            { durationSeconds: durationMillis / 1000 },
            transcript,
            installedGhostPacks,
            dialectResult.name
          );

          if (match.found) {
            // Bypass MT, build ghost card, play TTS
            const ttsResult = await translatePhrase({
              phraseKey: 'ghost-' + Date.now().toString(),
              phraseText: match.canonical,
              targetLang: targetLang,
            });

            setResults((prev) => [{
              sourceText: transcript,
              sourceLang: myLanguage,
              translatedText: match.canonical,
              targetLang: targetLang,
              role,
              isGhostMatch: true,
              ghostMatchResult: match,
              audioBase64: ttsResult.audioBase64
            }, ...prev.slice(0, 9)]);

            await playBase64Audio(ttsResult.audioBase64);
            return; // STOP FLOW
          }
        }

        // --- LAYER 3: GLOSSARY PATCH ---
        let patchResult: PatchResult | undefined;
        let finalSourceText = transcript;
        let finalTranslatedText = result.translatedText;
        let finalAudioBase64 = result.audioBase64;

        if (dialectEnabled && dialectResult.confidence >= 0.5) {
          patchResult = applyGlossaryPatch(transcript, installedGlossaries, dialectResult.name);

          if (patchResult.patched) {
            // Re-run MT with patched text
            const patchedMtResult = await translatePhrase({
              phraseKey: 'patch-' + Date.now().toString(),
              phraseText: patchResult.patchedText,
              targetLang: targetLang,
            });
            finalTranslatedText = patchedMtResult.translatedText;
            finalAudioBase64 = patchedMtResult.audioBase64;
          }
        }

        // Assemble Final Normal or Patched Result
        setResults((prev) => [{
          sourceText: finalSourceText,
          sourceLang: myLanguage,
          translatedText: finalTranslatedText,
          targetLang: targetLang,
          role,
          patchResult,
          audioBase64: finalAudioBase64
        }, ...prev.slice(0, 9)]);

        await playBase64Audio(finalAudioBase64);
      } catch (e: any) {
        Alert.alert('Translation Error', e.message ?? 'Something went wrong. Please try again.');
      } finally {
        setProc(false);
      }
    },
    [targetLanguage, myLanguage, ghostEnabled, dialectEnabled, installedGhostPacks, installedGlossaries],
  );

  const triggerPanicSequence = async () => {
    try {
      setIsRecording(true);
      await startRecording();

      // Auto-stop after 8 seconds
      setTimeout(async () => {
        setIsRecording(false);
        setIsProcessing(true);
        try {
          const audioData = await stopRecording();
          if (audioData) {
            const result = await translateSpeech({
              audioBase64: audioData.base64,
              latitude: 3.14,
              longitude: 101.68,
              myLanguage,
              targetLanguage,
            });
            setResults((prev) => [{ ...result, role: 'speaker' }, ...prev.slice(0, 9)]);
            await playBase64Audio(result.audioBase64);
          }
        } catch (e: any) {
          Alert.alert('Panic Error', e.message);
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
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not play phrase.');
    } finally {
      setPhraseLoadingKey(null);
      setTimeout(() => setPhrasePlayingKey(null), 3000);
    }
  };

  const handleManualTranslate = async (text: string) => {
    const result = await translatePhrase({ phraseKey: 'manual', phraseText: text, targetLang: targetLanguage });
    setResults((prev) => [{
      sourceText: text, sourceLang: myLanguage,
      translatedText: result.translatedText, targetLang: targetLanguage, role: 'speaker',
      audioBase64: result.audioBase64
    }, ...prev.slice(0, 9)]);
    await playBase64Audio(result.audioBase64);
  };

  const isRescuerMode = mode === 'rescuer';

  return (
    <View style={styles.container}>
      {panicMode && (
        <View style={styles.panicBanner}>
          <Text style={styles.panicBannerText}>⚡ PANIC MODE ACTIVE — tap PANIC to exit</Text>
        </View>
      )}

      {/* Mode header & Country Pill */}
      <View style={styles.headerRow}>
        <View style={[styles.modeHeader, { borderBottomColor: config.color }]}>
          <Text style={styles.modeIcon}>{config.icon}</Text>
          <Text style={[styles.modeTitle, { color: config.color }]}>{config.title}</Text>
        </View>
        <CountryPill country={detectedCountry} onPress={() => setShowCountryPicker(true)} />
      </View>

      {/* Language row */}
      <View style={styles.langRow}>
        <LanguageBadge
          flag={myLanguageFlag} label={myLanguageLabel}
          sublabel="My language" onPress={() => setShowLangPicker('my')}
          locked={panicMode}
        />
        <Text style={styles.arrowSep}>⇄</Text>
        <LanguageBadge
          flag={targetLanguageFlag} label={targetLanguageLabel}
          autoDetected
          locked={panicMode}
        />
      </View>

      {/* Panic Toggle */}
      <View style={styles.panicToggleRow}>
        <PanicToggle isActive={panicMode} onToggle={handlePanicToggle} />
      </View>

      {/* Language picker */}
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
          <View style={styles.singlePanelWrapper}>
            <View style={styles.singlePanel}>
              <PushToTalk
                onPressIn={() => { if (!panicMode) handleRecord('speaker'); }}
                onPressOut={() => { if (!panicMode) handleStopRecord('speaker'); }}
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

            {/* Phrase Bank Grid & Manual Fallback (Survivor/Relay only) */}
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
        )}

        {/* Translation history */}
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

      {/* Modals */}
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  panicBanner: {
    backgroundColor: Colors.danger,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panicBannerText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  panicToggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
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
  singlePanelWrapper: { gap: 16 },
  singlePanel: { alignItems: 'center', paddingVertical: 10, gap: 16 },
  manualBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  manualBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
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
