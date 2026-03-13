// @ts-nocheck
import { useState, useCallback, useRef } from 'react';
import type { SessionState, Message, MessageRole, SupportedLanguageCode } from '../../types';
import { translateAndRewrite, synthesizeSpeech, playAudio } from '../../api';
import { generateSessionId, generateMessageId, detectPanicIndicators } from '../../utils/helpers';
import { useSpeechRecognition } from './useSpeechRecognition';

const defaultSession = (): SessionState => ({
  sessionId: generateSessionId(),
  mode: 'standby',
  survivorLang: 'auto',
  responderLang: 'en',
  autoDetect: true,
  locationDetected: null,
  messages: [],
  activeMessageId: null,
});

export function useSession() {
  const [session, setSession] = useState<SessionState>(defaultSession);
  const [statusText, setStatusText] = useState('System ready');
  const speechRec = useSpeechRecognition();
  const processingRef = useRef(false);

  const updateSession = useCallback((updates: Partial<SessionState>) => {
    setSession(prev => ({ ...prev, ...updates }));
  }, []);

  const addMessage = useCallback((msg: Message) => {
    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, msg],
      activeMessageId: msg.id,
    }));
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setSession(prev => ({
      ...prev,
      messages: prev.messages.map(m => m.id === id ? { ...m, ...updates } : m),
    }));
  }, []);

  // ─── Main pipeline: STT → Translate → TTS ─────────────────────────────────
  const processTranslation = useCallback(async (
    text: string,
    role: MessageRole,
    sourceLang: SupportedLanguageCode,
    targetLang: SupportedLanguageCode,
    isEmergencyPhrase = false,
  ) => {
    if (processingRef.current) return;
    processingRef.current = true;

    const msgId = generateMessageId();
    const panicDetected = detectPanicIndicators(text);

    const newMessage: Message = {
      id: msgId,
      role,
      timestamp: new Date(),
      status: 'translating',
      translation: null,
      isEmergencyPhrase,
      emergencyLevel: isEmergencyPhrase ? 'critical' : panicDetected ? 'high' : undefined,
    };

    addMessage(newMessage);
    updateSession({ mode: 'processing' });
    setStatusText('Translating...');

    try {
      // Step 1: Translate + Tone rewrite
      const result = await translateAndRewrite({
        text,
        sourceLang,
        targetLang,
        rewriteTone: true,
      });

      updateMessage(msgId, {
        status: 'translating',
        translation: {
          original: text,
          translated: result.translated,
          detectedLang: result.detectedLang,
          targetLang,
          toneRewritten: result.toneRewritten ?? undefined,
          panicDetected: result.panicDetected,
        },
        emergencyLevel: result.panicDetected || isEmergencyPhrase ? 'critical' : undefined,
      });

      // Step 2: TTS via ElevenLabs — use tone-rewritten version if available
      const speakText = result.toneRewritten ?? result.translated;
      setStatusText('Broadcasting via ElevenLabs...');
      updateSession({ mode: 'speaking' });

      const audio = await synthesizeSpeech(speakText);
      const audioUrl = audio.src;

      updateMessage(msgId, { status: 'done', audioUrl });
      await playAudio(audio);

      setStatusText('Ready');
    } catch (err) {
      console.error('Pipeline error:', err);
      updateMessage(msgId, { status: 'error' });
      setStatusText(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      updateSession({ mode: 'standby', activeMessageId: null });
      processingRef.current = false;
    }
  }, [addMessage, updateMessage, updateSession]);

  // ─── Voice input: Start listening ─────────────────────────────────────────
  const startVoice = useCallback((role: MessageRole) => {
    const lang = role === 'survivor' ? session.survivorLang : session.responderLang;
    const actualLang: SupportedLanguageCode = lang === 'auto' ? 'en' : lang;

    updateSession({ mode: 'listening' });
    setStatusText('Listening...');

    speechRec.startListening(actualLang);
  }, [session, speechRec, updateSession]);

  const stopVoiceAndProcess = useCallback(async (role: MessageRole) => {
    speechRec.stopListening();
    const text = speechRec.transcript;
    if (!text.trim()) {
      updateSession({ mode: 'standby' });
      setStatusText('No speech detected');
      return;
    }

    const sourceLang = role === 'survivor' ? session.survivorLang : session.responderLang;
    const targetLang = role === 'survivor' ? session.responderLang : session.survivorLang;

    await processTranslation(text, role, sourceLang, targetLang);
  }, [speechRec, session, processTranslation, updateSession]);

  // ─── Emergency phrase broadcast ───────────────────────────────────────────
  const broadcastEmergencyPhrase = useCallback(async (phraseText: string) => {
    const targetLang = session.survivorLang === 'auto' ? session.responderLang : session.survivorLang;
    await processTranslation(phraseText, 'responder', 'en', targetLang, true);
  }, [session, processTranslation]);

  // ─── Swap language pair ───────────────────────────────────────────────────
  const swapLanguages = useCallback(() => {
    setSession(prev => ({
      ...prev,
      survivorLang: prev.responderLang,
      responderLang: prev.survivorLang === 'auto' ? 'en' : prev.survivorLang,
    }));
  }, []);

  // ─── Text input fallback ──────────────────────────────────────────────────
  const submitText = useCallback(async (text: string, role: MessageRole) => {
    const sourceLang = role === 'survivor' ? session.survivorLang : session.responderLang;
    const targetLang = role === 'survivor' ? session.responderLang : session.survivorLang;
    await processTranslation(text, role, sourceLang, targetLang);
  }, [session, processTranslation]);

  return {
    session,
    statusText,
    updateSession,
    startVoice,
    stopVoiceAndProcess,
    broadcastEmergencyPhrase,
    swapLanguages,
    submitText,
    speechRec,
  };
}
