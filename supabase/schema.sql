-- ==============================================================================
-- WE THE LEADER - COMPLETE PRODUCTION DATABASE SCHEMA & MIGRATION
-- Project: We The Leader – Kinathukadavu
-- Website: https://www.wetheleader.online
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. TABLE: profiles (Authoritative Role & Account Management)
-- ------------------------------------------------------------------------------
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

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 3. AUTHORIZATION HELPER FUNCTIONS (SECURITY DEFINER, STRICT SEARCH PATH)
-- ------------------------------------------------------------------------------
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

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.is_coordinator_or_admin());

DROP POLICY IF EXISTS "Users can update own basic profile" ON public.profiles;
CREATE POLICY "Users can update own basic profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())); -- Prevents self-escalation

DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
CREATE POLICY "Admins have full access to profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. TABLE: membership_counters (Atomic sequential numbering per calendar year)
-- ------------------------------------------------------------------------------
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

-- Atomic sequence generator
CREATE OR REPLACE FUNCTION public.generate_next_membership_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_yr INT;
    next_seq INT;
    formatted_id TEXT;
BEGIN
    current_yr := EXTRACT(YEAR FROM CURRENT_DATE)::INT;
    
    INSERT INTO public.membership_counters (year, last_sequence, updated_at)
    VALUES (current_yr, 1, timezone('utc'::text, now()))
    ON CONFLICT (year) DO UPDATE
    SET last_sequence = public.membership_counters.last_sequence + 1,
        updated_at = timezone('utc'::text, now())
    RETURNING last_sequence INTO next_seq;
    
    formatted_id := 'WTL-' || current_yr::TEXT || '-' || LPAD(next_seq::TEXT, 5, '0');
    RETURN formatted_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_next_membership_number() TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 5. TABLE: members (Core membership table with backwards-compatible columns)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_id TEXT UNIQUE,
    membership_number TEXT UNIQUE,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    tamil_name TEXT,
    date_of_birth DATE NOT NULL,
    gender TEXT,
    phone TEXT,
    mobile_number TEXT,
    email TEXT,
    village TEXT,
    village_name TEXT,
    street TEXT,
    street_name TEXT,
    ward_number TEXT,
    district TEXT NOT NULL DEFAULT 'Coimbatore',
    residential_address TEXT,
    address TEXT,
    occupation TEXT,
    blood_group TEXT,
    willing_to_donate_blood TEXT,
    blood_donation_willingness TEXT,
    willing_to_volunteer TEXT,
    volunteer_willingness TEXT,
    hobbies TEXT,
    other_skills TEXT,
    skills TEXT[] DEFAULT '{}',
    photo_path TEXT,
    profile_photo_url TEXT,
    voter_id TEXT,
    voter_id_number TEXT,
    aadhaar_number TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'ta',
    consent_given BOOLEAN NOT NULL DEFAULT true,
    approval_status TEXT NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bidirectional column synchronization trigger to guarantee 100% frontend compatibility
CREATE OR REPLACE FUNCTION public.trg_sync_members_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Synchronize membership ID
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

    -- Synchronize phone / mobile_number
    IF NEW.phone IS NULL OR NEW.phone = '' THEN
        NEW.phone := NEW.mobile_number;
    ELSE
        NEW.mobile_number := NEW.phone;
    END IF;

    -- Synchronize village / village_name
    IF NEW.village IS NULL OR NEW.village = '' THEN
        NEW.village := NEW.village_name;
    ELSE
        NEW.village_name := NEW.village;
    END IF;

    -- Synchronize street / street_name
    IF NEW.street IS NULL OR NEW.street = '' THEN
        NEW.street := NEW.street_name;
    ELSE
        NEW.street_name := NEW.street;
    END IF;

    -- Synchronize address / residential_address
    IF NEW.residential_address IS NULL OR NEW.residential_address = '' THEN
        NEW.residential_address := NEW.address;
    ELSE
        NEW.address := NEW.residential_address;
    END IF;

    -- Synchronize volunteer willingness
    IF NEW.willing_to_volunteer IS NULL OR NEW.willing_to_volunteer = '' THEN
        NEW.willing_to_volunteer := NEW.volunteer_willingness;
    ELSE
        NEW.volunteer_willingness := NEW.willing_to_volunteer;
    END IF;

    -- Synchronize blood donation willingness
    IF NEW.willing_to_donate_blood IS NULL OR NEW.willing_to_donate_blood = '' THEN
        NEW.willing_to_donate_blood := NEW.blood_donation_willingness;
    ELSE
        NEW.blood_donation_willingness := NEW.willing_to_donate_blood;
    END IF;

    -- Synchronize photo path / url
    IF NEW.photo_path IS NULL OR NEW.photo_path = '' THEN
        NEW.photo_path := NEW.profile_photo_url;
    ELSE
        NEW.profile_photo_url := NEW.photo_path;
    END IF;

    -- Synchronize voter id
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

