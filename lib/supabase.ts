import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl ?? '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Helper: update GPS location ─────────────────────────────────────────────
export async function updateLocation(
  userId: string,
  latitude: number,
  longitude: number,
  accuracy?: number,
  countryCode?: string,
  region?: string
) {
  return supabase.from('locations').insert({
    user_id: userId,
    latitude,
    longitude,
    accuracy,
    country_code: countryCode,
    region,
  });
}

// ─── Helper: get latest location for a user ───────────────────────────────────
export async function getLatestLocation(userId: string) {
  const { data } = await supabase
    .from('locations')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();
  return data;
}
