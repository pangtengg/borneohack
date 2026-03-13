-- Add phone_number to profiles (personal info field)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number text NULL;

-- Add survivor_info jsonb to reports (auto-attached on submission)
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS survivor_info jsonb NULL;
