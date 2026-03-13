import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';

type Role = 'survivor' | 'authority';
type AuthMode = 'login' | 'signup';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const [role, setRole] = useState<Role>('survivor');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [langReading, setLangReading] = useState('en');
  const [langSpeaking, setLangSpeaking] = useState('en');
  const [langListening, setLangListening] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      if (role === 'authority') {
        const { error: signInError } = await signIn(email.trim(), password);
        if (signInError) {
          setError(signInError.message);
          return;
        }
        router.replace('/(authority)' as any);
      } else {
        if (authMode === 'login') {
          const { error: signInError } = await signIn(email.trim(), password);
          if (signInError) {
            setError(signInError.message);
            return;
          }
          router.replace('/(survivor)/(tabs)' as any);
        } else {
          const { error: signUpError } = await signUp(email.trim(), password);
          if (signUpError) {
            setError(signUpError.message);
            return;
          }
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('profiles')
              .upsert(
                {
                  id: user.id,
                  role: 'survivor',
                  lang_reading: langReading,
                  lang_speaking: langSpeaking,
                  lang_listening: langListening,
                },
                { onConflict: 'id' }
              );
          }
          router.replace('/(survivor)/(tabs)' as any);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>VoiceBridge</Text>
        <Text style={styles.subtitle}>Disaster communication — sign up before disaster strikes</Text>
      </View>

      {/* Role selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>I AM A</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'survivor' && { borderColor: Colors.survivor, backgroundColor: `${Colors.survivor}22` }]}
            onPress={() => { setRole('survivor'); setError(null); }}
          >
            <Text style={[styles.roleIcon]}>🆘</Text>
            <Text style={[styles.roleLabel, role === 'survivor' && { color: Colors.survivor }]}>Survivor</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'authority' && { borderColor: Colors.rescuer, backgroundColor: `${Colors.rescuer}22` }]}
            onPress={() => { setRole('authority'); setError(null); }}
          >
            <Text style={styles.roleIcon}>🦺</Text>
            <Text style={[styles.roleLabel, role === 'authority' && { color: Colors.rescuer }]}>Authority</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Survivor: Login/Signup toggle */}
      {role === 'survivor' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MODE</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, authMode === 'login' && styles.toggleBtnActive]}
              onPress={() => { setAuthMode('login'); setError(null); }}
            >
              <Text style={[styles.toggleLabel, authMode === 'login' && { color: Colors.accent }]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, authMode === 'signup' && styles.toggleBtnActive]}
              onPress={() => { setAuthMode('signup'); setError(null); }}
            >
              <Text style={[styles.toggleLabel, authMode === 'signup' && { color: Colors.accent }]}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {role === 'authority' && (
        <Text style={styles.authorityNote}>Officers log in with credentials provided by your organization.</Text>
      )}

      {/* Email / Password */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EMAIL</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        <Text style={styles.sectionTitle}>PASSWORD</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={Colors.textMuted}
          secureTextEntry
          autoCapitalize="none"
        />
      </View>

      {/* Survivor signup: language pickers */}
      {role === 'survivor' && authMode === 'signup' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERRED LANGUAGES</Text>
          <Text style={styles.sectionDesc}>For reading, speaking, and listening</Text>
          <View style={styles.langGrid}>
            <Text style={styles.langLabel}>Reading</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langScroll}>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langChip, langReading === lang.code && styles.langChipActive]}
                  onPress={() => setLangReading(lang.code)}
                >
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <Text style={[styles.langText, langReading === lang.code && { color: Colors.accent }]}>{lang.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.langLabel}>Speaking</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langScroll}>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langChip, langSpeaking === lang.code && styles.langChipActive]}
                  onPress={() => setLangSpeaking(lang.code)}
                >
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <Text style={[styles.langText, langSpeaking === lang.code && { color: Colors.accent }]}>{lang.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.langLabel}>Listening</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langScroll}>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langChip, langListening === lang.code && styles.langChipActive]}
                  onPress={() => setLangListening(lang.code)}
                >
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <Text style={[styles.langText, langListening === lang.code && { color: Colors.accent }]}>{lang.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.background} />
        ) : (
          <Text style={styles.submitText}>
            {role === 'authority' ? 'Log in' : authMode === 'login' ? 'Log in' : 'Sign up'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' },
  section: { marginBottom: 20 },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  sectionDesc: { color: Colors.textSecondary, fontSize: 12, marginBottom: 8 },
  roleRow: { flexDirection: 'row', gap: 12 },
  roleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  roleIcon: { fontSize: 28, marginBottom: 4 },
  roleLabel: { color: Colors.textSecondary, fontSize: 15, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  toggleBtnActive: { borderColor: Colors.accent, backgroundColor: `${Colors.accent}22` },
  toggleLabel: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },
  authorityNote: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  langGrid: { gap: 12 },
  langLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  langScroll: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  langChipActive: { borderColor: Colors.accent, backgroundColor: `${Colors.accent}22` },
  langFlag: { fontSize: 18 },
  langText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  errorBox: {
    backgroundColor: `${Colors.danger}22`,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: Colors.danger, fontSize: 14 },
  submitBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: Colors.background, fontSize: 16, fontWeight: '700' },
});
