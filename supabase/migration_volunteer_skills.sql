-- ==============================================================================
-- Migration: Add Volunteer Skills & Community Resource Fields to members table
-- Idempotent script: preserves existing data and columns
-- ==============================================================================

-- 1. Add new columns if they do not exist
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS street_name TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS volunteer_willingness TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS blood_donation_willingness TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS other_skills TEXT;

-- 2. Create performance indexes for volunteer directory filters
CREATE INDEX IF NOT EXISTS idx_members_street ON public.members (street_name);
CREATE INDEX IF NOT EXISTS idx_members_blood_group ON public.members (blood_group);
CREATE INDEX IF NOT EXISTS idx_members_volunteer ON public.members (volunteer_willingness);
CREATE INDEX IF NOT EXISTS idx_members_blood_donation ON public.members (blood_donation_willingness);
CREATE INDEX IF NOT EXISTS idx_members_skills ON public.members USING GIN (skills);
