-- ==============================================================================
-- WE THE LEADER - COMPLETE MEMBERSHIP REGISTRATION APPLICATION
-- Run this in your Supabase SQL Editor:
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- TABLE 1: membership_counters (Atomic sequential numbering per calendar year)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.membership_counters (
    year INT PRIMARY KEY,
    last_sequence INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- TABLE 2: members (Core member registration table)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT,
    address TEXT,
    district TEXT NOT NULL DEFAULT 'Coimbatore',
    village_name TEXT,
    street_name TEXT,
    ward_number TEXT,
    occupation TEXT,
    blood_group TEXT,
    volunteer_willingness TEXT,
    blood_donation_willingness TEXT,
    skills TEXT[] DEFAULT '{}',
    other_skills TEXT,
    voter_id_number TEXT,
    aadhaar_number TEXT,
    profile_photo_url TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    consent_given BOOLEAN NOT NULL DEFAULT true,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_members_mobile_number ON public.members (mobile_number);
CREATE INDEX IF NOT EXISTS idx_members_village_name ON public.members (village_name);
CREATE INDEX IF NOT EXISTS idx_members_ward_number ON public.members (ward_number);
CREATE INDEX IF NOT EXISTS idx_members_reg_date ON public.members (registration_date DESC);
CREATE INDEX IF NOT EXISTS idx_members_number ON public.members (membership_number);

-- ------------------------------------------------------------------------------
-- FUNCTION & TRIGGER: Atomic Membership Number Generation (WTL-YYYY-XXXXX)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_next_membership_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
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

CREATE OR REPLACE FUNCTION public.trg_assign_membership_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.membership_number IS NULL OR NEW.membership_number = '' THEN
        NEW.membership_number := public.generate_next_membership_number();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_assign_membership_number ON public.members;
CREATE TRIGGER trigger_assign_membership_number
BEFORE INSERT ON public.members
FOR EACH ROW
EXECUTE FUNCTION public.trg_assign_membership_number();

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_counters ENABLE ROW LEVEL SECURITY;

-- 1. Public (anon) can insert new membership registration
DROP POLICY IF EXISTS "Public anonymous insert members" ON public.members;
CREATE POLICY "Public anonymous insert members"
ON public.members FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 2. Authenticated Admin has complete full access to all members
DROP POLICY IF EXISTS "Admin full access members" ON public.members;
CREATE POLICY "Admin full access members"
ON public.members FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. REMOVED overly permissive anon SELECT.
-- Anonymous visitors can NO LONGER select * from members table directly.
DROP POLICY IF EXISTS "Public select member by id" ON public.members;

-- 4. Membership counters access via atomic RPC
DROP POLICY IF EXISTS "Public run counter via RPC" ON public.membership_counters;
CREATE POLICY "Public run counter via RPC"
ON public.membership_counters FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

GRANT EXECUTE ON FUNCTION public.generate_next_membership_number() TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- SECURITY DEFINER FUNCTIONS FOR SECURE PUBLIC VERIFICATION (NO TABLE DUMP)
-- ------------------------------------------------------------------------------

-- A. Dual-Factor Verification for ID Card Download (Requires Mobile + [ID or DOB])
CREATE OR REPLACE FUNCTION public.verify_member_for_download(
    p_mobile TEXT,
    p_id_or_dob TEXT
)
RETURNS SETOF public.members
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    clean_phone TEXT := regexp_replace(p_mobile, '[^0-9]', '', 'g');
    clean_param TEXT := trim(p_id_or_dob);
BEGIN
    IF length(clean_phone) < 10 OR length(clean_param) = 0 THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT *
    FROM public.members m
    WHERE regexp_replace(m.mobile_number, '[^0-9]', '', 'g') = clean_phone
      AND (
          lower(m.membership_number) = lower(clean_param)
          OR m.date_of_birth::TEXT = clean_param
      )
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_member_for_download(TEXT, TEXT) TO anon, authenticated;

-- B. Public QR Scan Verification (Returns strictly public non-sensitive verification details)
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
AS $$
BEGIN
    IF length(trim(p_id)) = 0 THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        m.membership_number,
        m.full_name,
        m.district,
        m.village_name,
        m.ward_number,
        m.registration_date,
        true AS is_valid
    FROM public.members m
    WHERE m.id::TEXT = trim(p_id) OR lower(m.membership_number) = lower(trim(p_id))
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_member_public(TEXT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- TABLE 3: website_settings (Admin-editable Homepage & Contact Configuration)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.website_settings (
    key TEXT PRIMARY KEY DEFAULT 'homepage_contact',
    download_id_button_text TEXT NOT NULL DEFAULT 'DOWNLOAD ID CARD',
    contact_section_heading TEXT NOT NULL DEFAULT 'Need Help? Contact Us',
    contact_designation TEXT NOT NULL DEFAULT 'Kinathukadavu Admin',
    whatsapp_number TEXT NOT NULL DEFAULT '9750855623',
    country_code TEXT NOT NULL DEFAULT '+91',
    whatsapp_button_text TEXT NOT NULL DEFAULT 'Contact on WhatsApp',
    whatsapp_message TEXT NOT NULL DEFAULT 'Hello We The Leader, I would like to know more about membership and joining the Kinathukadavu team.',
    show_download_id_button BOOLEAN NOT NULL DEFAULT true,
    show_contact_section BOOLEAN NOT NULL DEFAULT true,
    show_whatsapp_button BOOLEAN NOT NULL DEFAULT true,
    show_social_in_footer BOOLEAN NOT NULL DEFAULT true,
    show_social_in_contact BOOLEAN NOT NULL DEFAULT true,
    social_links JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

-- 1. Public can read website settings
DROP POLICY IF EXISTS "Public read website_settings" ON public.website_settings;
CREATE POLICY "Public read website_settings"
ON public.website_settings FOR SELECT
TO anon, authenticated
USING (true);

-- 2. Only authenticated administrators can modify settings
DROP POLICY IF EXISTS "Admin manage website_settings" ON public.website_settings;
CREATE POLICY "Admin manage website_settings"
ON public.website_settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

INSERT INTO public.website_settings (key)
VALUES ('homepage_contact')
ON CONFLICT (key) DO NOTHING;
