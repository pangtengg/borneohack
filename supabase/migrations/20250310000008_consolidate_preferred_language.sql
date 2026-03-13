-- Consolidate lang_reading/lang_speaking/lang_listening → preferred_language
ALTER TABLE public.survivor_profiles
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en';

-- Migrate existing data: use lang_reading as the single preferred language
UPDATE public.survivor_profiles
  SET preferred_language = COALESCE(lang_reading, 'en')
  WHERE preferred_language IS NULL OR preferred_language = 'en';

-- Update profiles table too (parent)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en';

UPDATE public.profiles
  SET preferred_language = COALESCE(lang_reading, 'en')
  WHERE preferred_language IS NULL OR preferred_language = 'en';

-- Update trigger to use preferred_language
CREATE OR REPLACE FUNCTION public.handle_new_survivor()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.authority_profiles WHERE id = new.id) THEN
    INSERT INTO public.survivor_profiles (id, display_name, preferred_language)
    VALUES (new.id, 'Survivor', 'en')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
