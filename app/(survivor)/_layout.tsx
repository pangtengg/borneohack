import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useProfile } from '@/lib/auth/useProfile';
import { useAppStore } from '@/lib/store';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';

export default function SurvivorLayout() {
  const { profile } = useProfile();

  useEffect(() => {
    if (!profile) return;
    const langCode = profile.preferred_language ?? 'en';
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === langCode) ?? SUPPORTED_LANGUAGES[0];
    useAppStore.getState().setMyLanguage(langCode, lang.label, lang.flag);
  }, [profile]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="report" options={{ headerShown: true, title: 'Report' }} />
      <Stack.Screen name="convo" options={{ headerShown: true, title: 'Convo' }} />
      <Stack.Screen name="broadcast" options={{ headerShown: true, title: 'Broadcast' }} />
      <Stack.Screen name="phrases" options={{ headerShown: true, title: 'Phrase Bank' }} />
    </Stack>
  );
}
