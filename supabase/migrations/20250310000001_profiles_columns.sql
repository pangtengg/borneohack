-- Add missing columns to profiles table for full survivor profile
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS legal_name text,
ADD COLUMN IF NOT EXISTS nationality text,
ADD COLUMN IF NOT EXISTS ic_passport text,
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS race text,
ADD COLUMN IF NOT EXISTS religion text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS medical_conditions text,
ADD COLUMN IF NOT EXISTS emergency_contacts jsonb;
