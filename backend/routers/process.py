import os
import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from db.supabase_client import get_supabase
from services.audio_features import extract_mfcc, mfcc_from_json, mfcc_to_json
from services.dtw_match import find_closest_phrase
from services.glossary_patch import SUPPORTED_LANGS, patch_transcript
from services.google_translate import translate_to_english
from services.whisper_stt import transcribe

router = APIRouter()
_phrase_bank_cache: list[dict] | None = None


async def get_phrase_bank() -> list[dict]:
    global _phrase_bank_cache
    if _phrase_bank_cache is not None:
        return _phrase_bank_cache

    sb = get_supabase()
    result = sb.table("ghost_phrases").select("*").execute()
    phrases = result.data or []

    bank = []
    for phrase in phrases:
        mfcc = None
        if phrase.get("mfcc_cache"):
            try:
                mfcc = mfcc_from_json(phrase["mfcc_cache"])
            except Exception:
                mfcc = None

        if mfcc is None:
            try:
                wav = sb.storage.from_("ghost-phrases").download(phrase["storage_path"])
                mfcc = extract_mfcc(wav)
                (
                    sb.table("ghost_phrases")
                    .update({"mfcc_cache": mfcc_to_json(mfcc)})
                    .eq("id", phrase["id"])
                    .execute()
                )
            except Exception:
                continue

        bank.append({**phrase, "mfcc": mfcc})

    _phrase_bank_cache = bank
    return bank


def log_translation(
    layer: str,
    transcript: str,
    lang: str,
    patched: str,
    output: str,
    confidence: float,
) -> None:
    try:
        (
            get_supabase()
            .table("translation_logs")
            .insert(
                {
                    "layer_used": layer,
                    "raw_transcript": transcript,
                    "detected_lang": lang,
                    "patched_text": patched,
                    "final_output": output,
                    "confidence": confidence,
                    "session_id": str(uuid.uuid4()),
                }
            )
            .execute()
        )
    except Exception:
        pass


@router.post("/api/process")
async def process_audio(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file")

    suffix = Path(audio.filename or "recording.webm").suffix or ".webm"
    stt_result = transcribe(audio_bytes, suffix=suffix)
    transcript = stt_result["transcript"]
    language = stt_result["language"]
    lang_prob = stt_result["language_prob"]

    use_layer1 = transcript.strip() != "" and language in SUPPORTED_LANGS and lang_prob > 0.5

    if use_layer1:
        patch_result = patch_transcript(transcript, language)
        patched_text = patch_result["patched_text"]
        translated = translate_to_english(patched_text, language)
        translation = translated["translated_text"]
        confidence = 0.85 + (lang_prob * 0.15)

        log_translation(
            "dialect_translator",
            transcript,
            language,
            patched_text,
            translation,
            confidence,
        )

        return JSONResponse(
            {
                "layer": "dialect_translator",
                "transcript": transcript,
                "detected_lang": language,
                "lang_confidence": lang_prob,
                "dialect_id": patch_result["dialect_id"],
                "patches_applied": patch_result["patches_applied"],
                "patched_text": patched_text,
                "translation": translation,
                "confidence": round(confidence, 3),
            }
        )

    query_mfcc = extract_mfcc(audio_bytes)
    phrase_bank = await get_phrase_bank()
    threshold = float(os.getenv("GHOST_CONFIDENCE_THRESHOLD", "0.35"))
    match = find_closest_phrase(query_mfcc, phrase_bank)

    if match["phrase"] is None or match["confidence"] < threshold:
        log_translation("ghost_interpreter", transcript, language, "", "no_match", 0.0)
        return JSONResponse(
            {
                "layer": "ghost_interpreter",
                "matched": False,
                "message": "No phrase match found in community phrase bank.",
                "whisper_transcript": transcript,
            }
        )

    phrase = match["phrase"]
    confidence = match["confidence"]
    log_translation(
        "ghost_interpreter",
        transcript,
        language,
        phrase["phrase_text"],
        phrase["meaning_en"],
        confidence,
    )

    return JSONResponse(
        {
            "layer": "ghost_interpreter",
            "matched": True,
            "language_name": phrase["language_name"],
            "language_code": phrase["language_code"],
            "phrase_text": phrase["phrase_text"],
            "meaning_en": phrase["meaning_en"],
            "meaning_ms": phrase.get("meaning_ms", ""),
            "context_tag": phrase.get("context_tag", "general"),
            "recorded_by": phrase.get("recorded_by", "Community Elder"),
            "confidence": round(confidence, 3),
            "dtw_distance": round(match["distance"], 2),
        }
    )
