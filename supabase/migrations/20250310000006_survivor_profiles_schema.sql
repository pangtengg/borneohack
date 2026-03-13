-- survivor_profiles: id, display_name, created_at (references profiles)
-- Run if your survivor_profiles has: id, display_name NOT NULL, created_at. Adds lang columns.
-- Schema: survivor_profiles(id uuid PK, display_name text NOT NULL, created_at timestamptz, fk→profiles(id))

-- Add lang columns if missing (for Report chat preferred language)
ALTER TABLE public.survivor_profiles
  ADD COLUMN IF NOT EXISTS lang_reading text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS lang_speaking text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS lang_listening text DEFAULT 'en';

-- Fix trigger: survivor_profiles requires display_name NOT NULL
CREATE OR REPLACE FUNCTION public.handle_new_survivor()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.authority_profiles WHERE id = new.id) THEN
    INSERT INTO public.survivor_profiles (id, display_name, lang_reading, lang_speaking, lang_listening)
    VALUES (new.id, 'Survivor', 'en', 'en', 'en')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
