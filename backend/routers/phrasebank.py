import uuid

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from db.supabase_client import get_supabase
from services.audio_features import extract_mfcc, mfcc_to_json

router = APIRouter()


@router.post("/api/phrasebank/upload")
async def upload_phrase(
    audio: UploadFile = File(...),
    language_name: str = Form(...),
    language_code: str = Form(...),
    phrase_text: str = Form(...),
    meaning_en: str = Form(...),
    meaning_ms: str = Form(""),
    context_tag: str = Form("general"),
    recorded_by: str = Form(""),
):
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file")

    sb = get_supabase()
    file_id = str(uuid.uuid4())[:8]
    safe_name = phrase_text.replace(" ", "_").lower()[:20]
    storage_path = f"{language_code}/{safe_name}_{file_id}.wav"

    sb.storage.from_("ghost-phrases").upload(
        path=storage_path,
        file=audio_bytes,
        file_options={"content-type": "audio/wav"},
    )

    mfcc = extract_mfcc(audio_bytes)
    result = (
        sb.table("ghost_phrases")
        .insert(
            {
                "language_name": language_name,
                "language_code": language_code,
                "phrase_text": phrase_text,
                "meaning_en": meaning_en,
                "meaning_ms": meaning_ms,
                "context_tag": context_tag,
                "storage_path": storage_path,
                "mfcc_cache": mfcc_to_json(mfcc),
                "recorded_by": recorded_by,
            }
        )
        .execute()
    )

    import routers.process as proc

    proc._phrase_bank_cache = None
    return JSONResponse({"success": True, "id": result.data[0]["id"]})


@router.get("/api/phrasebank/list")
async def list_phrases():
    result = (
        get_supabase()
        .table("ghost_phrases")
        .select(
            "id, language_name, language_code, phrase_text, meaning_en, meaning_ms, "
            "context_tag, recorded_by, created_at"
        )
        .order("language_name")
        .execute()
    )
    return JSONResponse({"phrases": result.data or []})
