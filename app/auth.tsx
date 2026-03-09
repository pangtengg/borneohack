// app/auth.tsx
// VoiceBridge — Auth Screen (fixed: explicit routing + inline status feedback)

import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Animated, Dimensions, ActivityIndicator, KeyboardAvoidingView,
  Platform, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

const LANGUAGES = [
  { code: 'en',  label: 'English',    flag: '🇬🇧' },
  { code: 'ms',  label: 'Malay',      flag: '🇲🇾' },
  { code: 'id',  label: 'Indonesian', flag: '🇮🇩' },
  { code: 'zh',  label: 'Chinese',    flag: '🇨🇳' },
  { code: 'th',  label: 'Thai',       flag: '🇹🇭' },
  { code: 'vi',  label: 'Vietnamese', flag: '🇻🇳' },
  { code: 'fil', label: 'Filipino',   flag: '🇵🇭' },
  { code: 'my',  label: 'Burmese',    flag: '🇲🇲' },
  { code: 'km',  label: 'Khmer',      flag: '🇰🇭' },
  { code: 'lo',  label: 'Lao',        flag: '🇱🇦' },
];

type AuthMode = 'login' | 'signup';
type UserRole = 'survivor' | 'authority';
type Status = { type: 'success' | 'error'; msg: string } | null;

