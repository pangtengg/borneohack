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
const GENDER_OPTIONS = ['Male', 'Female', 'Other'] as const;

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const [role, setRole] = useState<Role>('survivor');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [preferredLang, setPreferredLang] = useState('en');

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [nationality, setNationality] = useState('');
  const [address, setAddress] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

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
        if (signInError) { setError(signInError.message); return; }
        router.replace('/(authority)' as any);
      } else {
        if (authMode === 'login') {
          const { error: signInError } = await signIn(email.trim(), password);
          if (signInError) { setError(signInError.message); return; }
          router.replace('/(survivor)/(tabs)' as any);
        } else {
          const { error: signUpError } = await signUp(email.trim(), password);
          if (signUpError) { setError(signUpError.message); return; }
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const emergencyContacts =
              emergencyName.trim() || emergencyPhone.trim()
                ? [{ name: emergencyName.trim(), phone: emergencyPhone.trim() }]
                : null;

            await supabase.from('profiles').upsert(
              {
                id: user.id,
                role: 'survivor',
                preferred_language: preferredLang,
                phone_number: phone.trim() || null,
                age: age.trim() ? parseInt(age, 10) : null,
                gender: gender || null,
                nationality: nationality.trim() || null,
                address: address.trim() || null,
                medical_conditions: medicalConditions.trim() || null,
                emergency_contacts: emergencyContacts,
              },
              { onConflict: 'id' }
            );

            await supabase.from('survivor_profiles').upsert(
              {
                id: user.id,
                display_name: displayName.trim() || email.split('@')[0] || 'Survivor',
                preferred_language: preferredLang,
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

  const isSignup = role === 'survivor' && authMode === 'signup';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>VoiceBridge</Text>
        <Text style={styles.subtitle}>Disaster communication — sign up before disaster strikes</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>I AM A</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'survivor' && { borderColor: Colors.survivor, backgroundColor: `${Colors.survivor}22` }]}
            onPress={() => { setRole('survivor'); setError(null); }}
          >
            <Text style={styles.roleIcon}>🆘</Text>
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

      {role === 'survivor' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MODE</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity style={[styles.toggleBtn, authMode === 'login' && styles.toggleBtnActive]} onPress={() => { setAuthMode('login'); setError(null); }}>
              <Text style={[styles.toggleLabel, authMode === 'login' && { color: Colors.accent }]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, authMode === 'signup' && styles.toggleBtnActive]} onPress={() => { setAuthMode('signup'); setError(null); }}>
              <Text style={[styles.toggleLabel, authMode === 'signup' && { color: Colors.accent }]}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {role === 'authority' && (
        <Text style={styles.authorityNote}>Officers log in with credentials provided by your organization.</Text>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EMAIL</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="your@email.com" placeholderTextColor={Colors.textMuted} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
        <Text style={styles.sectionTitle}>PASSWORD</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={Colors.textMuted} secureTextEntry autoCapitalize="none" />
      </View>

      {isSignup && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>
            <Text style={styles.sectionDesc}>Fill in before disaster strikes — helps responders find & assist you.</Text>
            <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Display name / nickname" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone number" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />
            <View style={styles.inlineRow}>
              <TextInput style={[styles.input, styles.halfInput]} value={age} onChangeText={setAge} placeholder="Age" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" maxLength={3} />
              <View style={[styles.halfInput, styles.chipContainer]}>
                {GENDER_OPTIONS.map((g) => (
                  <TouchableOpacity key={g} style={[styles.genderChip, gender === g && styles.genderChipActive]} onPress={() => setGender(g)}>
                    <Text style={[styles.genderChipText, gender === g && { color: Colors.accent }]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TextInput style={styles.input} value={nationality} onChangeText={setNationality} placeholder="Nationality" placeholderTextColor={Colors.textMuted} />
            <TextInput style={[styles.input, styles.multiline]} value={address} onChangeText={setAddress} placeholder="Residential address" placeholderTextColor={Colors.textMuted} multiline numberOfLines={2} />
            <TextInput style={[styles.input, styles.multiline]} value={medicalConditions} onChangeText={setMedicalConditions} placeholder="Medical conditions (allergies, medications…)" placeholderTextColor={Colors.textMuted} multiline numberOfLines={2} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EMERGENCY CONTACT</Text>
            <TextInput style={styles.input} value={emergencyName} onChangeText={setEmergencyName} placeholder="Contact name" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.input} value={emergencyPhone} onChangeText={setEmergencyPhone} placeholder="Contact phone" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PREFERRED LANGUAGE</Text>
            <Text style={styles.sectionDesc}>Used for UI, voice input, and text-to-speech</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langScroll}>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <TouchableOpacity key={lang.code} style={[styles.langChip, preferredLang === lang.code && styles.langChipActive]} onPress={() => setPreferredLang(lang.code)}>
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <Text style={[styles.langText, preferredLang === lang.code && { color: Colors.accent }]}>{lang.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color={Colors.background} /> : (
          <Text style={styles.submitText}>{role === 'authority' ? 'Log in' : authMode === 'login' ? 'Log in' : 'Sign up'}</Text>
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
  sectionTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  sectionDesc: { color: Colors.textSecondary, fontSize: 12, marginBottom: 8 },
  roleRow: { flexDirection: 'row', gap: 12 },
  roleBtn: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border },
  roleIcon: { fontSize: 28, marginBottom: 4 },
  roleLabel: { color: Colors.textSecondary, fontSize: 15, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  toggleBtnActive: { borderColor: Colors.accent, backgroundColor: `${Colors.accent}22` },
  toggleLabel: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },
  authorityNote: { color: Colors.textSecondary, fontSize: 13, marginBottom: 16, fontStyle: 'italic' },
  input: { backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, color: Colors.textPrimary, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 12 },
  multiline: { minHeight: 64, textAlignVertical: 'top' },
  inlineRow: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  chipContainer: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 12 },
  genderChip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  genderChipActive: { borderColor: Colors.accent, backgroundColor: `${Colors.accent}22` },
  genderChipText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  langScroll: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  langChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  langChipActive: { borderColor: Colors.accent, backgroundColor: `${Colors.accent}22` },
  langFlag: { fontSize: 18 },
  langText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  errorBox: { backgroundColor: `${Colors.danger}22`, borderWidth: 1, borderColor: Colors.danger, borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { color: Colors.danger, fontSize: 14 },
  submitBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: Colors.background, fontSize: 16, fontWeight: '700' },
});
