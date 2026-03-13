import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export type UserRole = 'survivor' | 'authority';

export interface Profile {
  id: string;
  role: UserRole;
  // survivor_profiles
  display_name?: string;
  preferred_language?: string;
  // profiles (personal info)
  email?: string;
  phone_number?: string;
  age?: number;
  gender?: string;
  nationality?: string;
  address?: string;
  medical_conditions?: string;
  emergency_contacts?: Array<{ name: string; phone: string }>;
  // authority_profiles
  full_name?: string;
  service_name?: string;
  rank?: string;
  office_location?: string;
  superior_name?: string;
  superior_contact?: string;
  office_number?: string;
  working_hours?: string;
  staff_id?: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const role: UserRole = (profile?.role as UserRole) ?? 'survivor';

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data: authData } = await supabase
      .from('authority_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (authData) {
      setProfile({
        id: user.id,
        role: 'authority',
        email: user.email,
        ...authData,
      } as Profile);
      setLoading(false);
      return;
    }

    const [survResult, personalResult] = await Promise.all([
      supabase
        .from('survivor_profiles')
        .select('id, display_name, preferred_language')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('age, gender, nationality, address, medical_conditions, emergency_contacts, phone_number')
        .eq('id', user.id)
        .maybeSingle(),
    ]);

    const merged: Profile = {
      id: user.id,
      role: 'survivor',
      email: user.email,
      ...(personalResult.data ?? {}),
      ...(survResult.data ?? {}),
    } as Profile;

    setProfile(merged);
    setLoading(false);
  }, [user?.id, user?.email]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, role, loading, refetch: fetchProfile };
}
