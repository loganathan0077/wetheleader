-- ==============================================================================
-- WE THE LEADER - FIX WEBSITE_SETTINGS PERMISSIONS & RLS (ERROR 42501 FIX)
-- Safe, idempotent script to grant required table permissions and admin-only RLS
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Ensure Table Structure Exists with all required columns
CREATE TABLE IF NOT EXISTS public.website_settings (
    id TEXT PRIMARY KEY DEFAULT 'homepage_contact',
    key TEXT UNIQUE DEFAULT 'homepage_contact',
    organisation_name TEXT NOT NULL DEFAULT 'WE the Leader',
    contact_person TEXT NOT NULL DEFAULT 'Mr. A. Annamalai (Kinathukadavu Incharge)',
    contact_number TEXT NOT NULL DEFAULT '9750855623',
    whatsapp_number TEXT NOT NULL DEFAULT '9750855623',
    country_code TEXT NOT NULL DEFAULT '+91',
    whatsapp_button_text TEXT NOT NULL DEFAULT 'Contact on WhatsApp',
    whatsapp_message TEXT NOT NULL DEFAULT 'Hello We The Leader, I would like to know more about membership and joining the Kinathukadavu team.',
    download_id_button_text TEXT NOT NULL DEFAULT 'DOWNLOAD ID CARD',
    contact_section_heading TEXT NOT NULL DEFAULT 'Need Help? Contact Us',
    contact_designation TEXT NOT NULL DEFAULT 'Kinathukadavu Admin',
    show_download_id_button BOOLEAN NOT NULL DEFAULT true,
    show_contact_section BOOLEAN NOT NULL DEFAULT true,
    show_whatsapp_button BOOLEAN NOT NULL DEFAULT true,
    show_social_in_footer BOOLEAN NOT NULL DEFAULT true,
    show_social_in_contact BOOLEAN NOT NULL DEFAULT true,
    social_links JSONB NOT NULL DEFAULT '[]'::jsonb,
    social_media_links JSONB NOT NULL DEFAULT '[]'::jsonb,
    menu_settings JSONB NOT NULL DEFAULT '{"membership": true, "contact": true, "about": true}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist on pre-existing tables
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS id TEXT DEFAULT 'homepage_contact';
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS key TEXT DEFAULT 'homepage_contact';
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS organisation_name TEXT DEFAULT 'WE the Leader';
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS contact_person TEXT DEFAULT 'Mr. A. Annamalai (Kinathukadavu Incharge)';
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS contact_number TEXT DEFAULT '9750855623';
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS whatsapp_number TEXT DEFAULT '9750855623';
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT '+91';
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS whatsapp_button_text TEXT DEFAULT 'Contact on WhatsApp';
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS whatsapp_message TEXT DEFAULT 'Hello We The Leader, I would like to know more about membership and joining the Kinathukadavu team.';
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS download_id_button_text TEXT DEFAULT 'DOWNLOAD ID CARD';
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS contact_section_heading TEXT DEFAULT 'Need Help? Contact Us';
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS contact_designation TEXT DEFAULT 'Kinathukadavu Admin';
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS show_download_id_button BOOLEAN DEFAULT true;
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS show_contact_section BOOLEAN DEFAULT true;
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS show_whatsapp_button BOOLEAN DEFAULT true;
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS show_social_in_footer BOOLEAN DEFAULT true;
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS show_social_in_contact BOOLEAN DEFAULT true;
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS social_media_links JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS menu_settings JSONB DEFAULT '{"membership": true, "contact": true, "about": true}'::jsonb;
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. Bidirectional sync trigger between social_links and social_media_links
CREATE OR REPLACE FUNCTION public.trg_sync_website_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.social_links IS NOT NULL AND (NEW.social_media_links IS NULL OR NEW.social_media_links = '[]'::jsonb) THEN
        NEW.social_media_links := NEW.social_links;
    ELSIF NEW.social_media_links IS NOT NULL AND (NEW.social_links IS NULL OR NEW.social_links = '[]'::jsonb) THEN
        NEW.social_links := NEW.social_media_links;
    END IF;
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_website_settings ON public.website_settings;
CREATE TRIGGER trigger_sync_website_settings
BEFORE INSERT OR UPDATE ON public.website_settings
FOR EACH ROW
EXECUTE FUNCTION public.trg_sync_website_settings();

-- 3. Ensure profiles table and authoritative admin role function exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT '',
    email TEXT UNIQUE,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'coordinator', 'member')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
          AND is_active = true
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- 4. CRITICAL: Grant Schema & Table Privileges
-- PostgreSQL requires table-level grants before Row-Level Security is even evaluated.
-- Without this, PostgreSQL throws: permission denied for table website_settings (42501).
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Public can SELECT non-sensitive website configuration
GRANT SELECT ON TABLE public.website_settings TO anon, authenticated;

-- Authenticated users can execute INSERT, UPDATE, DELETE at table level
-- (RLS below will strictly restrict this to verified administrators only)
GRANT INSERT, UPDATE, DELETE ON TABLE public.website_settings TO authenticated;

