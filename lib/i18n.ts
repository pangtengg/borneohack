import { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from './store';

const EN: Record<string, string> = {
  // Tabs
  'tab.home': 'Home',
  'tab.profile': 'Profile',
  'tab.settings': 'Settings',

  // Home
  'home.title': 'Disaster Voice Bridge',
  'home.subtitle': 'Choose an action below to communicate during emergencies',
  'home.report': 'Report',
  'home.report.desc': 'Make a report. Talk to AI, answer questions.',
  'home.convo': 'Convo',
  'home.convo.desc': 'Chat with officers. Voice & text translation.',
  'home.broadcast': 'Broadcast',
  'home.broadcast.desc': 'Location-based emergency broadcasts.',

  // Profile
  'profile.section.personal': 'PERSONAL INFORMATION',
  'profile.display_name': 'Display name',
  'profile.email': 'Email address',
  'profile.phone': 'Phone number',
  'profile.age': 'Age',
  'profile.gender': 'Gender',
  'profile.nationality': 'Nationality',
  'profile.section.emergency': 'EMERGENCY INFORMATION',
  'profile.address': 'Residential address',
  'profile.medical': 'Medical conditions',
  'profile.emergency.name': 'Emergency contact name',
  'profile.emergency.phone': 'Emergency contact phone',
  'profile.section.language': 'PREFERRED LANGUAGE',
  'profile.save': 'Save profile',
  'profile.saving': 'Saving...',
  'profile.saved': 'Your profile has been updated.',

  // Report
  'report.title': 'Reports',
  'report.empty': 'No reports yet',
  'report.empty.desc': 'Tap + to create your first disaster report with AI guidance.',
  'report.loading': 'Loading reports...',
  'report.new': 'New Report',
  'report.type.input': 'Type your answer...',

  // Settings
  'settings.dialect': 'DIALECT BANK',
  'settings.signout': 'Sign Out',
  'settings.about': 'ABOUT VOICEBRIDGE',

  // Common
  'common.male': 'Male',
  'common.female': 'Female',
  'common.other': 'Other',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
};

let activeFetch: string | null = null;
const fetchedLangs = new Set<string>();

export function useT(): (key: string) => string {
  const myLanguage = useAppStore((s) => s.myLanguage);
  const serverUrl = useAppStore((s) => s.serverUrl);
  const uiTranslations = useAppStore((s) => s.uiTranslations);
  const setUiTranslations = useAppStore((s) => s.setUiTranslations);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (myLanguage === 'en') {
      setUiTranslations({});
      fetchedLangs.delete(myLanguage);
      return;
    }
    if (fetchedLangs.has(myLanguage)) return;
    if (activeFetch === myLanguage) return;
    activeFetch = myLanguage;

    const keys = Object.keys(EN);
    const texts = Object.values(EN);

    fetch(`${serverUrl}/api/translate-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, targetLang: myLanguage }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(({ translations }: { translations: string[] }) => {
        const result: Record<string, string> = {};
        keys.forEach((k, i) => {
          result[k] = translations[i] ?? EN[k];
        });
        fetchedLangs.add(myLanguage);
        setUiTranslations(result);
      })
      .catch(() => {})
      .finally(() => {
        activeFetch = null;
      });
  }, [myLanguage, serverUrl, setUiTranslations]);

  return useCallback(
    (key: string) => {
      if (myLanguage === 'en') return EN[key] ?? key;
      return uiTranslations[key] ?? EN[key] ?? key;
    },
    [myLanguage, uiTranslations]
  );
}

export { EN as UI_STRINGS };
