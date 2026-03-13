import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';

export type UserRole = 'survivor' | 'authority';

export interface Profile {
  id: string;
  role: UserRole;
  lang_reading?: string;
  lang_speaking?: string;
  lang_listening?: string;
  legal_name?: string;
  nationality?: string;
  ic_passport?: string;
  age?: number;
  gender?: string;
  race?: string;
  religion?: string;
  address?: string;
  medical_conditions?: string;
  emergency_contacts?: unknown;
  service_name?: string;
  location?: string;
  rank?: string;
  superior?: string;
  office_number?: string;
  working_hours?: string;
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
      try {
        let authData = await supabase
          .from('authority_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!mounted) return;

        if (authData.data) {
          setProfile({ ...(authData.data as Profile), role: 'authority' });
        } else {
          let survData = await supabase
            .from('survivor_profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
            
          if (!mounted) return;
          
          if (survData.data) {
            setProfile({ ...(survData.data as Profile), role: 'survivor' });
          } else {
            setProfile(null);
          }
        }
      } catch (err) {
        console.error('Exception during profile fetch:', err);
        setProfile(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return { profile, role, loading };
}
