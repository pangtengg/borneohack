-- Schema cleanup: survivor_profiles, broadcasts, dialect_entries
-- Run after profiles, authority_profiles exist. Drops translation_logs.

-- 1. Create survivor_profiles (if not exists) - mirrors profiles for survivors
CREATE TABLE IF NOT EXISTS public.survivor_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_name text,
  nationality text,
  ic_passport text,
  age integer,
  gender text,
  race text,
  religion text,
  address text,
  medical_conditions text,
  emergency_contacts jsonb,
  lang_reading text DEFAULT 'en',
  lang_speaking text DEFAULT 'en',
  lang_listening text DEFAULT 'en',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.survivor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Survivors read own profile"
  ON public.survivor_profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Survivors update own profile"
  ON public.survivor_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Survivors insert own profile"
  ON public.survivor_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Migrate from profiles if it exists (run manually if your profiles schema differs)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    INSERT INTO public.survivor_profiles (id, legal_name, nationality, ic_passport, age, gender, race, religion, address, medical_conditions, emergency_contacts, lang_reading, lang_speaking, lang_listening)
    SELECT id, legal_name, nationality, ic_passport, age, gender, race, religion, address, medical_conditions, emergency_contacts, COALESCE(lang_reading, 'en'), COALESCE(lang_speaking, 'en'), COALESCE(lang_listening, 'en')
    FROM public.profiles
    WHERE role = 'survivor'
    ON CONFLICT (id) DO NOTHING;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Skip if columns don't match
END $$;

-- 2. Broadcasts table - authorities create, survivors read
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL,
  body text NOT NULL,
  sender text,
  authority_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_broadcasts_created_at ON public.broadcasts(created_at DESC);

ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone reads broadcasts"
  ON public.broadcasts FOR SELECT USING (true);

CREATE POLICY "Authorities manage broadcasts"
  ON public.broadcasts FOR ALL
  USING (
    auth.uid() = authority_id
    AND EXISTS (SELECT 1 FROM public.authority_profiles WHERE id = auth.uid())
  )
  WITH CHECK (auth.uid() = authority_id);

-- Seed broadcasts (only if we have users - add more via Authority dashboard)
DO $$
DECLARE first_user uuid;
BEGIN
  SELECT id INTO first_user FROM auth.users LIMIT 1;
  IF first_user IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.broadcasts LIMIT 1) THEN
    INSERT INTO public.broadcasts (title, summary, body, authority_id) VALUES
    ('Evacuation Order — Central District', 'All residents in Zones 3–5 must evacuate to Stadium by 18:00.', 'An evacuation order has been issued for Central District Zones 3–5 due to rising floodwaters. All residents are required to proceed to the Stadium evacuation center by 18:00. Bring essential documents and medication.', first_user),
    ('Medical Aid Station Open', 'Temporary medical facility now operating at Community Hall.', 'A temporary medical aid station is now open at the Community Hall. First aid, basic medical supplies, and emergency prescriptions are available.', first_user),
    ('Water Distribution Points', 'Safe drinking water available at 4 locations in the affected area.', 'Safe drinking water is being distributed at: (1) Stadium entrance, (2) Community Hall, (3) School Block B, (4) Temple compound.', first_user),
    ('Search & Rescue Update', 'Rescue teams have reached 12 stranded households today.', 'Search and rescue teams report 12 households evacuated from flood-affected zones. If you or someone you know is stranded, call the emergency hotline or use the Report feature in this app.', first_user);
  END IF;
END $$;

-- 3. Unified dialect_entries (ghost + glossary combined)
CREATE TABLE IF NOT EXISTS public.dialect_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dialect_id text NOT NULL,
  phrase_text text NOT NULL,
  formal_text text,
  meaning_en text,
  meaning_ms text,
  target_lang text DEFAULT 'ms',
  context_tag text DEFAULT 'emergency',
  storage_path text,
  mfcc_cache jsonb,
  recorded_by text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dialect_entries_dialect ON public.dialect_entries(dialect_id);

-- Migrate from ghost_phrases (if exists)
INSERT INTO public.dialect_entries (dialect_id, phrase_text, meaning_en, meaning_ms, context_tag, storage_path, mfcc_cache, recorded_by)
SELECT language_code, phrase_text, meaning_en, meaning_ms, context_tag, storage_path, mfcc_cache, recorded_by
FROM public.ghost_phrases
WHERE NOT EXISTS (SELECT 1 FROM public.dialect_entries LIMIT 1);

-- Migrate from glossary_entries (if exists)
INSERT INTO public.dialect_entries (dialect_id, phrase_text, formal_text, target_lang)
SELECT dialect_id, slang, formal, target_lang
FROM public.glossary_entries
WHERE NOT EXISTS (SELECT 1 FROM public.dialect_entries WHERE formal_text IS NOT NULL LIMIT 1);

-- 4. Drop translation_logs
DROP TABLE IF EXISTS public.translation_logs;