function LanguagePicker({ selected, onSelect }: { selected: string; onSelect: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const sel = LANGUAGES.find((l) => l.code === selected);
  return (
    <View>
      <TouchableOpacity style={styles.pickerBtn} onPress={() => setOpen(!open)}>
        <Text style={styles.pickerBtnText}>{sel ? `${sel.flag}  ${sel.label}` : 'Select language'}</Text>
        <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdown}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.dropdownItem, selected === lang.code && styles.dropdownItemActive]}
              onPress={() => { onSelect(lang.code); setOpen(false); }}
            >
              <Text style={styles.dropdownText}>{lang.flag}  {lang.label}</Text>
              {selected === lang.code && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<UserRole>('survivor');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const toggleAnim = useRef(new Animated.Value(0)).current;

  const switchMode = (m: AuthMode) => {
    setMode(m);
    setStatus(null);
    setEmail(''); setPassword(''); setDisplayName('');
    Animated.spring(toggleAnim, { toValue: m === 'login' ? 0 : 1, useNativeDriver: false }).start();
  };

  const thumbLeft = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, (width - 48) / 2 + 4],
  });

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setStatus({ type: 'error', msg: 'Please enter your email and password.' });
      return;
    }
    setLoading(true);
    setStatus(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (error) {
      let msg = error.message;
      if (msg.includes('Invalid login credentials')) msg = 'Wrong email or password.';
      if (msg.includes('Email not confirmed'))       msg = 'Please verify your email first, then try again.';
      setStatus({ type: 'error', msg });
      return;
    }

    if (data.user) {
      setStatus({ type: 'success', msg: '✓  Logged in! Taking you to the app...' });
      setTimeout(() => router.replace('/(tabs)'), 800);
    }
  };

  // ── SIGNUP ─────────────────────────────────────────────────────────────────
  const handleSignup = async () => {
    if (!email.trim() || !password || !displayName.trim()) {
      setStatus({ type: 'error', msg: 'Please fill in all fields.' });
      return;
    }
    if (password.length < 8) {
      setStatus({ type: 'error', msg: 'Password must be at least 8 characters.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    // Step 1 — create auth account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      setLoading(false);
      let msg = authError.message;
      if (msg.includes('already registered')) msg = 'This email already has an account. Try logging in.';
      setStatus({ type: 'error', msg });
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      setLoading(false);
      setStatus({ type: 'error', msg: 'Signup error — no user ID. Try again.' });
      return;
    }

    // Step 2 — base profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      role: 'survivor',
      lang_reading: language,
      lang_speaking: language,
      lang_listening: language,
    });

    if (profileError) {
      setLoading(false);
      setStatus({ type: 'error', msg: 'Profile setup failed: ' + profileError.message });
      return;
    }

    // Step 3 — survivor profile
    const { error: survivorError } = await supabase.from('survivor_profiles').insert({
      id: userId,
      display_name: displayName.trim(),
    });

    setLoading(false);

    if (survivorError) {
      setStatus({ type: 'error', msg: 'Survivor profile failed: ' + survivorError.message });
      return;
    }

    // All done
    setStatus({ type: 'success', msg: '✅  Account created! Check your email to verify, then log in.' });
    setTimeout(() => switchMode('login'), 2500);
  };

  const isLogin = mode === 'login';

  return (
    <LinearGradient colors={['#071018', '#0d1f3c', '#081a10']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* ── Header ── */}
            <View style={styles.header}>
              <View style={styles.logoRow}>
                <View style={styles.dot} />
                <Text style={styles.logoText}>VoiceBridge</Text>
              </View>
              <Text style={styles.tagline}>Emergency Multilingual Communication</Text>
            </View>

            {/* ── Status banner ── */}
            {status && (
              <View style={[styles.statusBanner, status.type === 'success' ? styles.bannerGreen : styles.bannerRed]}>
                <Text style={[styles.statusText, status.type === 'success' ? styles.textGreen : styles.textRed]}>
                  {status.msg}
                </Text>
              </View>
            )}

            {/* ── Card ── */}
            <View style={styles.card}>

              {/* Toggle */}
              <View style={styles.toggleTrack}>
                <Animated.View style={[styles.toggleThumb, { left: thumbLeft, width: (width - 48) / 2 - 8 }]} />
                <TouchableOpacity style={styles.toggleBtn} onPress={() => switchMode('login')}>
                  <Text style={[styles.toggleLabel, isLogin && styles.toggleLabelOn]}>Log In</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toggleBtn} onPress={() => switchMode('signup')}>
                  <Text style={[styles.toggleLabel, !isLogin && styles.toggleLabelOn]}>Sign Up</Text>
                </TouchableOpacity>
              </View>

              {/* Role — login only */}
              {isLogin && (
                <>
                  <Text style={styles.sectionLabel}>I AM A</Text>
                  <View style={styles.roleRow}>
                    {(['survivor', 'authority'] as UserRole[]).map((r) => (
                      <TouchableOpacity key={r} style={[styles.roleCard, role === r && styles.roleCardOn]} onPress={() => setRole(r)}>
                        <Text style={styles.roleIcon}>{r === 'survivor' ? '🆘' : '🦺'}</Text>
                        <Text style={[styles.roleText, role === r && styles.roleTextOn]}>
                          {r === 'survivor' ? 'Survivor' : 'Authority'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Info banners */}
              {isLogin && role === 'authority' && (
                <View style={styles.infoBanner}>
                  <Text style={styles.infoText}>🏛️  Use your provided staff email and password. No sign-up needed.</Text>
                </View>
              )}
              {!isLogin && (
                <View style={styles.infoBanner}>
                  <Text style={styles.infoText}>👤  Authority staff — use Log In with your given credentials instead.</Text>
                </View>
              )}

              {/* Form */}
              <View style={styles.form}>
                {!isLogin && (
                  <View style={styles.field}>
                    <Text style={styles.label}>YOUR NAME</Text>
                    <TextInput style={styles.input} placeholder="How rescuers will identify you" placeholderTextColor="#3d5a7a" value={displayName} onChangeText={setDisplayName} />
                  </View>
                )}
                <View style={styles.field}>
                  <Text style={styles.label}>EMAIL</Text>
                  <TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor="#3d5a7a" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>PASSWORD</Text>
                  <TextInput style={styles.input} placeholder={isLogin ? 'Your password' : 'At least 8 characters'} placeholderTextColor="#3d5a7a" value={password} onChangeText={setPassword} secureTextEntry />
                </View>
                {!isLogin && (
                  <View style={styles.field}>
                    <Text style={styles.label}>YOUR LANGUAGE</Text>
                    <Text style={styles.hint}>Used for voice translation output</Text>
                    <LanguagePicker selected={language} onSelect={setLanguage} />
                  </View>
                )}
              </View>

              {/* Submit */}
              <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={isLogin ? handleLogin : handleSignup} disabled={loading} activeOpacity={0.85}>
                {loading
                  ? <ActivityIndicator color="#071018" />
                  : <Text style={styles.submitText}>{isLogin ? 'Log In →' : 'Create Account →'}</Text>
                }
              </TouchableOpacity>

              {/* Switch */}
              <TouchableOpacity onPress={() => switchMode(isLogin ? 'signup' : 'login')} style={styles.switchRow}>
                <Text style={styles.switchText}>
                  {isLogin ? 'No account yet?  ' : 'Already registered?  '}
                  <Text style={styles.switchLink}>{isLogin ? 'Sign Up' : 'Log In'}</Text>
                </Text>
              </TouchableOpacity>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 48 },

  header: { alignItems: 'center', paddingTop: 64, paddingBottom: 28, paddingHorizontal: 24 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00e5a0' },
  logoText: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  tagline: { color: '#6a8fad', fontSize: 13, letterSpacing: 0.4, marginBottom: 14 },
  warningPill: { backgroundColor: 'rgba(255,160,0,0.12)', borderWidth: 1, borderColor: 'rgba(255,160,0,0.3)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  warningText: { color: '#ffaa00', fontSize: 12, fontWeight: '600' },

  statusBanner: { marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 14, borderWidth: 1 },
  bannerGreen: { backgroundColor: 'rgba(0,229,160,0.1)', borderColor: 'rgba(0,229,160,0.35)' },
  bannerRed: { backgroundColor: 'rgba(255,60,60,0.1)', borderColor: 'rgba(255,60,60,0.35)' },
  statusText: { fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 20 },
  textGreen: { color: '#00e5a0' },
  textRed: { color: '#ff6060' },

  card: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 24, marginHorizontal: 16, padding: 24 },

  toggleTrack: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 13, height: 46, marginBottom: 20, position: 'relative', overflow: 'hidden' },
  toggleThumb: { position: 'absolute', top: 4, bottom: 4, backgroundColor: '#00e5a0', borderRadius: 9 },
  toggleBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  toggleLabel: { color: '#6a8fad', fontWeight: '600', fontSize: 14 },
  toggleLabelOn: { color: '#071018' },

  sectionLabel: { color: '#4a6f8a', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  roleCard: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(0,0,0,0.2)', gap: 4 },
  roleCardOn: { borderColor: '#00e5a0', backgroundColor: 'rgba(0,229,160,0.08)' },
  roleIcon: { fontSize: 22 },
  roleText: { color: '#6a8fad', fontSize: 13, fontWeight: '600' },
  roleTextOn: { color: '#00e5a0' },

  infoBanner: { backgroundColor: 'rgba(0,120,255,0.08)', borderLeftWidth: 3, borderLeftColor: '#0078ff', borderRadius: 8, padding: 12, marginBottom: 16 },
  infoText: { color: '#7aa8d4', fontSize: 12, lineHeight: 18 },

  form: { gap: 16, marginBottom: 20 },
  field: { gap: 6 },
  label: { color: '#4a6f8a', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  hint: { color: '#3d5a7a', fontSize: 11, marginTop: -2 },
  input: { backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15 },

  pickerBtn: { backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerBtnText: { color: '#fff', fontSize: 15 },
  chevron: { color: '#4a6f8a', fontSize: 11 },
  dropdown: { backgroundColor: '#0d1f3c', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownItemActive: { backgroundColor: 'rgba(0,229,160,0.1)' },
  dropdownText: { color: '#fff', fontSize: 14 },
  checkmark: { color: '#00e5a0', fontWeight: '700' },

  submitBtn: { backgroundColor: '#00e5a0', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  submitText: { color: '#071018', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  switchRow: { alignItems: 'center' },
  switchText: { color: '#6a8fad', fontSize: 13 },
  switchLink: { color: '#00e5a0', fontWeight: '700' },
});