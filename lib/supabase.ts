// lib/supabase.ts
// Uses AsyncStorage exclusively—avoids expo-secure-store (2048-byte limit, native linking issues)

import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl ?? '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey ?? '';

// Explicit AsyncStorage adapter—Supabase must not fall back to SecureStore
const asyncStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ?? null;
    } catch (e) {
      console.warn('[Supabase storage] getItem error:', key, e);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn('[Supabase storage] setItem error:', key, e);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn('[Supabase storage] removeItem error:', key, e);
    }
  },
};

function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing URL or anon key. Auth will not work until app.json extra is configured.');
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: asyncStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = createSupabaseClient();

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
