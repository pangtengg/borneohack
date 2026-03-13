import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export type UserRole = 'survivor' | 'authority';

export interface Profile {
  id: string;
  role: UserRole;
  display_name?: string;
  lang_reading?: string;
  lang_speaking?: string;
  lang_listening?: string;
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

  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    void (async () => {
      // Check authority_profiles first; if found, user is authority
      const { data: authData } = await supabase
        .from('authority_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!mounted) return;

      if (authData) {
        setProfile({
          id: user.id,
          role: 'authority',
          service_name: authData.service_name,
          ...authData,
        } as Profile);
        setLoading(false);
        return;
      }

      // Else fetch survivor_profiles (schema: id, display_name, created_at, lang_*)
      const { data: survData, error } = await supabase
        .from('survivor_profiles')
        .select('id, display_name, lang_reading, lang_speaking, lang_listening')
        .eq('id', user.id)
        .maybeSingle();

      if (!mounted) return;
      if (error) {
        setProfile(null);
      } else {
        setProfile(
          survData
            ? ({ id: user.id, role: 'survivor', ...survData } as Profile)
            : ({ id: user.id, role: 'survivor' } as Profile)
        );
      }
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return { profile, role, loading };
}
