import io

import librosa
import numpy as np
import soundfile as sf


def extract_mfcc(audio_bytes: bytes, n_mfcc: int = 13, sr: int = 16000) -> np.ndarray:
    audio_buffer = io.BytesIO(audio_bytes)
    try:
        y, orig_sr = librosa.load(audio_buffer, sr=sr, mono=True)
    except Exception:
        audio_buffer.seek(0)
        data, orig_sr = sf.read(audio_buffer)
        if data.ndim > 1:
            data = data.mean(axis=1)
        y = librosa.resample(data.astype(np.float32), orig_sr=orig_sr, target_sr=sr)

    return librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)


def mfcc_to_json(mfcc: np.ndarray) -> list:
    return mfcc.tolist()


def mfcc_from_json(data: list) -> np.ndarray:
    return np.array(data, dtype=np.float32)
