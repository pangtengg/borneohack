import { Stack } from 'expo-router';

export default function AuthorityLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Authority Dashboard' }} />
    </Stack>
  );
}
