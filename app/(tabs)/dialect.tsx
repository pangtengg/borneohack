import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAppStore } from '../../lib/store';
import { saveGhostEnabled, saveDialectEnabled } from '../../lib/dialectStorage';

export default function DialectScreen() {
    const {
        ghostEnabled,
        dialectEnabled,
        installedGhostPacks,
        installedGlossaries
    } = useAppStore();

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.title}>Dialect Tools</Text>
                <Text style={styles.subtitle}>Community-powered translation for languages Google forgot</Text>
            </View>

            {/* SECTION 1: GHOST INTERPRETER */}
            <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                    <View>
                        <Text style={styles.sectionTitle}>👻 Ghost Interpreter</Text>
                        <Text style={styles.sectionSubtitle}>Acoustic matching for endangered & minority dialects</Text>
                    </View>
                </View>

                {/* Explainer Card */}
                <View style={[styles.explainerCard, { borderColor: '#7C3AED' }]}>
                    <View style={styles.explainerTitleRow}>
                        <Text style={styles.explainerIcon}>👻</Text>
                        <Text style={styles.explainerTitle}>Dead Language Recovery</Text>
                    </View>
                    <Text style={styles.explainerBody}>
                        Community elders pre-record phrases in their dialect before disaster season.
                        When you speak, the app matches your audio acoustically to the closest recorded phrase.
                        No internet, no ASR, no NLP required.
                    </Text>
                </View>

                {/* Master Toggle */}
                <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Ghost Interpreter Active</Text>
                    <Switch
                        value={ghostEnabled}
                        onValueChange={saveGhostEnabled}
                        trackColor={{ false: Colors.surfaceElevated, true: '#7C3AED' }}
                        thumbColor="#fff"
                    />
                </View>

                {/* Installed Packs */}
                <Text style={styles.listHeader}>INSTALLED PACKS ({installedGhostPacks.length})</Text>
                {installedGhostPacks.map(pack => (
                    <View key={pack.packId} style={styles.packCard}>
                        <View>
                            <Text style={styles.packDialect}>{pack.dialect}</Text>
                            <Text style={styles.packRegion}>{pack.region} • {pack.phrases.length} phrases</Text>
                        </View>
                    </View>
                ))}

                <View style={styles.btnRow}>
                    <TouchableOpacity style={styles.btnSecondary} onPress={() => alert('Browse Packs placeholder')}>
                        <Text style={styles.btnSecondaryText}>Browse Packs</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: '#7C3AED' }]} onPress={() => alert('Import Zip placeholder')}>
                        <Text style={styles.btnPrimaryText}>Import .zip</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.divider} />

            {/* SECTION 2: DIALECT GLOSSARY */}
            <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                    <View>
                        <Text style={[styles.sectionTitle, { color: Colors.info }]}>📖 Dialect & Slang Glossary</Text>
                        <Text style={styles.sectionSubtitle}>Word-level patching for regional slang</Text>
                    </View>
                </View>

                {/* Explainer Card */}
                <View style={[styles.explainerCard, { borderColor: Colors.info }]}>
                    <View style={styles.explainerTitleRow}>
                        <Text style={styles.explainerIcon}>📖</Text>
                        <Text style={[styles.explainerTitle, { color: Colors.info }]}>Glossary Substitution Pipeline</Text>
                    </View>
                    <Text style={styles.explainerBody}>
                        Standard ASR models often fail on regional slang and hybrid dialects (e.g. Kelantanese Malay, Manglish).
                        This layer intercepts the ASR output, finds fuzzy matches against community glossaries,
                        and patches the text to formal equivalents before hitting the Translation API.
                    </Text>
                </View>

                {/* Master Toggle */}
                <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Dialect Glossary Active</Text>
                    <Switch
                        value={dialectEnabled}
                        onValueChange={saveDialectEnabled}
                        trackColor={{ false: Colors.surfaceElevated, true: Colors.info }}
                        thumbColor="#fff"
                    />
                </View>

                {/* Installed Glossaries */}
                <Text style={styles.listHeader}>INSTALLED GLOSSARIES ({installedGlossaries.length})</Text>
                {installedGlossaries.map(pack => (
                    <View key={pack.packId} style={[styles.packCard, { borderLeftColor: Colors.info }]}>
                        <View>
                            <Text style={styles.packDialect}>{pack.dialect}</Text>
                            <Text style={styles.packRegion}>{pack.region || 'General'} • {pack.entries.length} entries</Text>
                        </View>
                    </View>
                ))}

                <View style={styles.btnRow}>
                    <TouchableOpacity style={styles.btnSecondary} onPress={() => alert('Browse Glossaries placeholder')}>
                        <Text style={styles.btnSecondaryText}>Browse Glossaries</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: Colors.info }]} onPress={() => alert('Import CSV/JSON placeholder')}>
                        <Text style={styles.btnPrimaryText}>Import CSV/JSON</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A', // Dark Navy background logic
    },
    content: {
        padding: 20,
        gap: 24,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
    },
    subtitle: {
        color: Colors.textMuted,
        fontSize: 13,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    section: {
        gap: 16,
    },
    sectionHeaderRow: {
        marginBottom: 4,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    sectionSubtitle: {
        color: Colors.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
    explainerCard: {
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderRadius: 12,
        padding: 16,
        gap: 8,
    },
    explainerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    explainerIcon: {
        fontSize: 18,
    },
    explainerTitle: {
        color: '#7C3AED',
        fontSize: 16,
        fontWeight: '700',
    },
    explainerBody: {
        color: Colors.textSecondary,
        fontSize: 13,
        lineHeight: 20,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.surfaceElevated,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
    },
    toggleLabel: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    listHeader: {
        color: Colors.textMuted,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginTop: 4,
    },
    packCard: {
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#7C3AED',
    },
    packDialect: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    packRegion: {
        color: Colors.textMuted,
        fontSize: 12,
        marginTop: 4,
    },
    btnRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    btnSecondary: {
        flex: 1,
        backgroundColor: Colors.surfaceElevated,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    btnSecondaryText: {
        color: Colors.textPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    btnPrimary: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    btnPrimaryText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 8,
    },
});
