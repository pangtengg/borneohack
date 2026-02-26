import fetch from 'node-fetch';

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';

/**
 * Synthesize text to speech using ElevenLabs multilingual v2 model.
 * Uses the pre-configured calm "relief coordinator" voice.
 * Returns base64-encoded MP3 audio.
 */
export async function synthesizeSpeech(
  text: string,
  targetLang: string,
): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? 'pNInz6obpgDQGcFmaJgB'; // Default: Adam

  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is not set');

  // Prepend a language hint for ElevenLabs multilingual model when not English
  const promptText = buildLanguagePrompt(text, targetLang);

  const res = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: promptText,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        // Low stability = more consistent calm authoritative tone
        stability: 0.85,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs error ${res.status}: ${body}`);
  }

  const buffer = await res.buffer();
  return buffer.toString('base64');
}

/**
 * For non-English languages, ElevenLabs multilingual v2 sometimes needs a hint.
 * We prepend an invisible language tag comment to guide the model.
 */
function buildLanguagePrompt(text: string, lang: string): string {
  // ElevenLabs v2 is smart enough to detect language from text,
  // but we keep the text clean — no prefix needed.
  return text;
}
