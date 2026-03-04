import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CountryInfo } from '../lib/countryDetect';
import { Colors } from '../constants/colors';

interface Props {
    country: CountryInfo | null;
    onPress: () => void;
}

export function CountryPill({ country, onPress }: Props) {
    if (!country) return null;

    let borderColor: string = Colors.border;
    if (country.status === 'online') borderColor = Colors.success;
    else if (country.status === 'cached') borderColor = Colors.warning;
    else if (country.status === 'failed') borderColor = Colors.danger;

    return (
        <TouchableOpacity style={[styles.container, { borderColor }]} onPress={onPress}>
            <Text style={styles.flag}>{country.flag}</Text>
            <Text style={styles.name}>{country.name}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 6,
        gap: 6,
        borderWidth: 1.5,
    },
    flag: {
        fontSize: 16,
    },
    name: {
        color: Colors.textPrimary,
        fontSize: 12,
        fontWeight: '600',
    },
});
