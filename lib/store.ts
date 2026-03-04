import { create } from 'zustand';
import { DetectedLanguage } from './languageMap';
import { CountryInfo } from './countryDetect';
import { GhostPack, GlossaryPack, DetectedDialect } from './types/dialect';

interface AppState {
  // Existing
  detectedLanguage: DetectedLanguage | null;
  myLanguage: string;
  myLanguageLabel: string;
  myLanguageFlag: string;
  setDetectedLanguage: (lang: DetectedLanguage) => void;
  setMyLanguage: (code: string, label: string, flag: string) => void;

  // Country detection (IP-based)
  detectedCountry: CountryInfo | null;
  setDetectedCountry: (country: CountryInfo) => void;

  // Auto target language (from IP detection)
  targetLanguage: string;
  targetLanguageLabel: string;
  targetLanguageFlag: string;
  setTargetLanguage: (code: string, label: string, flag: string) => void;

  // Panic mode
  panicMode: boolean;
  setPanicMode: (on: boolean) => void;

  // Dialect System
  ghostEnabled: boolean;
  dialectEnabled: boolean;
  detectedDialect: DetectedDialect;
  installedGhostPacks: GhostPack[];
  installedGlossaries: GlossaryPack[];

  setGhostEnabled: (enabled: boolean) => void;
  setDialectEnabled: (enabled: boolean) => void;
  setDetectedDialect: (dialect: DetectedDialect) => void;
  addGhostPack: (pack: GhostPack) => void;
  addGlossaryPack: (pack: GlossaryPack) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Existing
  detectedLanguage: null,
  myLanguage: 'en',
  myLanguageLabel: 'English',
  myLanguageFlag: '🇬🇧',
  setDetectedLanguage: (lang) => set({ detectedLanguage: lang }),
  setMyLanguage: (code, label, flag) =>
    set({ myLanguage: code, myLanguageLabel: label, myLanguageFlag: flag }),

  // Country detection
  detectedCountry: null,
  setDetectedCountry: (country) =>
    set({
      detectedCountry: country,
      targetLanguage: country.langCode,
      targetLanguageLabel: country.langLabel,
      targetLanguageFlag: country.langFlag,
    }),

  // Target language
  targetLanguage: 'ms',
  targetLanguageLabel: 'Malay',
  targetLanguageFlag: '🇲🇾',
  setTargetLanguage: (code, label, flag) =>
    set({ targetLanguage: code, targetLanguageLabel: label, targetLanguageFlag: flag }),

  // Panic mode
  panicMode: false,
  setPanicMode: (on) => set({ panicMode: on }),

  // Dialect System
  ghostEnabled: false,
  dialectEnabled: false,
  detectedDialect: { name: null, confidence: 0 },
  installedGhostPacks: [],
  installedGlossaries: [],

  setGhostEnabled: (enabled) => set({ ghostEnabled: enabled }),
  setDialectEnabled: (enabled) => set({ dialectEnabled: enabled }),
  setDetectedDialect: (dialect) => set({ detectedDialect: dialect }),
  addGhostPack: (pack) =>
    set((state) => ({
      installedGhostPacks: [...state.installedGhostPacks.filter(p => p.packId !== pack.packId), pack],
    })),
  addGlossaryPack: (pack) =>
    set((state) => ({
      installedGlossaries: [...state.installedGlossaries.filter(p => p.packId !== pack.packId), pack],
    })),
}));
