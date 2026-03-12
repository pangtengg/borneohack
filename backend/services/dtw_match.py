import numpy as np
from dtw import dtw as compute_dtw

MAX_DTW_DISTANCE = 8000.0


def dtw_distance(mfcc_a: np.ndarray, mfcc_b: np.ndarray) -> float:
    alignment = compute_dtw(mfcc_a.T, mfcc_b.T, keep_internals=False)
    return float(alignment.distance)


def distance_to_confidence(distance: float) -> float:
    if distance <= 0:
        return 1.0
    return float(max(0.0, 1.0 - (distance / MAX_DTW_DISTANCE)))


def find_closest_phrase(query_mfcc: np.ndarray, phrase_bank: list[dict]) -> dict:
    if not phrase_bank:
        return {"phrase": None, "distance": float("inf"), "confidence": 0.0}

    best_phrase = None
    best_distance = float("inf")
    for phrase in phrase_bank:
        ref_mfcc = phrase.get("mfcc")
        if ref_mfcc is None:
            continue
        try:
            dist = dtw_distance(query_mfcc, ref_mfcc)
            if dist < best_distance:
                best_distance = dist
                best_phrase = phrase
        except Exception:
            continue

    return {
        "phrase": best_phrase,
        "distance": best_distance,
        "confidence": distance_to_confidence(best_distance),
    }
