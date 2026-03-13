import { Router, Request, Response } from 'express';
import { synthesizeSpeech } from '../services/elevenlabs';

export const ttsRouter = Router();

interface TtsBody {
  text: string;
  lang?: string;
}

ttsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { text, lang = 'en' }: TtsBody = req.body;
    if (!text?.trim()) {
      res.status(400).json({ error: 'text is required' });
      return;
    }
    const audioBase64 = await synthesizeSpeech(text, lang);
    res.json({ audioBase64 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'TTS failed';
    console.error('[/api/tts]', msg);
    res.status(500).json({ error: msg });
  }
});
