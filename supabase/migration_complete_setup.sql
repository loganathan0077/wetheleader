-- ==============================================================================
-- WE THE LEADER - MIGRATION 20261127: COMPLETE SUPABASE SETUP
-- Safe, idempotent migration to upgrade database tables, security & storage
-- ==============================================================================

-- 1. Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create profiles table if not exists
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

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Authorization Helper Functions
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

CREATE OR REPLACE FUNCTION public.is_coordinator_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'coordinator')
          AND is_active = true
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_coordinator_or_admin() TO anon, authenticated;

-- Profiles RLS
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.is_coordinator_or_admin());

DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
CREATE POLICY "Admins have full access to profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 3b. Membership counters table
CREATE TABLE IF NOT EXISTS public.membership_counters (
    year INT PRIMARY KEY,
    last_sequence INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.membership_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Atomic counter execution via RPC" ON public.membership_counters;
CREATE POLICY "Atomic counter execution via RPC"
ON public.membership_counters FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 4. Update members table safely
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_id TEXT UNIQUE,
    membership_number TEXT UNIQUE,
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    mobile_number TEXT NOT NULL,
    district TEXT NOT NULL DEFAULT 'Coimbatore',
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Idempotent column additions for members
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS membership_id TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS membership_number TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS tamil_name TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS village TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS residential_address TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS willing_to_donate_blood TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS willing_to_volunteer TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS hobbies TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS photo_path TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS voter_id TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending';

-- Unique constraint on membership_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'members_membership_id_key'
    ) THEN
        ALTER TABLE public.members ADD CONSTRAINT members_membership_id_key UNIQUE (membership_id);
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END;
$$;

-- Bidirectional column synchronization trigger
CREATE OR REPLACE FUNCTION public.trg_sync_members_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.membership_id IS NULL OR NEW.membership_id = '' THEN
        IF NEW.membership_number IS NOT NULL AND NEW.membership_number <> '' THEN
            NEW.membership_id := NEW.membership_number;
        ELSE
            NEW.membership_id := public.generate_next_membership_number();
            NEW.membership_number := NEW.membership_id;
        END IF;
    ELSE
        NEW.membership_number := NEW.membership_id;
    END IF;

    IF NEW.phone IS NULL OR NEW.phone = '' THEN
        NEW.phone := NEW.mobile_number;
    ELSE
        NEW.mobile_number := NEW.phone;
    END IF;

    IF NEW.village IS NULL OR NEW.village = '' THEN
        NEW.village := NEW.village_name;
    ELSE
        NEW.village_name := NEW.village;
    END IF;

    IF NEW.street IS NULL OR NEW.street = '' THEN
        NEW.street := NEW.street_name;
    ELSE
        NEW.street_name := NEW.street;
    END IF;

    IF NEW.residential_address IS NULL OR NEW.residential_address = '' THEN
        NEW.residential_address := NEW.address;
    ELSE
        NEW.address := NEW.residential_address;
    END IF;

    IF NEW.willing_to_volunteer IS NULL OR NEW.willing_to_volunteer = '' THEN
        NEW.willing_to_volunteer := NEW.volunteer_willingness;
    ELSE
        NEW.volunteer_willingness := NEW.willing_to_volunteer;
    END IF;

    IF NEW.willing_to_donate_blood IS NULL OR NEW.willing_to_donate_blood = '' THEN
        NEW.willing_to_donate_blood := NEW.blood_donation_willingness;
    ELSE
        NEW.blood_donation_willingness := NEW.willing_to_donate_blood;
    END IF;

    IF NEW.photo_path IS NULL OR NEW.photo_path = '' THEN
        NEW.photo_path := NEW.profile_photo_url;
    ELSE
        NEW.profile_photo_url := NEW.photo_path;
    END IF;

    IF NEW.voter_id IS NULL OR NEW.voter_id = '' THEN
        NEW.voter_id := NEW.voter_id_number;
    ELSE
        NEW.voter_id_number := NEW.voter_id;
    END IF;

    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_members_columns ON public.members;
