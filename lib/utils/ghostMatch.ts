import levenshtein from 'fast-levenshtein';
import { GhostMatchResult, GhostPack } from '../types/dialect';

export function tryGhostMatch(
    audioMeta: { durationSeconds: number },
    transcript: string,
    installedGhostPacks: GhostPack[],
    detectedDialectName: string | null
): GhostMatchResult {
    if (!detectedDialectName || !transcript.trim()) return { found: false };

    // 1. Find active pack matching current dialect
    const activePack = installedGhostPacks.find(p => p.dialect === detectedDialectName);
    if (!activePack) return { found: false };

    const transcriptLower = transcript.toLowerCase().trim();

    // 2. Loop phrases
    for (const phrase of activePack.phrases) {
        // 3. Audio duration check
        if (
            audioMeta.durationSeconds >= phrase.minLength &&
            audioMeta.durationSeconds <= phrase.maxLength
        ) {
            // 4 & 5. Levenshtein calculation
            const targetLower = phrase.dialectText.toLowerCase();
            const distance = levenshtein.get(transcriptLower, targetLower);
            const maxLength = Math.max(transcriptLower.length, targetLower.length);

            const similarity = maxLength === 0 ? 0 : (maxLength - distance) / maxLength;

            // 6. Threshold check
            if (similarity >= 0.82) {
                return {
                    found: true,
                    canonical: phrase.canonical,
                    dialectText: phrase.dialectText,
                    confidence: similarity,
                    context: phrase.context,
                };
            }
        }
    }

    // 7. No match
    return { found: false };
}
