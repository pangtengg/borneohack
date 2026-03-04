import React, { useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  onPressIn: () => void;
  onPressOut: () => void;
  isRecording: boolean;
  isProcessing: boolean;
  color?: string;
  label?: string;
}

export function PushToTalk({
  onPressIn,
  onPressOut,
  isRecording,
  isProcessing,
  color = Colors.accent,
  label = 'Hold to Speak',
}: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ).start();
    onPressIn();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    pulseAnim.stopAnimation();
    Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true }).start();
    onPressOut();
  };

  return (
    <View style={styles.wrapper}>
      {/* Pulse ring */}
      {isRecording && (
        <Animated.View
          style={[
            styles.pulseRing,
            { borderColor: color, transform: [{ scale: pulseAnim }] },
          ]}
        />
      )}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: isRecording ? color : Colors.surfaceElevated,
              borderColor: color,
            },
            isProcessing && styles.buttonProcessing,
          ]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isProcessing}
          activeOpacity={1}
        >
          <Text style={styles.icon}>
            {isProcessing ? '⏳' : isRecording ? '🎙️' : '🎤'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
      <Text style={[styles.label, { color: isRecording ? color : Colors.textSecondary }]}>
        {isProcessing ? 'Translating...' : isRecording ? 'Recording...' : label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  button: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#F6AD55',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
    }),
  },
  buttonProcessing: {
    opacity: 0.6,
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    opacity: 0.5,
  },
  icon: {
    fontSize: 44,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
