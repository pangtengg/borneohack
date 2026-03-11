import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { Phrase } from '../constants/phrases';

interface Props {
    phrases: Phrase[];
    onPlayPhrase: (phrase: Phrase) => void;
    isLoadingKey: string | null;
    isPlayingKey: string | null;
}

export function PhraseBankGrid({ phrases, onPlayPhrase, isLoadingKey, isPlayingKey }: Props) {
    const router = useRouter();

    // Get only first 4 medical phrases for grid
    const gridPhrases = phrases.slice(0, 4);

    return (
        <View style={styles.container}>
            <View style={styles.grid}>
                {gridPhrases.map((phrase) => {
                    const isLoading = isLoadingKey === phrase.key;
                    const isPlaying = isPlayingKey === phrase.key;

                    return (
                        <TouchableOpacity
                            key={phrase.key}
                            style={[
                                styles.card,
                                isPlaying && styles.cardPlaying,
                                isLoading && styles.cardLoading
                            ]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                onPlayPhrase(phrase);
                            }}
                            disabled={isLoading}
                        >
                            <Text style={styles.icon}>{phrase.icon}</Text>
                            <Text style={styles.text}>{phrase.text}</Text>
                            {isLoading && <Text style={styles.statusLabel}>Translating...</Text>}
                            {isPlaying && <Text style={styles.statusLabel}>Playing...</Text>}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <TouchableOpacity
                style={styles.moreBtn}
                onPress={() => router.push('/(survivor)/phrases' as any)}
            >
                <Text style={styles.moreBtnText}>More Phrases ⚡ →</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        gap: 16,
        marginTop: 10,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
    },
    card: {
        width: '48%',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        height: 110,
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    cardPlaying: {
        borderColor: Colors.accent,
        backgroundColor: `${Colors.accent}22`,
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
    },
    cardLoading: {
        opacity: 0.7,
    },
    icon: {
        fontSize: 24,
    },
    text: {
        color: Colors.textPrimary,
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 18,
    },
    statusLabel: {
        position: 'absolute',
        top: 16,
        right: 16,
        color: Colors.textSecondary,
        fontSize: 10,
        fontStyle: 'italic',
    },
    moreBtn: {
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    moreBtnText: {
        color: Colors.accent,
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
