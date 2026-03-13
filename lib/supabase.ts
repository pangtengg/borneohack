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
  category?: string;
  description?: string;
  urgency?: number;
  latitude?: number;
  longitude?: number;
  location_address?: string;
  disaster_type?: string;
  severity?: number;
  people_affected?: number;
  injuries_critical?: string;
  immediate_needs?: string;
  qa_pairs?: Array<{ question: string; answer: string }>;
  preferred_language?: string;
  status?: string;
  [key: string]: unknown;
}) {
  return supabase.from('reports').insert(report).select().single();
}

// ─── Helper: get single report by id ───────────────────────────────────────────
export async function getReportById(reportId: string) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();
  if (error) return null;
  return data;
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

// ─── Conversations (survivor ↔ authority messaging) ─────────────────────────
export async function getSurvivorConversations(survivorId: string) {
  const { data } = await supabase
    .from('conversations')
    .select('id, authority_id, created_at, updated_at')
    .eq('survivor_id', survivorId)
    .order('updated_at', { ascending: false });
  return data ?? [];
}

export async function getConversationById(conversationId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();
  if (error) return null;
  return data;
}

export async function getConversationMessages(conversationId: string) {
  const { data } = await supabase
    .from('conversation_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  role: 'survivor' | 'authority'
) {
  const { data: msg } = await supabase
    .from('conversation_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      role,
    })
    .select()
    .single();
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);
  return msg;
}

export async function createConversation(survivorId: string, authorityId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      survivor_id: survivorId,
      authority_id: authorityId,
    })
    .select()
    .single();
  if (error) return { data: null, error };
  return { data, error: null };
}

export function subscribeToMessages(
  conversationId: string,
  onInsert: (payload: unknown) => void
) {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'conversation_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      onInsert
    )
    .subscribe();
}

// ─── Broadcasts ──────────────────────────────────────────────────────────────
export async function getBroadcasts() {
  const { data, error } = await supabase
    .from('broadcasts')
    .select('id, title, summary, body, sender, authority_id, created_at')
    .order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function getBroadcastById(id: string) {
  const { data, error } = await supabase
    .from('broadcasts')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function getAuthorityBroadcasts(authorityId: string) {
  const { data, error } = await supabase
    .from('broadcasts')
    .select('id, title, summary, body, sender, authority_id, created_at')
    .eq('authority_id', authorityId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function createBroadcast(b: { title: string; summary: string; body: string; sender: string; authority_id: string }) {
  return supabase.from('broadcasts').insert(b).select().single();
}

export async function updateBroadcast(id: string, b: { title?: string; summary?: string; body?: string; sender?: string }) {
  return supabase.from('broadcasts').update({ ...b, updated_at: new Date().toISOString() }).eq('id', id).select().single();
}

export async function deleteBroadcast(id: string) {
  return supabase.from('broadcasts').delete().eq('id', id);
}

