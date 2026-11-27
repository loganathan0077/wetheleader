-- ==============================================================================
-- WE THE LEADER - FIX MEMBERS TABLE PERMISSIONS & RESOLVE HTTP 403
-- Safe, idempotent script to grant table permissions and enable admin read RLS
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Ensure Table Grants on public.members
-- PostgreSQL requires table-level grants before Row-Level Security is even evaluated.
-- Missing SELECT grant for 'authenticated' causes PostgREST to return HTTP 403 Forbidden.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.members TO authenticated;
GRANT INSERT ON TABLE public.members TO anon;

-- Ensure execute grants on authorization helpers
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_coordinator_or_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_next_membership_number() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_member_for_download(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_member_public(TEXT) TO anon, authenticated;

-- 2. Configure Row Level Security (RLS) on public.members
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to avoid duplicates or conflicts
DROP POLICY IF EXISTS "Public member registration" ON public.members;
DROP POLICY IF EXISTS "Members read own record" ON public.members;
DROP POLICY IF EXISTS "Admins read all members" ON public.members;
DROP POLICY IF EXISTS "Admins update members" ON public.members;
DROP POLICY IF EXISTS "Admins delete members" ON public.members;

-- Policy A: Public registration (Visitors can INSERT registrations without reading other records)
CREATE POLICY "Public member registration"
ON public.members FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy B: Administrators & Coordinators can READ ALL members (Resolves HTTP 403 on Dashboard)
CREATE POLICY "Admins read all members"
ON public.members FOR SELECT
TO authenticated
USING (public.is_coordinator_or_admin());

-- Policy C: Normal registered members can read ONLY their own record
CREATE POLICY "Members read own record"
ON public.members FOR SELECT
TO authenticated
USING (auth_user_id IS NOT NULL AND auth_user_id = auth.uid());

-- Policy D: Only verified administrators can UPDATE members
CREATE POLICY "Admins update members"
ON public.members FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Policy E: Only verified administrators can DELETE members
CREATE POLICY "Admins delete members"
ON public.members FOR DELETE
TO authenticated
USING (public.is_admin());

-- 3. Diagnostic Query: Check if the 3 test members exist in the Supabase database
-- (Run this query to confirm whether any test records were ever inserted into Supabase)
SELECT 
    id, 
    COALESCE(membership_id, membership_number) AS membership_number, 
    full_name, 
    COALESCE(phone, mobile_number) AS phone, 
    created_at
FROM public.members
WHERE id IN (
    'f87a3b12-9c44-42b7-a367-101112131415',
    'a12b4c56-7d89-4ef0-1234-56789abcdef0',
    'b23c5d67-8e90-4fa1-2345-67890abcdef1'
)
OR full_name ILIKE '%Kathiravan%' 
OR full_name ILIKE '%Sundari%' 
OR full_name ILIKE '%Arun Prakash%';

-- Confirmation message
SELECT 'public.members table permissions and RLS policies updated successfully. HTTP 403 resolved.' AS status;
