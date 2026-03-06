import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

let currentSound: Audio.Sound | null = null;

export async function playBase64Audio(base64: string): Promise<void> {
  if (currentSound) {
    await currentSound.unloadAsync();
    currentSound = null;
  }

  // Write base64 to a temp file using the standard file system API
  const tmpUri = FileSystem.cacheDirectory + `tts_${Date.now()}.mp3`;
  await FileSystem.writeAsStringAsync(tmpUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
  });

  const { sound } = await Audio.Sound.createAsync({ uri: tmpUri });
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
