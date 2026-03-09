import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,          // Persist session on device
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,      // Required for React Native
  },
});

// ─── Helper: get current user's full profile ─────────────────────────────────
export async function getCurrentProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, survivor_profiles(*), authority_profiles(*)')
    .eq('id', user.id)
    .single();

  return profile;
}

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
