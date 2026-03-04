import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  isActive: boolean;
  color?: string;
  barCount?: number;
}

export function WaveformIndicator({ isActive, color = Colors.accent, barCount = 5 }: Props) {
  const animations = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.3)),
  ).current;

  useEffect(() => {
    if (!isActive) {
      animations.forEach((anim) => {
        Animated.spring(anim, { toValue: 0.3, useNativeDriver: true }).start();
      });
      return;
    }

    const animateBar = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 300 + Math.random() * 200,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 300 + Math.random() * 200,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };

    animations.forEach((anim, i) => animateBar(anim, i * 80));

    return () => animations.forEach((anim) => anim.stopAnimation());
  }, [isActive]);

  return (
    <View style={styles.container}>
      {animations.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            { backgroundColor: color, transform: [{ scaleY: anim }] },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
  },
  bar: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
});
