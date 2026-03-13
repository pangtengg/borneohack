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

export async function stopRecording(): Promise<{ base64: string; durationMillis: number; uri: string } | null> {
  if (!recording) return null;

  const status = await recording.getStatusAsync();
  const durationMillis = status.durationMillis ?? 0;

  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  recording = null;

  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

  if (!uri) return null;

  // Read file and convert to base64
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve({ base64, durationMillis, uri });
    };
    reader.readAsDataURL(blob);
  });
}

export function isRecording(): boolean {
  return recording !== null;
}
