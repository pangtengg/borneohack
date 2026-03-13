import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? Constants.expoConfig?.extra?.supabaseUrl ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? Constants.expoConfig?.extra?.supabaseAnonKey ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your app.json or environment variables.');
}

const customStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
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

// ─── Helper: create a report ─────────────────────────────────────────────────
export async function createReport(report: {
  user_id?: string;
  category: string;
  description?: string;
  urgency?: number;
  latitude?: number;
  longitude?: number;
  location_address?: string;
  original_language?: string;
  transcription?: string;
  translation?: string;
  media_urls?: string[];
}) {
  return supabase.from('reports').insert(report).select().single();
}

// ─── Helper: get reports for a user ──────────────────────────────────────────
export async function getUserReports(userId: string) {
  const { data } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data;
}

// ─── Helper: get all reports (for authority) ─────────────────────────────────
export async function getAllReports(status?: string) {
  let query = supabase.from('reports').select('*');
  if (status) {
    query = query.eq('status', status);
  }
  const { data } = await query.order('created_at', { ascending: false });
  return data;
}

// ─── Helper: update report status ────────────────────────────────────────────
export async function updateReportStatus(
  reportId: string,
  status: string,
  assignedTo?: string,
  notes?: string
) {
  const update: any = { status };
  if (assignedTo) update.assigned_to = assignedTo;
  if (notes) update.notes = notes;
  return supabase.from('reports').update(update).eq('id', reportId);
}

// ─── Helper: log translation ─────────────────────────────────────────────────
export async function logTranslation(log: {
  layer_used: string;
  raw_transcript?: string;
  detected_lang?: string;
  patched_text?: string;
  final_output?: string;
  confidence?: number;
  session_id?: string;
}) {
  return supabase.from('translation_logs').insert(log);
}

// ─── Helper: get survivor profile ────────────────────────────────────────────
export async function getSurvivorProfile(userId: string) {
  const { data } = await supabase
    .from('survivor_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

// ─── Helper: get authority profile ───────────────────────────────────────────
export async function getAuthorityProfile(userId: string) {
  const { data } = await supabase
    .from('authority_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}
