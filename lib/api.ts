import Constants from 'expo-constants';

const BASE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:3001';

export interface TranslateRequest {
  audioBase64: string;
  latitude: number;
  longitude: number;
  myLanguage: string;
  targetLanguage?: string;
}

export interface TranslateResponse {
  sourceText: string;
  sourceLang: string;
  translatedText: string;
  targetLang: string;
  audioBase64: string;
}

export interface PhraseRequest {
  phraseKey: string;
  phraseText: string;
  targetLang: string;
}

export interface PhraseResponse {
  translatedText: string;
  audioBase64: string;
}

export async function translateSpeech(req: TranslateRequest): Promise<TranslateResponse> {
  const res = await fetch(`${BASE_URL}/api/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Translation failed: ${err}`);
  }
  return res.json();
}

export async function translatePhrase(req: PhraseRequest): Promise<PhraseResponse> {
  const res = await fetch(`${BASE_URL}/api/phrase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Phrase translation failed: ${err}`);
  }
  return res.json();
}
