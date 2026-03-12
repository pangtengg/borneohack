import { useAppStore } from './store';

function getBaseUrl(): string {
  return useAppStore.getState().serverUrl;
}

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

export interface Layer1Response {
  layer: 'dialect_translator';
  transcript: string;
  detected_lang: string;
  lang_confidence: number;
  dialect_id: string;
  patches_applied: Array<{ from: string; to: string; note?: string }>;
  patched_text: string;
  translation: string;
  confidence: number;
}

export interface Layer2MatchedResponse {
  layer: 'ghost_interpreter';
  matched: true;
  language_name: string;
  language_code: string;
  phrase_text: string;
  meaning_en: string;
  meaning_ms: string;
  context_tag: string;
  recorded_by: string;
  confidence: number;
  dtw_distance: number;
}

export interface Layer2NoMatchResponse {
  layer: 'ghost_interpreter';
  matched: false;
  message: string;
  whisper_transcript: string;
}

export type DialectProcessResponse =
  | Layer1Response
  | Layer2MatchedResponse
  | Layer2NoMatchResponse;

export interface PhraseBankRow {
  id: string;
  language_name: string;
  language_code: string;
  phrase_text: string;
  meaning_en: string;
  meaning_ms?: string;
  context_tag: string;
  recorded_by?: string;
  created_at: string;
}

export interface UploadPhraseRequest {
  audioUri: string;
  language_name: string;
  language_code: string;
  phrase_text: string;
  meaning_en: string;
  meaning_ms?: string;
  context_tag?: 'emergency' | 'medical' | 'location' | 'food' | 'general';
  recorded_by?: string;
}

export async function translateSpeech(req: TranslateRequest): Promise<TranslateResponse> {
  const res = await fetch(`${getBaseUrl()}/api/translate`, {
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
  const res = await fetch(`${getBaseUrl()}/api/phrase`, {
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

export async function processDialectAudio(audioUri: string): Promise<DialectProcessResponse> {
  const formData = new FormData();
  formData.append('audio', {
    uri: audioUri,
    name: 'recording.m4a',
    type: 'audio/m4a',
  } as any);

  const res = await fetch(`${getBaseUrl()}/api/process`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dialect processing failed: ${err}`);
  }
  return res.json();
}

export async function listPhraseBank(): Promise<PhraseBankRow[]> {
  const res = await fetch(`${getBaseUrl()}/api/phrasebank/list`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Phrase bank fetch failed: ${err}`);
  }
  const data = await res.json();
  return data.phrases ?? [];
}

export async function uploadPhraseBankEntry(
  input: UploadPhraseRequest,
): Promise<{ success: boolean; id: string }> {
  const formData = new FormData();
  formData.append('audio', {
    uri: input.audioUri,
    name: 'phrase.wav',
    type: 'audio/wav',
  } as any);
  formData.append('language_name', input.language_name);
  formData.append('language_code', input.language_code);
  formData.append('phrase_text', input.phrase_text);
  formData.append('meaning_en', input.meaning_en);
  formData.append('meaning_ms', input.meaning_ms ?? '');
  formData.append('context_tag', input.context_tag ?? 'general');
  formData.append('recorded_by', input.recorded_by ?? '');

  const res = await fetch(`${getBaseUrl()}/api/phrasebank/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Phrase upload failed: ${err}`);
  }
  return res.json();
}
