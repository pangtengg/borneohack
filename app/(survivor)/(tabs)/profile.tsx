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
import { useAuth } from '../../../lib/auth/AuthContext';
import { useProfile } from '../../../lib/auth/useProfile';
import { supabase } from '../../../lib/supabase';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { profile } = useProfile();

  const [legalName, setLegalName] = useState('');
  const [nationality, setNationality] = useState('');
  const [icPassport, setIcPassport] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [race, setRace] = useState('');
  const [religion, setReligion] = useState('');
  const [address, setAddress] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState('');
  const [langReading, setLangReading] = useState('en');
  const [langSpeaking, setLangSpeaking] = useState('en');
  const [langListening, setLangListening] = useState('en');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setLegalName(profile.legal_name ?? '');
      setNationality(profile.nationality ?? '');
      setIcPassport(profile.ic_passport ?? '');
      setAge(profile.age?.toString() ?? '');
      setGender(profile.gender ?? '');
      setRace(profile.race ?? '');
      setReligion(profile.religion ?? '');
      setAddress(profile.address ?? '');
      setMedicalConditions(profile.medical_conditions ?? '');
      setEmergencyContacts(
        typeof profile.emergency_contacts === 'string'
          ? profile.emergency_contacts
          : Array.isArray(profile.emergency_contacts)
          ? JSON.stringify(profile.emergency_contacts, null, 2)
          : ''
      );
      setLangReading(profile.lang_reading ?? 'en');
      setLangSpeaking(profile.lang_speaking ?? 'en');
      setLangListening(profile.lang_listening ?? 'en');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to save your profile.');
      return;
    }
    
    setSaving(true);
    try {
      // Validate emergency contacts JSON if it's not empty
      let parsedEmergencyContacts = null;
      if (emergencyContacts.trim()) {
        try {
          parsedEmergencyContacts = JSON.parse(emergencyContacts);
        } catch (e) {
          // If it's not valid JSON, we should probably warn the user
          // instead of just sending it as a string to a jsonb column
          Alert.alert(
            'Invalid Format', 
            'Emergency contacts must be in valid JSON format, e.g. [{"name": "John", "phone": "123"}].'
          );
          setSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            legal_name: legalName.trim() || null,
            nationality: nationality.trim() || null,
            ic_passport: icPassport.trim() || null,
            age: age ? parseInt(age, 10) : null,
            gender: gender.trim() || null,
            race: race.trim() || null,
            religion: religion.trim() || null,
            address: address.trim() || null,
            medical_conditions: medicalConditions.trim() || null,
            emergency_contacts: parsedEmergencyContacts,
            lang_reading: langReading,
            lang_speaking: langSpeaking,
            lang_listening: langListening,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
        
      if (error) throw error;
      Alert.alert('Success', 'Your profile has been updated.');
    } catch (e) {
      console.error('Save profile error:', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>PERSONAL INFO</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Legal name</Text>
        <TextInput style={styles.input} value={legalName} onChangeText={setLegalName} placeholder="Full legal name" placeholderTextColor={Colors.textMuted} />
        <Text style={styles.inputLabel}>Nationality</Text>
        <TextInput style={styles.input} value={nationality} onChangeText={setNationality} placeholder="e.g. Malaysian" placeholderTextColor={Colors.textMuted} />
        <Text style={styles.inputLabel}>IC / Passport</Text>
        <TextInput style={styles.input} value={icPassport} onChangeText={setIcPassport} placeholder="ID number" placeholderTextColor={Colors.textMuted} />
        <Text style={styles.inputLabel}>Age</Text>
        <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="Age" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" />
        <Text style={styles.inputLabel}>Gender</Text>
        <TextInput style={styles.input} value={gender} onChangeText={setGender} placeholder="Gender" placeholderTextColor={Colors.textMuted} />
        <Text style={styles.inputLabel}>Race</Text>
        <TextInput style={styles.input} value={race} onChangeText={setRace} placeholder="Ethnicity / race" placeholderTextColor={Colors.textMuted} />
        <Text style={styles.inputLabel}>Religion</Text>
        <TextInput style={styles.input} value={religion} onChangeText={setReligion} placeholder="Religion" placeholderTextColor={Colors.textMuted} />
        <Text style={styles.inputLabel}>Residential address</Text>
        <TextInput style={[styles.input, styles.inputMultiline]} value={address} onChangeText={setAddress} placeholder="Full address" placeholderTextColor={Colors.textMuted} multiline />
        <Text style={styles.inputLabel}>Pre-existing medical conditions</Text>
        <TextInput style={[styles.input, styles.inputMultiline]} value={medicalConditions} onChangeText={setMedicalConditions} placeholder="Any conditions rescuers should know" placeholderTextColor={Colors.textMuted} multiline />
        <Text style={styles.inputLabel}>Emergency contacts (JSON)</Text>
        <TextInput style={[styles.input, styles.inputMultiline]} value={emergencyContacts} onChangeText={setEmergencyContacts} placeholder='[{"name":"...","phone":"..."}]' placeholderTextColor={Colors.textMuted} multiline />
      </View>

      <Text style={styles.sectionTitle}>PREFERRED LANGUAGES</Text>
      <View style={styles.langSection}>
        {(['Reading', 'Speaking', 'Listening'] as const).map((label, i) => {
          const key = label.toLowerCase() as 'reading' | 'speaking' | 'listening';
          const value = key === 'reading' ? langReading : key === 'speaking' ? langSpeaking : langListening;
          const setter = key === 'reading' ? setLangReading : key === 'speaking' ? setLangSpeaking : setLangListening;
          return (
            <View key={key} style={styles.langRow}>
              <Text style={styles.inputLabel}>{label}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langScroll}>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <TouchableOpacity key={lang.code} style={[styles.langChip, value === lang.code && styles.langChipActive]} onPress={() => setter(lang.code)}>
                    <Text style={styles.langFlag}>{lang.flag}</Text>
                    <Text style={[styles.langText, value === lang.code && { color: Colors.accent }]}>{lang.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          );
        })}
      </View>

      <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save profile'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  sectionTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  inputGroup: { gap: 12 },
  inputLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  langSection: { gap: 12 },
  langRow: { gap: 8 },
  langScroll: { flexDirection: 'row', gap: 8 },
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
  saveBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: Colors.background, fontSize: 16, fontWeight: '700' },
});
