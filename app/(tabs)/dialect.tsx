import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '../../constants/colors';
import { listPhraseBank, PhraseBankRow, processDialectAudio, uploadPhraseBankEntry } from '../../lib/api';
import { startRecording, stopRecording } from '../../lib/audioRecorder';
import { WaveformIndicator } from '../../components/WaveformIndicator';

type UiState = 'idle' | 'recording' | 'processing' | 'result';

export default function DialectScreen() {
  const [uiState, setUiState] = useState<UiState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [phrases, setPhrases] = useState<PhraseBankRow[]>([]);
  const [loadingPhrases, setLoadingPhrases] = useState(false);
  const [selectedUploadUri, setSelectedUploadUri] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    language_name: 'Temiar',
    language_code: 'tmr',
    phrase_text: '',
    meaning_en: '',
    meaning_ms: '',
    context_tag: 'general' as 'emergency' | 'medical' | 'location' | 'food' | 'general',
    recorded_by: '',
  });

  useEffect(() => {
    void refreshPhrases();
  }, []);

  const phraseCountByLanguage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const phrase of phrases) {
      counts.set(phrase.language_name, (counts.get(phrase.language_name) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, count]) => `${name}: ${count}`);
  }, [phrases]);

  async function refreshPhrases() {
    try {
      setLoadingPhrases(true);
      setPhrases(await listPhraseBank());
    } catch (err: any) {
      setError(err.message ?? 'Could not load phrase bank');
    } finally {
      setLoadingPhrases(false);
    }
  }

  async function handleTapRecord() {
    if (uiState === 'recording') {
      await stopAndProcess();
      return;
    }
    try {
      setError(null);
      setResult(null);
      setUiState('recording');
      await startRecording();
      setTimeout(() => {
        void stopAndProcess();
      }, 8000);
    } catch {
      setUiState('idle');
      setError('No microphone found or permission denied.');
    }
  }

  async function stopAndProcess() {
    try {
      setUiState('processing');
      const audio = await stopRecording();
      if (!audio?.uri) {
        setUiState('idle');
        return;
      }
      const processed = await processDialectAudio(audio.uri);
      setResult(processed);
      setUiState('result');
    } catch (err: any) {
      setError(err.message ?? 'Processing failed.');
      setUiState('idle');
    }
  }

  async function pickUploadFile() {
    const file = await DocumentPicker.getDocumentAsync({
      type: ['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/*'],
      copyToCacheDirectory: true,
    });
    if (file.canceled || file.assets.length === 0) return;
    setSelectedUploadUri(file.assets[0].uri);
  }

  async function handleUpload() {
    if (!selectedUploadUri) {
      Alert.alert('Missing file', 'Choose an audio file first.');
      return;
    }
    if (!uploadForm.phrase_text || !uploadForm.meaning_en) {
      Alert.alert('Missing fields', 'Phrase text and English meaning are required.');
      return;
    }
    try {
      setUploading(true);
      await uploadPhraseBankEntry({
        audioUri: selectedUploadUri,
        ...uploadForm,
      });
      setUploadForm((prev) => ({ ...prev, phrase_text: '', meaning_en: '', meaning_ms: '' }));
      setSelectedUploadUri('');
      await refreshPhrases();
      Alert.alert('Uploaded', 'Phrase uploaded to ghost phrase bank.');
    } catch (err: any) {
      Alert.alert('Upload failed', err.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  const renderResult = () => {
    if (!result) return null;

    if (result.layer === 'dialect_translator') {
      return (
        <View style={[styles.resultCard, styles.layer1Card]}>
          <Text style={styles.resultTitle}>LAYER 1 - DIALECT</Text>
          <Text style={styles.resultText}>Whisper: "{result.transcript}"</Text>
          <Text style={styles.resultText}>Patched: "{result.patched_text}"</Text>
          <Text style={styles.resultMain}>{result.translation}</Text>
          <Text style={styles.resultMeta}>Dialect: {result.dialect_id} · Confidence: {(result.confidence * 100).toFixed(1)}%</Text>
        </View>
      );
    }

    if (!result.matched) {
      return (
        <View style={[styles.resultCard, styles.layer2Card]}>
          <Text style={styles.resultTitle}>LAYER 2 - GHOST</Text>
          <Text style={styles.resultText}>{result.message}</Text>
          {!!result.whisper_transcript && (
            <Text style={styles.resultMeta}>Whisper fallback: "{result.whisper_transcript}"</Text>
          )}
        </View>
      );
    }

    return (
      <View style={[styles.resultCard, styles.layer2Card]}>
        <Text style={styles.resultTitle}>LAYER 2 - GHOST</Text>
        <Text style={styles.resultMain}>{result.meaning_en}</Text>
        {!!result.meaning_ms && <Text style={styles.resultText}>{result.meaning_ms}</Text>}
        <Text style={styles.resultMeta}>
          {result.language_name} [{result.language_code}] · "{result.phrase_text}"
        </Text>
        <Text style={styles.resultMeta}>
          DTW: {result.dtw_distance} · Confidence: {(result.confidence * 100).toFixed(1)}%
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>Dialect Tools</Text>
        <Text style={styles.demoPill}>PRODUCTION</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Speak in any dialect.</Text>
        <Text style={styles.heroSubtitle}>
          We auto-detect and translate, then match elder recordings for unknown language audio.
        </Text>
      </View>

      <TouchableOpacity style={styles.recordWrap} activeOpacity={0.9} onPress={handleTapRecord}>
        <View style={[styles.recordOuter, uiState === 'recording' && styles.recordOuterLive]}>
          <View style={[styles.recordInner, uiState === 'recording' && styles.recordInnerLive]}>
            {uiState === 'processing' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.recordMic}>{uiState === 'recording' ? '■' : '🎙'}</Text>
            )}
          </View>
        </View>
        <Text style={styles.recordHint}>
          {uiState === 'recording' ? 'Listening... tap to stop' : uiState === 'processing' ? 'Processing...' : 'Tap to speak'}
        </Text>
      </TouchableOpacity>

      {uiState === 'recording' && (
        <View style={styles.wave}>
          <WaveformIndicator isActive color="#7c5cbf" />
        </View>
      )}

      <Text style={styles.sectionLabel}>DEMO SCENARIOS</Text>
      <View style={styles.grid}>
        <View style={styles.demoCard}>
          <Text style={styles.demoHead}>LAYER 1 - DIALECT</Text>
          <Text style={styles.demoMain}>"demo mano gi"</Text>
          <Text style={styles.demoSub}>Kelantanese Malay</Text>
        </View>
        <View style={styles.demoCard}>
          <Text style={styles.demoHead}>LAYER 1 - DIALECT</Text>
          <Text style={styles.demoMain}>"wa beh tahan"</Text>
          <Text style={styles.demoSub}>Penang Hokkien</Text>
        </View>
        <View style={styles.demoCard}>
          <Text style={styles.demoHead}>LAYER 2 - GHOST</Text>
          <Text style={styles.demoMain}>"cem naa"</Text>
          <Text style={styles.demoSub}>Temiar (Orang Asli)</Text>
        </View>
        <View style={styles.demoCard}>
          <Text style={styles.demoHead}>LAYER 2 - GHOST</Text>
          <Text style={styles.demoMain}>"gob ngaan"</Text>
          <Text style={styles.demoSub}>Semai (Orang Asli)</Text>
        </View>
      </View>

      <View style={styles.archCard}>
        <Text style={styles.cardHeading}>SYSTEM ARCHITECTURE</Text>
        <Text style={styles.archText}>
          Speech{'\n'}
          ↓{'\n'}
          Whisper STT{'\n'}
          ↓{'\n'}
          Dialect detected?{'\n'}
          ↓ ↓{'\n'}
          Glossary Patch  Ghost Match{'\n'}
          ↓                ↓{'\n'}
          Google Translate Phrase Bank{'\n'}
          ↓                ↓{'\n'}
          Translation      Phrase Meaning
        </Text>
      </View>

      <View style={styles.archCard}>
        <Text style={styles.cardHeading}>HOW IT WORKS</Text>
        <Text style={styles.howLine}>Layer 1 - Dialect Translator</Text>
        <Text style={styles.howText}>Whisper STT -&gt; detect dialect -&gt; fuzzy glossary patch -&gt; Google Translate.</Text>
        <Text style={styles.howTag}>MAIN SYSTEM</Text>
        <Text style={[styles.howLine, { marginTop: 12 }]}>Layer 2 - Ghost Interpreter</Text>
        <Text style={styles.howText}>If Whisper fails, we run MFCC extraction and DTW matching against elder phrase bank.</Text>
        <Text style={styles.howTag}>FALLBACK - ENDANGERED LANGUAGES</Text>
      </View>

      {renderResult()}

      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.bankHeader}>
        <Text style={styles.sectionLabel}>PHRASE BANK</Text>
        <TouchableOpacity onPress={refreshPhrases} disabled={loadingPhrases}>
          <Text style={styles.refresh}>{loadingPhrases ? 'Loading...' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.archCard}>
        <Text style={styles.bankSummary}>Total phrases: {phrases.length}</Text>
        <Text style={styles.bankSummary}>{phraseCountByLanguage.join(' · ') || 'No phrases found'}</Text>
      </View>

      <View style={styles.archCard}>
        <Text style={styles.cardHeading}>UPLOAD PHRASE (WAV)</Text>
        <TouchableOpacity style={styles.fileButton} onPress={pickUploadFile}>
          <Text style={styles.fileButtonText}>{selectedUploadUri ? 'Audio selected' : 'Choose audio file'}</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Language name (e.g. Temiar)"
          placeholderTextColor={Colors.textMuted}
          value={uploadForm.language_name}
          onChangeText={(v) => setUploadForm((p) => ({ ...p, language_name: v }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Language code (e.g. tmr)"
          placeholderTextColor={Colors.textMuted}
          value={uploadForm.language_code}
          onChangeText={(v) => setUploadForm((p) => ({ ...p, language_code: v }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Phrase text"
          placeholderTextColor={Colors.textMuted}
          value={uploadForm.phrase_text}
          onChangeText={(v) => setUploadForm((p) => ({ ...p, phrase_text: v }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Meaning (EN)"
          placeholderTextColor={Colors.textMuted}
          value={uploadForm.meaning_en}
          onChangeText={(v) => setUploadForm((p) => ({ ...p, meaning_en: v }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Meaning (MS)"
          placeholderTextColor={Colors.textMuted}
          value={uploadForm.meaning_ms}
          onChangeText={(v) => setUploadForm((p) => ({ ...p, meaning_ms: v }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Recorded by"
          placeholderTextColor={Colors.textMuted}
          value={uploadForm.recorded_by}
          onChangeText={(v) => setUploadForm((p) => ({ ...p, recorded_by: v }))}
        />
        <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload} disabled={uploading}>
          <Text style={styles.uploadBtnText}>{uploading ? 'Uploading...' : 'Upload phrase'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1220',
  },
  content: {
    padding: 14,
    paddingBottom: 36,
    gap: 12,
  },
  topBar: {
    backgroundColor: '#0d1730',
    borderWidth: 1,
    borderColor: '#223963',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    color: '#f2f6ff',
    fontSize: 22,
    fontWeight: '800',
  },
  demoPill: {
    color: '#d0b7ff',
    borderColor: '#7c5cbf',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 8,
    gap: 6,
  },
  heroTitle: {
    color: '#f6f8ff',
    fontSize: 23,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: '#9db2d6',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 19,
  },
  recordWrap: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  recordOuter: {
    width: 142,
    height: 142,
    borderRadius: 71,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: '#2a3d66',
    backgroundColor: '#0f1a34',
  },
  recordOuterLive: {
    borderColor: '#8b6ed8',
    shadowColor: '#7c5cbf',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  recordInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6f56b0',
  },
  recordInnerLive: {
    backgroundColor: '#d64f4f',
  },
  recordMic: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  recordHint: {
    color: '#8ea7d1',
    fontWeight: '600',
  },
  wave: {
    borderWidth: 1,
    borderColor: '#223963',
    borderRadius: 10,
    paddingVertical: 8,
    backgroundColor: '#0d1730',
  },
  sectionLabel: {
    color: '#6f89b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoCard: {
    width: '48.8%',
    borderWidth: 1,
    borderColor: '#29406d',
    borderRadius: 10,
    backgroundColor: '#122140',
    padding: 10,
    gap: 4,
  },
  demoHead: {
    color: '#6cffcf',
    fontWeight: '800',
    fontSize: 11,
  },
  demoMain: {
    color: '#f0f6ff',
    fontWeight: '700',
    fontSize: 17,
  },
  demoSub: {
    color: '#84a0cc',
    fontSize: 12,
  },
  archCard: {
    borderWidth: 1,
    borderColor: '#2a456f',
    borderRadius: 12,
    backgroundColor: '#132447',
    padding: 12,
    gap: 8,
  },
  cardHeading: {
    color: '#7ea5ff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  archText: {
    color: '#b4c6e7',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  howLine: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  howText: {
    color: '#aec2e7',
    fontSize: 13,
    lineHeight: 19,
  },
  howTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#203a67',
    color: '#79ffcc',
    fontSize: 11,
    fontWeight: '700',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resultCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    gap: 6,
    backgroundColor: '#111e3c',
  },
  layer1Card: {
    borderColor: '#53e09a',
  },
  layer2Card: {
    borderColor: '#b694ff',
  },
  resultTitle: {
    color: '#f4f8ff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  resultMain: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  resultText: {
    color: '#c2d4f5',
    fontSize: 14,
  },
  resultMeta: {
    color: '#91a9d2',
    fontSize: 12,
  },
  errorCard: {
    borderWidth: 1,
    borderColor: '#f06d6d',
    backgroundColor: '#33151a',
    borderRadius: 10,
    padding: 10,
  },
  errorText: {
    color: '#ffacac',
    fontWeight: '600',
  },
  bankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refresh: {
    color: '#9ec2ff',
    fontSize: 12,
    fontWeight: '700',
  },
  bankSummary: {
    color: '#c2d4f5',
    fontSize: 13,
  },
  fileButton: {
    borderWidth: 1,
    borderColor: '#486ba3',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#17305b',
  },
  fileButtonText: {
    color: '#f2f7ff',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#0f1a34',
    borderWidth: 1,
    borderColor: '#27467e',
    borderRadius: 8,
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13,
  },
  uploadBtn: {
    backgroundColor: '#7c5cbf',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  uploadBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});
