// @ts-nocheck
import type { TranslateRequest, TranslateResponse, SupportedLanguageCode } from '../types';
import { LANG_MAP, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, CALM_VOICE_SETTINGS } from '../utils/constants';

const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string;

// ─── Translation + Tone Rewrite via Claude ──────────────────────────────────

export async function translateAndRewrite(req: TranslateRequest): Promise<TranslateResponse> {
  const targetLangName = LANG_MAP[req.targetLang]?.name ?? req.targetLang;
  const sourceLangName = req.sourceLang === 'auto'
    ? 'auto-detect'
    : (LANG_MAP[req.sourceLang]?.name ?? req.sourceLang);

  const systemPrompt = `You are an emergency disaster communication AI for ASEAN countries.
Your job:
1. Detect the language of the input text
2. Translate it accurately to ${targetLangName}
3. If the message sounds panicked or fragmented, also produce a calm, clear version for emergency responders

Respond ONLY with a JSON object in this exact shape:
{
  "detectedLang": "<ISO 639-1 code>",
  "translated": "<translated text>",
  "panicDetected": <true|false>,
  "toneRewritten": "<calm authoritative version if panic detected, else null>",
  "confidence": <0.0-1.0>
}

Rules:
- Keep the meaning 100% intact — only rewrite the TONE, not facts
- Calm rewrite should sound like a professional emergency dispatcher
- If source lang is already ${targetLangName}, still return it in translated field
- Always return valid JSON, nothing else`;

  const userMessage = `Source language hint: ${sourceLangName}
Text to translate: "${req.text}"`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.content?.[0]?.text ?? '{}';

  try {
    const clean = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean) as TranslateResponse;
    return parsed;
  } catch {
    return {
      translated: req.text,
      detectedLang: req.sourceLang === 'auto' ? 'en' : req.sourceLang,
      panicDetected: false,
      confidence: 0.5,
    };
  }
}

// ─── Language Detection Only ─────────────────────────────────────────────────

export async function detectLanguage(text: string): Promise<SupportedLanguageCode> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 50,
      system: 'Detect the language of this text. Respond with ONLY the ISO 639-1 language code (e.g. "en", "fil", "id", "vi", "th", "ms"). Nothing else.',
      messages: [{ role: 'user', content: text }],
    }),
  });
  const data = await response.json();
  const code = data.content?.[0]?.text?.trim() ?? 'en';
  return code as SupportedLanguageCode;
}

// ─── ElevenLabs TTS ──────────────────────────────────────────────────────────

export async function synthesizeSpeech(text: string): Promise<HTMLAudioElement> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: CALM_VOICE_SETTINGS,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs error ${response.status}: ${err}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  return new Audio(url);
}

export async function playAudio(audio: HTMLAudioElement): Promise<void> {
  return new Promise((resolve, reject) => {
    audio.onended = () => resolve();
    audio.onerror = reject;
    audio.play().catch(reject);
  });
}
