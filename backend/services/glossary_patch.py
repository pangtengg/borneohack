from Levenshtein import distance as lev_distance

from db.supabase_client import get_supabase

LANG_TO_DIALECT = {
    "ms": "kelantan_malay",
    "id": "kelantan_malay",
    "zh": "penang_hokkien",
}

SUPPORTED_LANGS = set(LANG_TO_DIALECT.keys())


def fetch_glossary(dialect_id: str) -> list[dict]:
    result = (
        get_supabase()
        .table("glossary_entries")
        .select("*")
        .eq("dialect_id", dialect_id)
        .execute()
    )
    return result.data or []


def patch_transcript(transcript: str, language: str) -> dict:
    dialect_id = LANG_TO_DIALECT.get(language, "kelantan_malay")
    glossary = fetch_glossary(dialect_id)

    if not glossary:
        return {
            "patched_text": transcript,
            "patches_applied": [],
            "dialect_id": dialect_id,
        }

    tokens = transcript.lower().split()
    patched_tokens = list(tokens)
    patches_applied = []

    for idx, token in enumerate(tokens):
        clean = token.strip(".,!?;:")
        best_match = None
        best_dist = 999

        for entry in glossary:
            dist = lev_distance(clean, entry["slang"].lower())
            if dist <= 2 and dist < best_dist:
                best_dist = dist
                best_match = entry

        if best_match:
            patched_tokens[idx] = best_match["formal"]
            patches_applied.append(
                {
                    "from": clean,
                    "to": best_match["formal"],
                    "note": best_match.get("notes", ""),
                }
            )

    return {
        "patched_text": " ".join(patched_tokens),
        "patches_applied": patches_applied,
        "dialect_id": dialect_id,
    }
