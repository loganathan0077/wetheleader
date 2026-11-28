-- ==============================================================================
-- WE THE LEADER: FIX STORAGE ACCESS AND MEMBERSHIP CARD PHOTO FOR MOBILE
-- Resolves: Photo retrieval for ID card download & mobile card viewing (WTL-2026-00002)
--           Ensures member-photos bucket is accessible for card rendering & PDF export
--           Masks sensitive identity numbers (Aadhaar, Voter ID) in verification RPC
-- ==============================================================================

-- 1. Ensure 'member-photos' bucket exists and is public for reliable card rendering & downloads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'member-photos', 
    'member-photos', 
    true, 
    5242880, 
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'],
    public = true;

-- Update existing bucket to public so mobile browsers and download page can load images directly
UPDATE storage.buckets
SET public = true
WHERE id = 'member-photos';

-- 2. Allow SELECT on storage.objects for 'member-photos' so anyone can read photos
DROP POLICY IF EXISTS "Admins and coordinators access member photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow member photos selection for signed URLs" ON storage.objects;
DROP POLICY IF EXISTS "Public read member photos" ON storage.objects;

CREATE POLICY "Public read member photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'member-photos');

-- Preserve upload policy during volunteer registration
DROP POLICY IF EXISTS "Public upload member photos during registration" ON storage.objects;
CREATE POLICY "Public upload member photos during registration"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'member-photos');

-- Preserve admin-only delete policy
DROP POLICY IF EXISTS "Admins delete member photos" ON storage.objects;
CREATE POLICY "Admins delete member photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'member-photos' AND public.is_admin());

-- 3. Update verify_member_for_download RPC
-- Validates mobile + (membership ID or DOB), logs audit, and masks sensitive personal identifiers
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
        -- Insert audit log entry
        INSERT INTO public.membership_id_logs (member_id, action, performed_by)
        VALUES (matched_member.id, 'DOWNLOAD_ID', 'VERIFIED_USER');

        -- Mask/clear sensitive national identity numbers to protect volunteer privacy
        matched_member.aadhaar_number := NULL;
        matched_member.voter_id := NULL;
        matched_member.voter_id_number := NULL;

        RETURN NEXT matched_member;
    END IF;

    RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_member_for_download(TEXT, TEXT) TO anon, authenticated;

-- Confirmation status
SELECT 'Storage signed URL policy and member verification RPC updated successfully.' AS status;
