import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { getAllCountries, CountryInfo } from '../lib/countryDetect';
import { Colors } from '../constants/colors';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSelect: (country: CountryInfo) => void;
    currentCountry: CountryInfo | null;
}

export function CountryPickerModal({ visible, onClose, onSelect, currentCountry }: Props) {
    const countries = getAllCountries();

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Detected Country</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeTxt}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {currentCountry && (
                        <Text style={styles.subtitle}>
                            {currentCountry.flag} {currentCountry.name} (detected via IP). If this is wrong, select manually:
                        </Text>
                    )}

                    <ScrollView style={styles.list}>
                        {countries.map((country) => (
                            <TouchableOpacity
                                key={country.code}
                                style={[
                                    styles.countryItem,
                                    currentCountry?.code === country.code && styles.countryItemActive,
                                ]}
                                onPress={() => onSelect({ ...country, status: 'online' } as CountryInfo)}
                            >
                                <Text style={styles.flag}>{country.flag}</Text>
                                <Text style={styles.name}>{country.name}</Text>
                                <Text style={styles.lang}>Speaks {country.langLabel}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        color: Colors.textPrimary,
        fontSize: 18,
        fontWeight: '700',
    },
    closeBtn: {
        padding: 4,
    },
    closeTxt: {
        color: Colors.textMuted,
        fontSize: 20,
    },
    subtitle: {
        color: Colors.textSecondary,
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 20,
    },
    list: {
        marginBottom: 20,
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceElevated,
        padding: 14,
        borderRadius: 12,
        marginBottom: 8,
        gap: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    countryItemActive: {
        borderColor: Colors.accent,
        backgroundColor: `${Colors.accent}11`,
    },
    flag: {
        fontSize: 24,
    },
    name: {
        flex: 1,
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    lang: {
        color: Colors.textMuted,
        fontSize: 12,
    },
});
