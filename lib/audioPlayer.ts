import { Audio } from 'expo-av';
import { File, Paths } from 'expo-file-system';

let currentSound: Audio.Sound | null = null;

export async function playBase64Audio(base64: string): Promise<void> {
  if (currentSound) {
    await currentSound.unloadAsync();
    currentSound = null;
  }

  // Write base64 to a temp file using the new expo-file-system API
  const tmpFile = new File(Paths.cache, `tts_${Date.now()}.mp3`);
  tmpFile.write(base64AsBytes(base64));

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
  });

  const { sound } = await Audio.Sound.createAsync({ uri: tmpFile.uri });
  currentSound = sound;
  await sound.playAsync();
}

export async function stopAudio(): Promise<void> {
  if (currentSound) {
    await currentSound.stopAsync();
    await currentSound.unloadAsync();
    currentSound = null;
  }
}

function base64AsBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
