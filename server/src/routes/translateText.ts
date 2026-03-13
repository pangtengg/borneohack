import { Router, Request, Response } from 'express';
import { translateText } from '../services/translate';

export const translateTextRouter = Router();

interface TranslateTextBody {
  texts: string[];
  targetLang: string;
}

translateTextRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { texts, targetLang }: TranslateTextBody = req.body;
    if (!Array.isArray(texts) || !texts.length || !targetLang) {
      res.status(400).json({ error: 'texts array and targetLang are required' });
      return;
    }

    if (targetLang === 'en') {
      res.json({ translations: texts });
      return;
    }

    const SEPARATOR = '\n|||SPLIT|||\n';
    const combined = texts.join(SEPARATOR);
    const { translatedText } = await translateText(combined, targetLang, 'en');
    const translations = translatedText.split(/\n?\|\|\|SPLIT\|\|\|\n?/);

    // Pad if split produced fewer results
    while (translations.length < texts.length) {
      translations.push(texts[translations.length]);
    }

    res.json({ translations: translations.slice(0, texts.length) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Batch translation failed';
    console.error('[/api/translate-text]', msg);
    res.status(500).json({ error: msg });
  }
});
