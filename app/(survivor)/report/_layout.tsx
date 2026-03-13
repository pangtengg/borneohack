import { Stack } from 'expo-router';

export default function ReportLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'My Reports' }} />
      <Stack.Screen name="new" options={{ title: 'New Report' }} />
      <Stack.Screen name="[id]" options={{ title: 'Report Detail' }} />
    </Stack>
  );
}
