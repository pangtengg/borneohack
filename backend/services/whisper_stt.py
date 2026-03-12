import os
import tempfile
from pathlib import Path

import whisper

_model = None


def get_model():
    global _model
    if _model is None:
        _model = whisper.load_model(os.getenv("WHISPER_MODEL", "base"))
    return _model


def transcribe(audio_bytes: bytes, suffix: str = ".webm") -> dict:
    model = get_model()
    if not suffix.startswith("."):
        suffix = f".{suffix}"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        result = model.transcribe(tmp_path, fp16=False)
        language = result.get("language", "unknown")
        language_prob = float(result.get("language_probs", {}).get(language, 0.0))
        return {
            "transcript": result.get("text", "").strip(),
            "language": language,
            "language_prob": language_prob,
        }
    except Exception:
        return {"transcript": "", "language": "unknown", "language_prob": 0.0}
    finally:
        Path(tmp_path).unlink(missing_ok=True)
