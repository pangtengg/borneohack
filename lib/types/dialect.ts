export interface GhostPhrase {
    id: string;
    dialectText: string;
    canonical: string; // The canonical translation (e.g. English or standard Malay)
    canonicalLanguage: string;
    context?: string;
    minLength: number; // Minimum audio duration in seconds
    maxLength: number; // Maximum audio duration in seconds
    audioFile?: string; // TBD: path or URI
    phoneticHint?: string;
}

export interface GhostPack {
    packId: string;
    dialect: string;
    region: string;
    sourceNgo?: string;
    languageMajor?: string;
    phrases: GhostPhrase[];
}

export interface GlossaryEntry {
    dialectPhrase: string;
    canonical: string;
    context?: string;
    notes?: string;
}

export interface GlossaryPack {
    packId: string;
    dialect: string;
    region?: string;
    sourceNgo?: string;
    entries: GlossaryEntry[];
}

export interface DetectedDialect {
    name: string | null;
    confidence: number; // 0.0 to 1.0
}

export type GhostMatchResult =
    | { found: false }
    | {
        found: true;
        canonical: string;
        dialectText: string;
        confidence: number;
        context?: string;
    };

export interface PatchReplacement {
    from: string;
    to: string;
}

export interface PatchResult {
    patched: boolean;
    originalText: string;
    patchedText: string;
    changedEntries: PatchReplacement[];
}
