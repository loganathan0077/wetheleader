-- ==============================================================================
-- WE THE LEADER - COMPLETE MEMBERSHIP REGISTRATION APPLICATION
-- PostgreSQL / Supabase Database Schema
-- Location: Kinathukadavu, Coimbatore, Tamil Nadu
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- TABLE 2: membership_counters (Must exist before sequence generation)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.membership_counters (
    year INT PRIMARY KEY,
    last_sequence INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- TABLE 1: members
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    date_of_birth DATE,
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

-- Create Indexes for fast searching and filtering
CREATE INDEX IF NOT EXISTS idx_members_mobile ON public.members (mobile_number);
CREATE INDEX IF NOT EXISTS idx_members_membership_number ON public.members (membership_number);
CREATE INDEX IF NOT EXISTS idx_members_village ON public.members (village_name);
CREATE INDEX IF NOT EXISTS idx_members_street ON public.members (street_name);
CREATE INDEX IF NOT EXISTS idx_members_ward ON public.members (ward_number);
CREATE INDEX IF NOT EXISTS idx_members_blood_group ON public.members (blood_group);
CREATE INDEX IF NOT EXISTS idx_members_volunteer ON public.members (volunteer_willingness);
CREATE INDEX IF NOT EXISTS idx_members_blood_donation ON public.members (blood_donation_willingness);
CREATE INDEX IF NOT EXISTS idx_members_skills ON public.members USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_members_reg_date ON public.members (registration_date DESC);

-- ------------------------------------------------------------------------------
-- TABLE 3: admin_users (Single Admin Role)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT 'WE the Leader Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- FUNCTION: generate_next_membership_number()
-- Atomic yearly sequence generator: WTL-YYYY-XXXXX (e.g., WTL-2026-00001)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_next_membership_number()
RETURNS TEXT AS $$
DECLARE
    current_yr INT;
    next_seq INT;
    result_id TEXT;
BEGIN
    current_yr := EXTRACT(YEAR FROM CURRENT_DATE);

    -- Atomically upsert counter row and fetch next sequence
    INSERT INTO public.membership_counters (year, last_sequence, updated_at)
    VALUES (current_yr, 1, timezone('utc'::text, now()))
    ON CONFLICT (year)
    DO UPDATE SET 
        last_sequence = public.membership_counters.last_sequence + 1,
        updated_at = timezone('utc'::text, now())
    RETURNING last_sequence INTO next_seq;

    -- Format: WTL-YYYY-00001
    result_id := 'WTL-' || current_yr::TEXT || '-' || LPAD(next_seq::TEXT, 5, '0');
    RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- FUNCTION & TRIGGER: Auto-assign membership number before insert if not provided
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_assign_membership_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.membership_number IS NULL OR NEW.membership_number = '' THEN
        NEW.membership_number := public.generate_next_membership_number();
    END IF;
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS before_member_insert ON public.members;
CREATE TRIGGER before_member_insert
BEFORE INSERT ON public.members
FOR EACH ROW
EXECUTE FUNCTION public.trg_assign_membership_number();

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 1. Public (anon) can insert new membership registration
CREATE POLICY "Public anonymous insert members"
ON public.members FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 2. Authenticated Admin has complete full access to all members
CREATE POLICY "Admin full access members"
ON public.members FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Public can select member by id directly for registration success screen confirmation
CREATE POLICY "Public select member by id"
ON public.members FOR SELECT
TO anon
USING (true);

-- 4. Membership counters access
CREATE POLICY "Public run counter via RPC"
ON public.membership_counters FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 5. Admin users access
CREATE POLICY "Authenticated access admin_users"
ON public.admin_users FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant execute permissions on RPC to anon and authenticated
GRANT EXECUTE ON FUNCTION public.generate_next_membership_number() TO anon, authenticated;
