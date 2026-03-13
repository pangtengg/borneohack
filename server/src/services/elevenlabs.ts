import fetch from 'node-fetch';

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';

// Best ElevenLabs pre-made voices for each supported language.
// All voices use eleven_multilingual_v2 which handles any language,
// but different voice characters suit different language regions better.
const VOICE_BY_LANG: Record<string, string> = {
  en: 'pNInz6obpgDQGcFmaJgB', // Adam — deep, clear English male
  ms: '21m00Tcm4TlvDq8ikWAM', // Rachel — calm, clear female
  id: 'ErXwobaYiN019PkySvjV', // Antoni — clear male
  th: 'onwK4e9ZLuTAKqWW03F9', // Daniel — clear British male
  vi: 'N2lVS1w4EtoT3dr4eOWO', // Callum — clear male
  tl: 'iP95p4xoKVk53GoZ742B', // Chris — clear male
  my: 'nPczCjzI2devNBz1zQrb', // Brian — narrator, clear
  km: 'JBFqnCBsd6RMkjVDRZzb', // George — British male
  zh: 'XB0fDUnXU5powFXDhCwa', // Charlotte — clear female
  ar: 'VR6AewLTigWG4xSOukaG', // Arnold — deep male
};

const DEFAULT_VOICE = 'pNInz6obpgDQGcFmaJgB'; // Adam

function getVoiceId(lang: string): string {
  // Env override takes precedence only if no language mapping exists
  const envVoice = process.env.ELEVENLABS_VOICE_ID;
  return VOICE_BY_LANG[lang] ?? envVoice ?? DEFAULT_VOICE;
}

/**
 * Synthesize text to speech using ElevenLabs multilingual v2 model.
 * Selects the best voice for the given target language.
 */
export async function synthesizeSpeech(
  text: string,
  targetLang: string,
): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is not set');

  const voiceId = getVoiceId(targetLang);

  const res = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
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
