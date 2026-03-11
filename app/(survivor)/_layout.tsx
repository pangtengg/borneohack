import { Stack } from 'expo-router';

export default function SurvivorLayout() {
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
