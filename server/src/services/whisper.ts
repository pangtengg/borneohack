import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface WhisperResult {
  text: string;
  language: string;
}

/**
 * Transcribe a base64-encoded audio file using OpenAI Whisper.
 * Whisper auto-detects the source language.
 */
export async function transcribeAudio(audioBase64: string): Promise<WhisperResult> {
  // Write base64 to a temp .m4a file (expo-av records m4a on iOS, webm on Android)
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `voicebridge_${Date.now()}.m4a`);

  const buffer = Buffer.from(audioBase64, 'base64');
  fs.writeFileSync(tmpFile, buffer);

  try {
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tmpFile) as any,
      model: 'whisper-1',
      response_format: 'verbose_json',
    });

    return {
      text: response.text,
      language: (response as any).language ?? 'en',
    };
  } finally {
    fs.unlinkSync(tmpFile);
  }
}
