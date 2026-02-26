import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Phrase } from '../constants/phrases';

interface Props {
  phrase: Phrase;
  categoryColor: string;
  isPlaying: boolean;
  isLoading: boolean;
  onPress: () => void;
}

export function PhraseCard({ phrase, categoryColor, isPlaying, isLoading, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { borderColor: isPlaying ? categoryColor : Colors.border },
        isPlaying && { backgroundColor: `${categoryColor}22` },
      ]}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      <View style={styles.iconRow}>
        <Text style={styles.icon}>{phrase.icon}</Text>
        {isLoading && <ActivityIndicator size="small" color={categoryColor} />}
        {isPlaying && !isLoading && <Text style={{ color: categoryColor, fontSize: 16 }}>▶</Text>}
      </View>
      <Text style={styles.text} numberOfLines={3}>
        {phrase.text}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 10,
    alignItems: 'flex-start',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 28,
  },
  text: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
