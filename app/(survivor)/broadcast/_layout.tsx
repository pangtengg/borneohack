import { Stack } from 'expo-router';

export default function BroadcastLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Broadcasts' }} />
      <Stack.Screen name="[id]" options={{ title: 'Broadcast' }} />
    </Stack>
  );
}
