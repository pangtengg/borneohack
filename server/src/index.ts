import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { translateRouter } from './routes/translate';
import { phrasesRouter } from './routes/phrases';

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

app.listen(PORT, () => {
  console.log(`\n🌏 VoiceBridge API running on http://localhost:${PORT}`);
  console.log(`   GET  /health`);
  console.log(`   POST /api/translate`);
  console.log(`   POST /api/phrase\n`);
});
