// lib/useLocationTracking.ts
// VoiceBridge — GPS location tracker
// Foreground: updates every 5 minutes or 50m movement
// Background: updates every 15 minutes
//
// Install:
//   npx expo install expo-location expo-task-manager

import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { AppState } from 'react-native';
import { supabase, updateLocation } from './supabase';

// NOTE: expo-task-manager is disabled for Expo Go compatibility
// Uncomment the imports below when using a development build
// import * as TaskManager from 'expo-task-manager';
// const BACKGROUND_LOCATION_TASK = 'voicebridge-background-location';

const FOREGROUND_INTERVAL_MS = 5 * 60 * 1000;   // 5 minutes
const DISTANCE_THRESHOLD_M = 50;                 // 50 metres

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useLocationTracking() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const requestPermissions = async () => {
    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== 'granted') {
      console.warn('Foreground location permission denied');
      return false;
    }
    const { status: bg } = await Location.requestBackgroundPermissionsAsync();
    if (bg !== 'granted') {
      console.warn('Background location permission denied — foreground only');
    }
    return true;
  };

  const logCurrentLocation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get country/region (uses device, no API key needed)
      let countryCode: string | undefined;
      let region: string | undefined;
      try {
        const [place] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        countryCode = place?.isoCountryCode ?? undefined;
        region = place?.region ?? undefined;
      } catch (_) {}

      await updateLocation(
        user.id,
        loc.coords.latitude,
        loc.coords.longitude,
        loc.coords.accuracy ?? undefined,
        countryCode,
        region
      );
    } catch (err) {
      console.error('Location update failed:', err);
    }
  };

  const startTracking = async () => {
    const granted = await requestPermissions();
    if (!granted) return;

    // Log immediately on start
    await logCurrentLocation();

    // Foreground: poll every 5 minutes
    intervalRef.current = setInterval(logCurrentLocation, FOREGROUND_INTERVAL_MS);

    // Also watch for significant movement (50m threshold)
    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: DISTANCE_THRESHOLD_M,
      },
      async (loc) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await updateLocation(
          user.id,
          loc.coords.latitude,
          loc.coords.longitude,
          loc.coords.accuracy ?? undefined
        );
      }
    );

    // Background task disabled for Expo Go compatibility
    // To enable background tracking, use a development build with expo-task-manager
    // const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    // if (!isRegistered) {
    //   await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {...});
    // }
  };

  const stopTracking = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (watchRef.current) watchRef.current.remove();
    // Background task cleanup disabled for Expo Go
    // const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    // if (isRegistered) {
    //   await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    // }
  };

  useEffect(() => {
    startTracking();

    // Pause polling when app goes to background (background task takes over)
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else if (state === 'active') {
        logCurrentLocation();
        intervalRef.current = setInterval(logCurrentLocation, FOREGROUND_INTERVAL_MS);
      }
    });

    return () => {
      stopTracking();
      sub.remove();
    };
  }, []);
}