CREATE TRIGGER trigger_sync_members_columns
BEFORE INSERT OR UPDATE ON public.members
FOR EACH ROW
EXECUTE FUNCTION public.trg_sync_members_columns();

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Table Grants for members
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.members TO authenticated;
GRANT INSERT ON TABLE public.members TO anon;

-- Members RLS
DROP POLICY IF EXISTS "Public member registration" ON public.members;
DROP POLICY IF EXISTS "Members read own record" ON public.members;
DROP POLICY IF EXISTS "Admins read all members" ON public.members;
DROP POLICY IF EXISTS "Admins update members" ON public.members;
DROP POLICY IF EXISTS "Admins delete members" ON public.members;

CREATE POLICY "Public member registration"
ON public.members FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins read all members"
ON public.members FOR SELECT
TO authenticated
USING (public.is_coordinator_or_admin());

CREATE POLICY "Members read own record"
ON public.members FOR SELECT
TO authenticated
USING (auth_user_id IS NOT NULL AND auth_user_id = auth.uid());

CREATE POLICY "Admins update members"
ON public.members FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins delete members"
ON public.members FOR DELETE
TO authenticated
USING (public.is_admin());

-- 5. Activities Table
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_tamil TEXT NOT NULL,
    title_english TEXT NOT NULL,
    description_tamil TEXT,
    description_english TEXT,
    image_path TEXT,
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published activities" ON public.activities;
CREATE POLICY "Public read published activities"
ON public.activities FOR SELECT
TO anon, authenticated
USING (is_published = true OR public.is_coordinator_or_admin());

DROP POLICY IF EXISTS "Admins manage activities" ON public.activities;
CREATE POLICY "Admins manage activities"
ON public.activities FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6. Membership ID Logs Table
CREATE TABLE IF NOT EXISTS public.membership_id_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.membership_id_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read id logs" ON public.membership_id_logs;
CREATE POLICY "Admins read id logs"
ON public.membership_id_logs FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "System insert id logs" ON public.membership_id_logs;
CREATE POLICY "System insert id logs"
ON public.membership_id_logs FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 7. Update website_settings
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

ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS organisation_name TEXT DEFAULT 'WE the Leader';
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS contact_person TEXT DEFAULT 'Mr. A. Annamalai (Kinathukadavu Incharge)';
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS contact_number TEXT DEFAULT '9750855623';
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS social_media_links JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS menu_settings JSONB DEFAULT '{"membership": true, "contact": true, "about": true}'::jsonb;

-- Table Grants for website_settings
GRANT SELECT ON TABLE public.website_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.website_settings TO authenticated;

ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read website_settings" ON public.website_settings;
CREATE POLICY "Public read website_settings"
ON public.website_settings FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins write website_settings" ON public.website_settings;
DROP POLICY IF EXISTS "Admins manage website_settings" ON public.website_settings;
DROP POLICY IF EXISTS "Admins insert website_settings" ON public.website_settings;
DROP POLICY IF EXISTS "Admins update website_settings" ON public.website_settings;
DROP POLICY IF EXISTS "Admins delete website_settings" ON public.website_settings;

CREATE POLICY "Admins insert website_settings"
ON public.website_settings FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins update website_settings"
ON public.website_settings FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins delete website_settings"
ON public.website_settings FOR DELETE
TO authenticated
USING (public.is_admin());

-- 8. Storage Buckets & Policies (member-photos, activity-images, organisation-assets)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('member-photos', 'member-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('activity-images', 'activity-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('organisation-assets', 'organisation-assets', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE
SET file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types,
    public = true;

UPDATE storage.buckets SET public = true WHERE id = 'member-photos';

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public upload member photos during registration" ON storage.objects;
CREATE POLICY "Public upload member photos during registration"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'member-photos');

DROP POLICY IF EXISTS "Admins and coordinators access member photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow member photos selection for signed URLs" ON storage.objects;
CREATE POLICY "Allow member photos selection for signed URLs"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'member-photos');

DROP POLICY IF EXISTS "Admins delete member photos" ON storage.objects;
CREATE POLICY "Admins delete member photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'member-photos' AND public.is_admin());
