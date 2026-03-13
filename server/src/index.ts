import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { translateRouter } from './routes/translate';
import { phrasesRouter } from './routes/phrases';
import { reportChatRouter } from './routes/reportChat';
import { ttsRouter } from './routes/tts';
import { translateTextRouter } from './routes/translateText';
import { sttRouter } from './routes/stt';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(cors());
// Increase body size limit for base64 audio (up to 25MB)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'VoiceBridge API', timestamp: new Date().toISOString() });
});

app.use('/api/translate', translateRouter);
app.use('/api/phrase', phrasesRouter);
app.use('/api/report-chat', reportChatRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/translate-text', translateTextRouter);
app.use('/api/stt', sttRouter);

app.listen(PORT, () => {
  console.log(`\n🌏 VoiceBridge API running on http://localhost:${PORT}`);
  console.log(`   GET  /health`);
  console.log(`   POST /api/translate`);
  console.log(`   POST /api/phrase`);
  console.log(`   POST /api/report-chat`);
  console.log(`   POST /api/tts`);
  console.log(`   POST /api/translate-text`);
  console.log(`   POST /api/stt\n`);
});
