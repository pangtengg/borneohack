from google.cloud import translate_v2 as translate

_client = None


def get_client():
    global _client
    if _client is None:
        _client = translate.Client()
    return _client


def translate_to_english(text: str, source_language: str | None = None) -> dict:
    client = get_client()
    kwargs = {"target_language": "en"}
    if source_language and source_language != "unknown":
        kwargs["source_language"] = source_language

    result = client.translate(text, **kwargs)
    return {
        "translated_text": result["translatedText"],
        "source_language": result.get(
            "detectedSourceLanguage", source_language or "unknown"
        ),
        "confidence": 1.0,
    }
