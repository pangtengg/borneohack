import { Router, Request, Response } from 'express';
import { translateText } from '../services/translate';
import { synthesizeSpeech } from '../services/elevenlabs';

export const phrasesRouter = Router();

// In-memory cache: "phraseKey:targetLang" -> { translatedText, audioBase64 }
const cache = new Map<string, { translatedText: string; audioBase64: string }>();

interface PhraseBody {
  phraseKey: string;
  phraseText: string;
  targetLang: string;
}

phrasesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { phraseKey, phraseText, targetLang }: PhraseBody = req.body;

    if (!phraseText || !targetLang) {
      res.status(400).json({ error: 'phraseText and targetLang are required' });
      return;
    }

    const cacheKey = `${phraseKey}:${targetLang}`;

    // Return from cache if available
    if (cache.has(cacheKey)) {
      res.json(cache.get(cacheKey));
      return;
    }

    // Translate
    const { translatedText } = await translateText(phraseText, targetLang, 'en');

    // TTS
    const audioBase64 = await synthesizeSpeech(translatedText, targetLang);

    const result = { translatedText, audioBase64 };
    cache.set(cacheKey, result);

    res.json(result);
  } catch (err: any) {
    console.error('[/api/phrase]', err.message);
    res.status(500).json({ error: err.message ?? 'Internal server error' });
  }
});
