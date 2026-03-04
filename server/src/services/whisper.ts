import fetch from 'node-fetch';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

export interface WhisperResult {
  text: string;
  language: string;
}

/**
 * Transcribe a base64-encoded audio file using Groq API (Whisper model).
 * Whisper auto-detects the source language.
 */
export async function transcribeAudio(audioBase64: string): Promise<WhisperResult> {
  // Write base64 to a temp .m4a file (expo-av records m4a on iOS, webm on Android)
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `voicebridge_${Date.now()}.m4a`);

  const buffer = Buffer.from(audioBase64, 'base64');
  fs.writeFileSync(tmpFile, buffer);

  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(tmpFile), {
      filename: 'audio.m4a',
      contentType: 'audio/m4a',
    });
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'verbose_json');

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Groq API error ${response.status}: ${errorBody}`);
    }

    const data = (await response.json()) as {
      text: string;
      language?: string;
    };

    return {
      text: data.text,
      language: data.language ?? 'en',
    };
  } finally {
    fs.unlinkSync(tmpFile);
  }
}
