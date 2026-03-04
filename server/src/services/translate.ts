import fetch from 'node-fetch';

const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';

/**
 * Translate text using Google Cloud Translate v2 REST API.
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang?: string,
): Promise<{ translatedText: string; detectedLang?: string }> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_TRANSLATE_API_KEY is not set');

  const params = new URLSearchParams({
    key: apiKey,
    q: text,
    target: targetLang,
    format: 'text',
  });
  if (sourceLang && sourceLang !== 'auto') {
    params.append('source', sourceLang);
  }

  const res = await fetch(`${GOOGLE_TRANSLATE_URL}?${params.toString()}`, {
    method: 'POST',
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Translate error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    data: {
      translations: Array<{ translatedText: string; detectedSourceLanguage?: string }>;
    };
  };

  const translation = data.data.translations[0];
  return {
    translatedText: translation.translatedText,
    detectedLang: translation.detectedSourceLanguage,
  };
}
