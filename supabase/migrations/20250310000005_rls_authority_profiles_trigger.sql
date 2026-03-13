-- Update RLS policies from profiles to authority_profiles
-- Add survivor_profiles trigger for new users

-- 1. Drop old policies that reference profiles
DROP POLICY IF EXISTS "Authorities create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Authorities can view all reports" ON public.reports;

-- 2. Recreate with authority_profiles
CREATE POLICY "Authorities create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (
    auth.uid() = authority_id
    AND EXISTS (SELECT 1 FROM public.authority_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Authorities can view all reports"
  ON public.reports FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.authority_profiles WHERE id = auth.uid())
  );

-- 3. Survivor profile trigger for new auth.users
CREATE OR REPLACE FUNCTION public.handle_new_survivor()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.authority_profiles WHERE id = new.id) THEN
    INSERT INTO public.survivor_profiles (id, lang_reading, lang_speaking, lang_listening)
    VALUES (new.id, 'en', 'en', 'en')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_survivor ON auth.users;
CREATE TRIGGER on_auth_user_created_survivor
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_survivor();