-- Indexes for performance & security
CREATE INDEX IF NOT EXISTS idx_members_phone ON public.members(phone);
CREATE INDEX IF NOT EXISTS idx_members_mobile ON public.members(mobile_number);
CREATE INDEX IF NOT EXISTS idx_members_membership_id ON public.members(membership_id);
CREATE INDEX IF NOT EXISTS idx_members_auth_user ON public.members(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_members_approval ON public.members(approval_status);
CREATE INDEX IF NOT EXISTS idx_members_reg_date ON public.members(registration_date DESC);

-- Enable RLS on members
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- RLS Policies on members
-- 1. Public Self-Registration: Visitors can submit membership registrations without reading other records
DROP POLICY IF EXISTS "Public member registration" ON public.members;
CREATE POLICY "Public member registration"
ON public.members FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 2. Authenticated Members can read ONLY their own record
DROP POLICY IF EXISTS "Members read own record" ON public.members;
CREATE POLICY "Members read own record"
ON public.members FOR SELECT
TO authenticated
USING (
    auth_user_id = auth.uid() 
    OR public.is_coordinator_or_admin()
);

-- 3. Only Administrators can update member records (including approval_status)
DROP POLICY IF EXISTS "Admins update members" ON public.members;
CREATE POLICY "Admins update members"
ON public.members FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Only Administrators can delete member records
DROP POLICY IF EXISTS "Admins delete members" ON public.members;
CREATE POLICY "Admins delete members"
ON public.members FOR DELETE
TO authenticated
USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. TABLE: website_settings (Dynamic Public Configuration)
-- ------------------------------------------------------------------------------
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

-- Ensure columns exist if table was already created
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS organisation_name TEXT DEFAULT 'WE the Leader';
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS contact_person TEXT DEFAULT 'Mr. A. Annamalai (Kinathukadavu Incharge)';
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS contact_number TEXT DEFAULT '9750855623';
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS social_media_links JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS menu_settings JSONB DEFAULT '{"membership": true, "contact": true, "about": true}'::jsonb;

-- Trigger to sync social_links and social_media_links
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

-- Table Grants for website_settings
GRANT SELECT ON TABLE public.website_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.website_settings TO authenticated;

-- Enable RLS on website_settings
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

-- Public can read website settings
DROP POLICY IF EXISTS "Public read website_settings" ON public.website_settings;
CREATE POLICY "Public read website_settings"
ON public.website_settings FOR SELECT
TO anon, authenticated
USING (true);

-- Only verified administrators can insert, update, delete website settings
DROP POLICY IF EXISTS "Admins manage website_settings" ON public.website_settings;
DROP POLICY IF EXISTS "Admins write website_settings" ON public.website_settings;
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

-- Seed initial row
INSERT INTO public.website_settings (id, key)
VALUES ('homepage_contact', 'homepage_contact')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 7. TABLE: activities (Community Initiatives & Activities)
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_activities_date ON public.activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_published ON public.activities(is_published);

-- Enable RLS on activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Public can view published activities; coordinators & admins can view all
DROP POLICY IF EXISTS "Public read published activities" ON public.activities;
CREATE POLICY "Public read published activities"
ON public.activities FOR SELECT
TO anon, authenticated
USING (is_published = true OR public.is_coordinator_or_admin());

-- Only admins can manage activities
DROP POLICY IF EXISTS "Admins manage activities" ON public.activities;
CREATE POLICY "Admins manage activities"
ON public.activities FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8. TABLE: membership_id_logs (Audit Trail for ID Downloads & Verifications)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.membership_id_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'DOWNLOAD_ID', 'VERIFY_QR', 'PRINT_ID'
    performed_by TEXT NOT NULL, -- 'MEMBER_VERIFIED', user UUID, or 'ADMIN'
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_id_logs_member ON public.membership_id_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_id_logs_created ON public.membership_id_logs(created_at DESC);

ALTER TABLE public.membership_id_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view logs; service RPCs can insert logs
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

-- ------------------------------------------------------------------------------
-- 9. SECURE RPC FUNCTIONS: ID Verification & Download Protection
-- ------------------------------------------------------------------------------

-- Dual-Factor Member Verification for ID Card Download (Mobile + [ID or DOB])
-- Enforces approval_status = 'approved' and records an audit log entry
CREATE OR REPLACE FUNCTION public.verify_member_for_download(
    p_mobile TEXT,
    p_id_or_dob TEXT
)
RETURNS SETOF public.members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    clean_phone TEXT := regexp_replace(p_mobile, '[^0-9]', '', 'g');
    clean_param TEXT := trim(p_id_or_dob);
    matched_member public.members;
BEGIN
    IF length(clean_phone) < 10 OR length(clean_param) = 0 THEN
        RETURN;
    END IF;

    SELECT * INTO matched_member
    FROM public.members m
    WHERE regexp_replace(COALESCE(m.mobile_number, m.phone), '[^0-9]', '', 'g') = clean_phone
      AND (
          lower(COALESCE(m.membership_number, m.membership_id)) = lower(clean_param)
          OR m.date_of_birth::TEXT = clean_param
      )
      AND m.approval_status = 'approved'
    LIMIT 1;

    IF matched_member.id IS NOT NULL THEN
        -- Insert audit log
        INSERT INTO public.membership_id_logs (member_id, action, performed_by)
        VALUES (matched_member.id, 'DOWNLOAD_ID', 'VERIFIED_USER');

        RETURN NEXT matched_member;
    END IF;

    RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_member_for_download(TEXT, TEXT) TO anon, authenticated;

-- Public QR Scan Verification (strictly public non-sensitive details)
CREATE OR REPLACE FUNCTION public.verify_member_public(p_id TEXT)
RETURNS TABLE (
    membership_number TEXT,
    full_name TEXT,
    district TEXT,
    village_name TEXT,
    ward_number TEXT,
    registration_date TIMESTAMP WITH TIME ZONE,
    is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF length(trim(p_id)) = 0 THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        COALESCE(m.membership_number, m.membership_id) AS membership_number,
        m.full_name,
        m.district,
        COALESCE(m.village_name, m.village) AS village_name,
        m.ward_number,
        m.registration_date,
        (m.approval_status = 'approved') AS is_valid
    FROM public.members m
    WHERE (m.id::TEXT = trim(p_id) 
       OR lower(COALESCE(m.membership_number, m.membership_id)) = lower(trim(p_id)))
      AND m.approval_status = 'approved'
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_member_public(TEXT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 10. AUTH TRIGGER & INITIAL ADMIN SETUP PROCEDURE
-- ------------------------------------------------------------------------------

-- Trigger: When a new user signs up in auth.users, create their profile in public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, phone, role, is_active)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        NEW.phone,
        'member',
        true
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

-- Secure Initial Admin Setup Procedure (Run in Supabase Dashboard SQL Editor)
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
    WHERE lower(email) = lower(trim(p_admin_email));

    IF target_user_id IS NULL THEN
        RETURN 'ERROR: User with email ' || p_admin_email || ' does not exist in auth.users. Please create the user first in Supabase Auth.';
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role, is_active)
    VALUES (target_user_id, p_admin_email, 'WE The Leader Admin', 'admin', true)
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin',
        is_active = true,
        updated_at = timezone('utc'::text, now());

    RETURN 'SUCCESS: User ' || p_admin_email || ' has been granted authoritative administrator role.';
END;
$$;

GRANT EXECUTE ON FUNCTION public.setup_initial_admin(TEXT) TO authenticated;

-- ------------------------------------------------------------------------------
-- 11. SUPABASE STORAGE BUCKETS & POLICIES
-- ------------------------------------------------------------------------------
-- 1. member-photos (Private, protected access)
-- 2. activity-images (Public read, admin write)
-- 3. organisation-assets (Public read, admin write)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('member-photos', 'member-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('activity-images', 'activity-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('organisation-assets', 'organisation-assets', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE
SET file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS Policies
-- A. member-photos policies
DROP POLICY IF EXISTS "Public upload member photos during registration" ON storage.objects;
CREATE POLICY "Public upload member photos during registration"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'member-photos');

DROP POLICY IF EXISTS "Admins and coordinators access member photos" ON storage.objects;
CREATE POLICY "Admins and coordinators access member photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'member-photos' AND public.is_coordinator_or_admin());

DROP POLICY IF EXISTS "Admins delete member photos" ON storage.objects;
CREATE POLICY "Admins delete member photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'member-photos' AND public.is_admin());

-- B. activity-images policies
DROP POLICY IF EXISTS "Public read activity images" ON storage.objects;
CREATE POLICY "Public read activity images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'activity-images');

DROP POLICY IF EXISTS "Admins manage activity images" ON storage.objects;
CREATE POLICY "Admins manage activity images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'activity-images' AND public.is_admin())
WITH CHECK (bucket_id = 'activity-images' AND public.is_admin());

-- C. organisation-assets policies
DROP POLICY IF EXISTS "Public read organisation assets" ON storage.objects;
CREATE POLICY "Public read organisation assets"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'organisation-assets');

DROP POLICY IF EXISTS "Admins manage organisation assets" ON storage.objects;
CREATE POLICY "Admins manage organisation assets"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'organisation-assets' AND public.is_admin())
WITH CHECK (bucket_id = 'organisation-assets' AND public.is_admin());