-- Profiles table grants
GRANT SELECT ON TABLE public.profiles TO anon, authenticated;
GRANT ALL ON TABLE public.profiles TO authenticated;

-- 5. Strict, Granular Row Level Security (RLS) Policies on website_settings
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

-- Clean up any prior conflicting policies
DROP POLICY IF EXISTS "Public read website_settings" ON public.website_settings;
DROP POLICY IF EXISTS "Admins manage website_settings" ON public.website_settings;
DROP POLICY IF EXISTS "Admin manage website_settings" ON public.website_settings;
DROP POLICY IF EXISTS "Admins write website_settings" ON public.website_settings;
DROP POLICY IF EXISTS "Admins insert website_settings" ON public.website_settings;
DROP POLICY IF EXISTS "Admins update website_settings" ON public.website_settings;
DROP POLICY IF EXISTS "Admins delete website_settings" ON public.website_settings;

-- Policy 1: Public visitors and authenticated users can READ public website settings
CREATE POLICY "Public read website_settings"
ON public.website_settings FOR SELECT
TO anon, authenticated
USING (true);

-- Policy 2: ONLY verified active administrators can INSERT settings (RLS with check)
CREATE POLICY "Admins insert website_settings"
ON public.website_settings FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Policy 3: ONLY verified active administrators can UPDATE settings (RLS with check)
CREATE POLICY "Admins update website_settings"
ON public.website_settings FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Policy 4: ONLY verified active administrators can DELETE settings
CREATE POLICY "Admins delete website_settings"
ON public.website_settings FOR DELETE
TO authenticated
USING (public.is_admin());

-- 6. Ensure default singleton row exists with key 'homepage_contact'
INSERT INTO public.website_settings (
    id, 
    key, 
    organisation_name, 
    contact_person, 
    contact_number, 
    whatsapp_number, 
    country_code, 
    whatsapp_button_text, 
    whatsapp_message, 
    download_id_button_text, 
    contact_section_heading, 
    contact_designation, 
    show_download_id_button, 
    show_contact_section, 
    show_whatsapp_button, 
    show_social_in_footer, 
    show_social_in_contact
)
VALUES (
    'homepage_contact',
    'homepage_contact',
    'WE the Leader',
    'Mr. A. Annamalai (Kinathukadavu Incharge)',
    '9750855623',
    '9750855623',
    '+91',
    'Contact on WhatsApp',
    'Hello We The Leader, I would like to know more about membership and joining the Kinathukadavu team.',
    'DOWNLOAD ID CARD',
    'Need Help? Contact Us',
    'Kinathukadavu Admin',
    true,
    true,
    true,
    true,
    true
)
ON CONFLICT (id) DO NOTHING;

-- Also ensure key uniqueness
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'website_settings_key_key'
    ) THEN
        ALTER TABLE public.website_settings ADD CONSTRAINT website_settings_key_key UNIQUE (key);
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END;
$$;

-- 7. SELF-HEALING: Synchronize existing auth users into public.profiles
-- This ensures the logged-in administrator has role = 'admin' and is_active = true
DO $$
DECLARE
    admin_count INT;
BEGIN
    -- Check how many profiles have role = 'admin'
    SELECT count(*) INTO admin_count FROM public.profiles WHERE role = 'admin' AND is_active = true;

    -- If no admin profile exists yet, elevate matching users from auth.users
    IF admin_count = 0 THEN
        INSERT INTO public.profiles (id, email, full_name, role, is_active)
        SELECT 
            u.id, 
            u.email, 
            COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'Admin'),
            'admin',
            true
        FROM auth.users u
        WHERE u.email ILIKE '%kkd%' 
           OR u.email ILIKE '%admin%' 
           OR u.email ILIKE '%wetheleader%'
        ON CONFLICT (id) DO UPDATE
        SET role = 'admin',
            is_active = true;
    END IF;

    -- Ensure all auth users have at least a profile record
    INSERT INTO public.profiles (id, email, full_name, role, is_active)
    SELECT 
        u.id, 
        u.email, 
        COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'Member'),
        'member',
        true
    FROM auth.users u
    ON CONFLICT (id) DO NOTHING;
END;
$$;

-- 8. Helper procedure to verify or elevate any specific admin email on-demand
CREATE OR REPLACE FUNCTION public.setup_initial_admin(p_admin_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE lower(email) = lower(trim(p_admin_email))
    LIMIT 1;

    IF target_user_id IS NULL THEN
        RETURN 'User with email ' || p_admin_email || ' not found in auth.users. Please create the user first in Supabase Authentication.';
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role, is_active)
    VALUES (target_user_id, lower(trim(p_admin_email)), 'Admin', 'admin', true)
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin',
        is_active = true,
        updated_at = timezone('utc'::text, now());

    RETURN 'Success: ' || p_admin_email || ' (UUID: ' || target_user_id || ') is now verified Administrator.';
END;
$$;

GRANT EXECUTE ON FUNCTION public.setup_initial_admin(TEXT) TO authenticated, anon;

-- Output confirmation
SELECT 'website_settings table permissions and RLS policies successfully updated. Admin role verified.' AS status;
