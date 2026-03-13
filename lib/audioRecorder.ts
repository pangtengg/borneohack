import { Audio } from 'expo-av';

let recording: Audio.Recording | null = null;

export async function startRecording(): Promise<void> {
  const { status } = await Audio.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Microphone permission is required for voice input.');
  }
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording: rec } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY,
  );
  recording = rec;
}

export async function stopRecording(): Promise<{ uri: string; durationMillis: number } | null> {
  if (!recording) return null;

  const status = await recording.getStatusAsync();
  const durationMillis = status.durationMillis ?? 0;

  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  recording = null;

  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

  if (!uri) return null;

  return { uri, durationMillis };
}

export function isRecording(): boolean {
  return recording !== null;
}
