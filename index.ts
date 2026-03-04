// ============================================================
// DISASTER VOICE BRIDGE — CORE TYPES
// ============================================================

export type SupportedLanguageCode =
  | 'en' | 'fil' | 'id' | 'vi' | 'th' | 'ms'
  | 'my' | 'km' | 'lo' | 'zh' | 'ja' | 'ko' | 'auto';

export interface Language {
  code: SupportedLanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  speechLang: string; // BCP 47 for Web Speech API
  country: string;
}

export type MessageRole = 'survivor' | 'responder' | 'system';
export type MessageStatus = 'listening' | 'translating' | 'done' | 'error';

export interface TranslationPair {
  original: string;
  translated: string;
  detectedLang: SupportedLanguageCode;
  targetLang: SupportedLanguageCode;
  toneRewritten?: string; // calm version if panic detected
  panicDetected?: boolean;
}

export interface Message {
  id: string;
  role: MessageRole;
  timestamp: Date;
  status: MessageStatus;
  translation: TranslationPair | null;
  audioUrl?: string; // ElevenLabs output
  isEmergencyPhrase?: boolean;
  emergencyLevel?: 'critical' | 'high' | 'medium';
}

export type SystemMode = 'standby' | 'listening' | 'processing' | 'speaking';

export interface SessionState {
  sessionId: string;
  mode: SystemMode;
  survivorLang: SupportedLanguageCode;
  responderLang: SupportedLanguageCode;
  autoDetect: boolean;
  locationDetected: ASEANRegion | null;
  messages: Message[];
  activeMessageId: string | null;
}

export interface ASEANRegion {
  country: string;
  dominantLang: SupportedLanguageCode;
  flag: string;
  lat: [number, number];
  lng: [number, number];
  commonDisasters: string[];
}

export interface EmergencyPhrase {
  id: string;
  en: string;
  icon: string;
  level: 'critical' | 'high' | 'medium';
  category: 'medical' | 'rescue' | 'location' | 'needs';
}

// API Request/Response types
export interface TranslateRequest {
  text: string;
  sourceLang: SupportedLanguageCode;
  targetLang: SupportedLanguageCode;
  rewriteTone: boolean;
}

export interface TranslateResponse {
  translated: string;
  detectedLang: SupportedLanguageCode;
  toneRewritten?: string;
  panicDetected: boolean;
  confidence: number;
}

export interface TTSRequest {
  text: string;
  lang: SupportedLanguageCode;
  calm: boolean; // force calm tone settings
}

export interface LogEntry {
  sessionId: string;
  messageId: string;
  timestamp: string;
  role: MessageRole;
  originalText: string;
  translatedText: string;
  fromLang: SupportedLanguageCode;
  toLang: SupportedLanguageCode;
  panicDetected: boolean;
  location?: string;
  emergencyLevel?: string;
}
