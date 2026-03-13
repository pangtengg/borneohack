import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { SUPPORTED_LANGUAGES } from '../../../constants/languages';
import { useAuth } from '@/lib/auth/AuthContext';
import { useProfile } from '@/lib/auth/useProfile';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'] as const;

export default function ProfileScreen() {
  const { user } = useAuth();
  const { profile, refetch } = useProfile();
  const t = useT();

  const [displayName, setDisplayName] = useState('');
  const [preferredLang, setPreferredLang] = useState('en');

  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [nationality, setNationality] = useState('');
  const [address, setAddress] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? '');
    setPreferredLang(profile.preferred_language ?? 'en');
    setPhone(profile.phone_number ?? '');
    setAge(profile.age != null ? String(profile.age) : '');
    setGender(profile.gender ?? '');
    setNationality(profile.nationality ?? '');
    setAddress(profile.address ?? '');
    setMedicalConditions(profile.medical_conditions ?? '');
    const ec = profile.emergency_contacts?.[0];
    setEmergencyName(ec?.name ?? '');
    setEmergencyPhone(ec?.phone ?? '');
  }, [profile]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const emergencyContacts =
        emergencyName.trim() || emergencyPhone.trim()
          ? [{ name: emergencyName.trim(), phone: emergencyPhone.trim() }]
          : null;

      const { error: survErr } = await supabase
        .from('survivor_profiles')
        .upsert(
          {
            id: user.id,
            display_name: displayName.trim() || 'Survivor',
            preferred_language: preferredLang,
          },
          { onConflict: 'id' }
        );
      if (survErr) throw survErr;

      const { error: profErr } = await supabase
        .from('profiles')
        .update({
          phone_number: phone.trim() || null,
          age: age.trim() ? parseInt(age, 10) : null,
          gender: gender || null,
          nationality: nationality.trim() || null,
          address: address.trim() || null,
          medical_conditions: medicalConditions.trim() || null,
          emergency_contacts: emergencyContacts,
        })
        .eq('id', user.id);
      if (profErr) throw profErr;

      const lang = SUPPORTED_LANGUAGES.find((l) => l.code === preferredLang) ?? SUPPORTED_LANGUAGES[0];
      useAppStore.getState().setMyLanguage(preferredLang, lang.label, lang.flag);

      await refetch();
      Alert.alert('Saved', t('profile.saved'));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not save profile.';
      console.error('[Profile save]', e);
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* PERSONAL INFORMATION */}
      <Text style={styles.sectionTitle}>{t('profile.section.personal')}</Text>

      <Field label={t('profile.display_name')}>
        <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Your name or nickname" placeholderTextColor={Colors.textMuted} />
      </Field>

      <Field label={t('profile.email')}>
        <View style={[styles.input, styles.inputReadonly]}>
          <Text style={styles.readonlyText}>{user?.email ?? '—'}</Text>
        </View>
      </Field>

      <Field label={t('profile.phone')}>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+60 12-345 6789" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />
      </Field>

      <View style={styles.row}>
        <View style={styles.halfCol}>
          <Field label={t('profile.age')}>
            <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="25" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" maxLength={3} />
          </Field>
        </View>
        <View style={styles.halfCol}>
          <Field label={t('profile.gender')}>
            <View style={styles.chipRow}>
              {GENDER_OPTIONS.map((g) => (
                <TouchableOpacity key={g} style={[styles.chip, gender === g && styles.chipActive]} onPress={() => setGender(g)}>
                  <Text style={[styles.chipText, gender === g && { color: Colors.accent }]}>{t(`common.${g.toLowerCase()}`)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>
        </View>
      </View>

      <Field label={t('profile.nationality')}>
        <TextInput style={styles.input} value={nationality} onChangeText={setNationality} placeholder="e.g. Malaysian" placeholderTextColor={Colors.textMuted} />
      </Field>

      {/* EMERGENCY INFORMATION */}
      <Text style={[styles.sectionTitle, { marginTop: 12 }]}>{t('profile.section.emergency')}</Text>

      <Field label={t('profile.address')}>
        <TextInput style={[styles.input, styles.multiline]} value={address} onChangeText={setAddress} placeholder="Home / shelter address" placeholderTextColor={Colors.textMuted} multiline numberOfLines={2} />
      </Field>

      <Field label={t('profile.medical')}>
        <TextInput style={[styles.input, styles.multiline]} value={medicalConditions} onChangeText={setMedicalConditions} placeholder="Allergies, chronic conditions, medications…" placeholderTextColor={Colors.textMuted} multiline numberOfLines={2} />
      </Field>

      <View style={styles.row}>
        <View style={styles.halfCol}>
          <Field label={t('profile.emergency.name')}>
            <TextInput style={styles.input} value={emergencyName} onChangeText={setEmergencyName} placeholder="Name" placeholderTextColor={Colors.textMuted} />
          </Field>
        </View>
        <View style={styles.halfCol}>
          <Field label={t('profile.emergency.phone')}>
            <TextInput style={styles.input} value={emergencyPhone} onChangeText={setEmergencyPhone} placeholder="Phone" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />
          </Field>
        </View>
      </View>

      {/* PREFERRED LANGUAGE */}
      <Text style={[styles.sectionTitle, { marginTop: 12 }]}>{t('profile.section.language')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langScroll}>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <TouchableOpacity key={lang.code} style={[styles.langChip, preferredLang === lang.code && styles.langChipActive]} onPress={() => setPreferredLang(lang.code)}>
            <Text style={styles.langFlag}>{lang.flag}</Text>
            <Text style={[styles.langText, preferredLang === lang.code && { color: Colors.accent }]}>{lang.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* SAVE */}
      <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? t('profile.saving') : t('profile.save')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, gap: 14, paddingBottom: 48 },
  sectionTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 2 },
  field: { gap: 6 },
  fieldLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  inputReadonly: { backgroundColor: Colors.surfaceElevated },
  readonlyText: { color: Colors.textSecondary, fontSize: 14 },
  multiline: { minHeight: 56, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  halfCol: { flex: 1 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: { borderColor: Colors.accent, backgroundColor: `${Colors.accent}22` },
  chipText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
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
  saveBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: Colors.background, fontSize: 16, fontWeight: '700' },
});
