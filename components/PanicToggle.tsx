import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';

interface Props {
    isActive: boolean;
    onToggle: (active: boolean) => void;
}

const SHAKE_THRESHOLD = 1.8;
const MIN_SHAKES = 3;
const TIME_WINDOW = 1500;

export function PanicToggle({ isActive, onToggle }: Props) {
    const [pulseAnim] = useState(new Animated.Value(1));
    const [shakes, setShakes] = useState(0);
    const [lastShakeAt, setLastShakeAt] = useState(0);

    useEffect(() => {
        let subscription: any;

        // Set fast update interval for shake detection
        Accelerometer.setUpdateInterval(100);

        subscription = Accelerometer.addListener(({ x, y, z }) => {
            const gForce = Math.sqrt(x * x + y * y + z * z);

            if (gForce > SHAKE_THRESHOLD) {
                const now = Date.now();

                // Reset if outside time window
                if (now - lastShakeAt > TIME_WINDOW) {
                    setShakes(1);
                    setLastShakeAt(now);
                } else {
                    // Inside window, increment shakes
                    // debounce slightly to avoid multiple counts for one physical shake movement
                    if (now - lastShakeAt > 300) {
                        const newShakes = shakes + 1;
                        setShakes(newShakes);
                        setLastShakeAt(now);

                        if (newShakes >= MIN_SHAKES) {
                            // Trigger panic mode!
                            if (!isActive) {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                                onToggle(true);
                            }
                            setShakes(0); // Reset after triggering
                        }
                    }
                }
            }
        });

        return () => {
            if (subscription) subscription.remove();
        };
    }, [isActive, shakes, lastShakeAt, onToggle]);

    useEffect(() => {
        if (isActive) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.stopAnimation();
            pulseAnim.setValue(1);
        }
    }, [isActive]);

    const handlePress = () => {
        if (!isActive) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onToggle(!isActive);
    };

    return (
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
                style={[styles.container, isActive && styles.containerActive]}
                onPress={handlePress}
            >
                <Text style={styles.icon}>⚡</Text>
                <Text style={[styles.label, isActive && styles.labelActive]}>
                    PANIC {isActive ? 'ON' : 'OFF'}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceElevated,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    containerActive: {
        backgroundColor: Colors.danger,
        borderColor: '#fff',
        ...Platform.select({
            ios: { shadowColor: Colors.danger, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10 },
            android: { elevation: 8 },
        }),
    },
    icon: {
        fontSize: 16,
    },
    label: {
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    labelActive: {
        color: '#fff',
    },
});
