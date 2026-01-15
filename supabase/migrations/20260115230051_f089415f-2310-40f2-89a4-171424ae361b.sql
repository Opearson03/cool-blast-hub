-- Add pourhub_staff to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pourhub_staff';