import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal, ScrollView, Platform } from 'react-native';
import { PatchResult } from '../lib/types/dialect';
import { Colors } from '../constants/colors';

interface Props {
    sourceText: string;
    sourceLang: string;
    translatedText: string;
    targetLang: string;
    role: 'speaker' | 'other';
    color: string;
    patchResult?: PatchResult;
}

export function PatchedCard({ sourceText, sourceLang, translatedText, targetLang, role, color, patchResult }: Props) {
    const [showExplain, setShowExplain] = useState(false);

    // If there wasn't an actual patch, render normally
    if (!patchResult || !patchResult.patched) {
        return (
            <View style={[styles.resultCard, { borderLeftColor: role === 'speaker' ? color : Colors.survivor }]}>
                <View style={styles.resultLangRow}>
                    <Text style={styles.resultLangTag}>{sourceLang.toUpperCase()}</Text>
                    <Text style={styles.resultLangArrow}>→</Text>
                    <Text style={styles.resultLangTag}>{targetLang.toUpperCase()}</Text>
                </View>
                <Text style={styles.resultOriginal}>"{sourceText}"</Text>
                <Text style={styles.resultTranslated}>"{translatedText}"</Text>
            </View>
        );
    }

    return (
        <View style={[styles.resultCard, styles.resultCardPatched, { borderLeftColor: Colors.info }]}>
            <View style={styles.headerRow}>
                <View style={styles.resultLangRow}>
                    <Text style={styles.resultLangTag}>{sourceLang.toUpperCase()}</Text>
                    <Text style={styles.resultLangArrow}>→</Text>
                    <Text style={styles.resultLangTag}>{targetLang.toUpperCase()}</Text>
                </View>
                <View style={styles.patchedBadge}>
                    <Text style={styles.patchedBadgeIcon}>📖</Text>
                    <Text style={styles.patchedBadgeText}>Dialect Patched</Text>
                </View>
            </View>

            <Text style={styles.resultOriginal}>"{patchResult.originalText}"</Text>
            <Text style={styles.resultTranslated}>"{translatedText}"</Text>

            <TouchableOpacity style={styles.explainBtn} onPress={() => setShowExplain(true)}>
                <Text style={styles.explainBtnText}>Explain Patch 🔍</Text>
            </TouchableOpacity>

            <Modal visible={showExplain} transparent animationType="fade" onRequestClose={() => setShowExplain(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Translation Pipeline</Text>
                            <TouchableOpacity onPress={() => setShowExplain(false)} style={styles.closeBtn}>
                                <Text style={styles.closeTxt}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.explainScroll}>
                            <View style={styles.stepBlock}>
                                <Text style={styles.stepNum}>1. Original ASR</Text>
                                <Text style={styles.stepText}>"{patchResult.originalText}"</Text>
                            </View>

                            <View style={styles.arrowDown}>
                                <Text style={styles.arrowIcon}>↓</Text>
                            </View>

                            <View style={[styles.stepBlock, styles.stepBlockHighlight]}>
                                <Text style={[styles.stepNum, { color: Colors.info }]}>2. Glossary Substitution</Text>
                                {patchResult.changedEntries.map((c, i) => (
                                    <View key={i} style={styles.changeRow}>
                                        <Text style={styles.changeFrom}>"{c.from}"</Text>
                                        <Text style={styles.changeArrow}>→</Text>
                                        <Text style={styles.changeTo}>"{c.to}"</Text>
                                    </View>
                                ))}
                                <Text style={[styles.stepText, { marginTop: 8, fontStyle: 'italic' }]}>"{patchResult.patchedText}"</Text>
                            </View>

                            <View style={styles.arrowDown}>
                                <Text style={styles.arrowIcon}>↓</Text>
                            </View>

                            <View style={styles.stepBlock}>
                                <Text style={styles.stepNum}>3. Final Translation</Text>
                                <Text style={[styles.stepText, { fontWeight: '700', color: Colors.textPrimary }]}>"{translatedText}"</Text>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    resultCard: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 14,
        borderLeftWidth: 3,
        gap: 6,
        marginVertical: 4,
    },
    resultCardPatched: {
        backgroundColor: '#0E1F35', // Slight teal tint for the patched card
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    resultLangRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    resultLangTag: {
        color: Colors.textSecondary,
        fontSize: 11,
        fontWeight: '700',
        backgroundColor: Colors.surfaceElevated,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    resultLangArrow: { color: Colors.textMuted, fontSize: 14 },
    patchedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.info + '33', // 20% opacity info
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.info,
        gap: 4,
    },
    patchedBadgeIcon: { fontSize: 10 },
    patchedBadgeText: { color: Colors.info, fontSize: 10, fontWeight: '700' },
    resultOriginal: { color: Colors.textSecondary, fontSize: 13, fontStyle: 'italic' },
    resultTranslated: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
    explainBtn: {
        marginTop: 4,
        alignSelf: 'flex-start',
        backgroundColor: Colors.surfaceElevated,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    explainBtnText: {
        color: Colors.info,
        fontSize: 11,
        fontWeight: '700',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        maxHeight: '80%',
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        color: Colors.textPrimary,
        fontSize: 18,
        fontWeight: '700',
    },
    closeBtn: { padding: 4 },
    closeTxt: { color: Colors.textMuted, fontSize: 20 },
    explainScroll: { gap: 8 },
    stepBlock: {
        backgroundColor: Colors.surfaceElevated,
        padding: 16,
        borderRadius: 12,
        gap: 6,
    },
    stepBlockHighlight: {
        backgroundColor: Colors.info + '11',
        borderColor: Colors.info,
        borderWidth: 1,
    },
    stepNum: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    stepText: {
        color: Colors.textSecondary,
        fontSize: 15,
    },
    arrowDown: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    arrowIcon: {
        color: Colors.textMuted,
        fontSize: 20,
        fontWeight: '800',
    },
    changeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 4,
    },
    changeFrom: {
        color: Colors.danger,
        fontSize: 14,
        fontWeight: '600',
        textDecorationLine: 'line-through',
    },
    changeArrow: { color: Colors.textMuted, fontSize: 14 },
    changeTo: {
        color: Colors.success,
        fontSize: 14,
        fontWeight: '700',
    },
});
