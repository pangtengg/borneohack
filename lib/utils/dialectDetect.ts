import { DetectedDialect } from '../types/dialect';

const DIALECT_KEYWORDS: Record<string, string[]> = {
    'Kelantan Malay': ['kawe', 'demo', 'napah', 'leh', 'tok', 'ghope', 'sokmo'],
    'Hokkien': ['ngai', 'goh', 'bo', 'lu', 'ai', 'khi', 'cheng', 'khoann'],
};

/**
 * Layer 1: Detects dialect based on keyword counts.
 * Returns the best matching dialect name and confidence (0.0 to 1.0).
 * If max confidence < 0.35, returns null.
 */
export function detectDialect(transcript: string): DetectedDialect {
    if (!transcript || transcript.trim().length === 0) {
        return { name: null, confidence: 0 };
    }

    const text = transcript.toLowerCase();

    let bestDialect: string | null = null;
    let bestConfidence = 0;

    for (const [dialectName, keywords] of Object.entries(DIALECT_KEYWORDS)) {
        let matchCount = 0;

        for (const kw of keywords) {
            // Use word boundary regex to avoid partial matches
            const regex = new RegExp(`\\b${kw}\\b`, 'g');
            const matches = text.match(regex);
            if (matches) {
                matchCount += matches.length;
            }
        }

        if (matchCount > 0) {
            // Base confidence logic
            // e.g. 1 match = 0.4, 2 matches = 0.7, 3+ matches = 1.0 (capped)
            let conf = matchCount * 0.35;

            // Boost if 2 or more keywords
            if (matchCount >= 2) conf += 0.2;

            conf = Math.min(conf, 1.0); // Cap at 1.0

            if (conf > bestConfidence) {
                bestConfidence = conf;
                bestDialect = dialectName;
            }
        }
    }

    if (bestConfidence < 0.35) {
        return { name: null, confidence: 0 };
    }

    return { name: bestDialect, confidence: bestConfidence };
}
