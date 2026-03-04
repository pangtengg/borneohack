import levenshtein from 'fast-levenshtein';
import { GlossaryPack, PatchResult, PatchReplacement } from '../types/dialect';

export function applyGlossaryPatch(
    transcript: string,
    installedGlossaries: GlossaryPack[],
    detectedDialectName: string | null
): PatchResult {
    const result: PatchResult = {
        patched: false,
        originalText: transcript,
        patchedText: transcript,
        changedEntries: [],
    };

    if (!detectedDialectName || !transcript.trim()) return result;

    // 1. Find active glossary
    const activeGlossary = installedGlossaries.find(g => g.dialect === detectedDialectName);
    if (!activeGlossary || activeGlossary.entries.length === 0) return result;

    let currentText = transcript;
    const changes: PatchReplacement[] = [];

    // Create word array, preserving punctuation by splitting on boundaries if needed,
    // but for simple fuzzy word match it's safest to isolate alphanumeric chunks.
    const words = currentText.split(/\s+/);

    // 2 & 3. Iterating glossary entries and finding closest words
    for (const entry of activeGlossary.entries) {
        const dialectWordTarget = entry.dialectPhrase.toLowerCase();

        // We update the words array slightly if we just replaced something, 
        // to search again against the "current" unpatched fragments
        const currentWords = currentText.split(/\s+/);

        for (let word of currentWords) {
            // Clean punctuation from word just for the comparison distance calculation
            const cleanWord = word.replace(/[.,!?^$*+\-=\[\]{}()|\\<>"'`;]/g, '').toLowerCase();
            if (!cleanWord) continue;

            const distance = levenshtein.get(cleanWord, dialectWordTarget);
            const maxLength = Math.max(cleanWord.length, dialectWordTarget.length);
            const similarity = maxLength === 0 ? 0 : (maxLength - distance) / maxLength;

            // 4. Check similarity >= 0.80
            if (similarity >= 0.80) {
                // Find the exact word sequence in currentText using Regex to replace case-insensitively
                // We ensure we replace the whole word boundary to avoid partial replacements.
                // We use the raw 'word' containing potential attached punctuation from split so we don't drop commas.
                const regex = new RegExp(`\\b${cleanWord}\\b`, 'gi');

                // Only replace if it actually exists in the string to avoid loops
                if (regex.test(currentText)) {
                    currentText = currentText.replace(regex, entry.canonical);
                    changes.push({ from: word, to: entry.canonical });
                }
            }
        }
    }

    // 6. Return PatchResult
    result.patchedText = currentText;
    result.changedEntries = changes;
    result.patched = changes.length > 0;

    return result;
}
