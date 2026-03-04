import { create } from 'zustand';
import { DetectedLanguage } from './languageMap';

interface AppState {
  detectedLanguage: DetectedLanguage | null;
  myLanguage: string;
  myLanguageLabel: string;
  myLanguageFlag: string;
  setDetectedLanguage: (lang: DetectedLanguage) => void;
  setMyLanguage: (code: string, label: string, flag: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  detectedLanguage: null,
  myLanguage: 'en',
  myLanguageLabel: 'English',
  myLanguageFlag: '🇬🇧',
  setDetectedLanguage: (lang) => set({ detectedLanguage: lang }),
  setMyLanguage: (code, label, flag) =>
    set({ myLanguage: code, myLanguageLabel: label, myLanguageFlag: flag }),
}));
