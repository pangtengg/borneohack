import { Router, Request, Response } from 'express';
import { transcribeAudio } from '../services/whisper';
import { translateText } from '../services/translate';
import { synthesizeSpeech } from '../services/elevenlabs';
import { detectLanguageFromCoords } from '../utils/languageMap';

export const translateRouter = Router();

interface TranslateBody {
  audioBase64: string;
  latitude: number;
  longitude: number;
  myLanguage: string;
  targetLanguage?: string;
}

translateRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { audioBase64, latitude, longitude, myLanguage, targetLanguage }: TranslateBody =
      req.body;

    if (!audioBase64) {
      res.status(400).json({ error: 'audioBase64 is required' });
      return;
    }

    // 1. Determine target language
    let resolvedTarget = targetLanguage;
    if (!resolvedTarget) {
      if (latitude != null && longitude != null) {
        const detected = detectLanguageFromCoords(latitude, longitude);
        resolvedTarget = detected.lang;
      } else {
        resolvedTarget = myLanguage ?? 'en';
      }
    }

    // 2. STT via Whisper
    const { text: sourceText, language: sourceLang } = await transcribeAudio(audioBase64);

    if (!sourceText.trim()) {
      res.status(422).json({ error: 'No speech detected in audio' });
      return;
    }

    // 3. Translate via Google Translate
    const { translatedText } = await translateText(sourceText, resolvedTarget, sourceLang);

    // 4. TTS via ElevenLabs
    const audioBase64Out = await synthesizeSpeech(translatedText, resolvedTarget);

    res.json({
      sourceText,
      sourceLang,
      translatedText,
      targetLang: resolvedTarget,
      audioBase64: audioBase64Out,
    });
  } catch (err: any) {
    console.error('[/api/translate]', err.message);
    res.status(500).json({ error: err.message ?? 'Internal server error' });
  }
});
