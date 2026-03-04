import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { GhostMatchResult } from '../lib/types/dialect';
import { Colors } from '../constants/colors';

interface Props {
    match: Extract<GhostMatchResult, { found: true }>;
    onReplay: () => void;
}

export function GhostCard({ match, onReplay }: Props) {
    const slideAnim = useRef(new Animated.Value(20)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
    }, []);

    const confPct = Math.round(match.confidence * 100);
    let barColor = '#FC5A5A'; // Red
    let barNote = 'Low confidence — falling back to standard translation';

    if (confPct >= 75) {
        barColor = '#48BB78'; // Green
        barNote = '';
    } else if (confPct >= 50) {
        barColor = '#F6AD55'; // Amber
        barNote = '';
    }

    return (
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.header}>
                <View style={styles.badge}>
                    <Text style={styles.badgeIcon}>👻</Text>
                    <Text style={styles.badgeText}>Ghost Match</Text>
                </View>
                <TouchableOpacity style={styles.replayBtn} onPress={onReplay}>
                    <Text style={styles.replayIcon}>🔊</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.canonical}>{match.canonical}</Text>
            <Text style={styles.original}>{match.dialectText}</Text>

            <View style={styles.confSection}>
                <View style={styles.confRow}>
                    <Text style={styles.confLabel}>Match Confidence</Text>
                    <Text style={[styles.confPct, { color: barColor }]}>{confPct}%</Text>
                </View>
                <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${confPct}%`, backgroundColor: barColor }]} />
                </View>
                {barNote ? <Text style={styles.confNote}>{barNote}</Text> : null}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#2E1A47', // Deep purple tint
        borderRadius: 16,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#7C3AED',
        marginVertical: 8,
        gap: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#7C3AED',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 6,
    },
    badgeIcon: { fontSize: 14 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    replayBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    replayIcon: { fontSize: 16 },
    canonical: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
    },
    original: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontStyle: 'italic',
    },
    confSection: {
        marginTop: 8,
        gap: 6,
    },
    confRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    confLabel: {
        color: Colors.textSecondary,
        fontSize: 11,
        fontWeight: '600',
    },
    confPct: {
        fontSize: 12,
        fontWeight: '800',
    },
    barTrack: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 3,
    },
    confNote: {
        color: '#FC5A5A',
        fontSize: 10,
        marginTop: 2,
    },
});
