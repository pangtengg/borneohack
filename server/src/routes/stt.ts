import { Router, Request, Response } from 'express';
import multer from 'multer';
import { transcribeAudio } from '../services/whisper';

export const sttRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// Accept both JSON (audioBase64) and multipart form-data (audio file)
sttRouter.post('/', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    let audioBase64: string;

    if (req.file) {
      audioBase64 = req.file.buffer.toString('base64');
    } else if (req.body?.audioBase64) {
      audioBase64 = req.body.audioBase64;
    } else {
      res.status(400).json({ error: 'Audio is required (send as "audio" file or "audioBase64" JSON field)' });
      return;
    }

    const { text, language } = await transcribeAudio(audioBase64);
    if (!text.trim()) {
      res.status(422).json({ error: 'No speech detected' });
      return;
    }
    res.json({ text, language });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'STT failed';
    console.error('[/api/stt]', msg);
    res.status(500).json({ error: msg });
  }
});
