import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
    dialectName: string | null;
    confidence: number;
}

export function DialectBadge({ dialectName, confidence }: Props) {
    if (!dialectName) {
        return (
            <View style={[styles.container, styles.containerEmpty]}>
                <Text style={styles.textEmpty}>No dialect detected</Text>
            </View>
        );
    }

    const confidencePct = Math.round(confidence * 100);

    return (
        <View style={styles.container}>
            <Text style={styles.text}>{dialectName} — {confidencePct}%</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#7C3AED', // Purple
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'center',
        marginVertical: 4,
    },
    containerEmpty: {
        backgroundColor: Colors.surfaceElevated,
    },
    text: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    textEmpty: {
        color: Colors.textMuted,
        fontSize: 12,
        fontStyle: 'italic',
    },
});
