import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseUrl.startsWith('https://')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Uploads a compressed member profile photo to the private 'member-photos' bucket
 */
export async function uploadMemberPhoto(
  fileOrBlob: Blob,
  filename: string
): Promise<{ path?: string; error?: string }> {
  if (!supabase) return { error: 'Supabase not configured' };
  try {
    const safeName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '')}`;
    const { data, error } = await supabase.storage
      .from('member-photos')
      .upload(safeName, fileOrBlob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      console.warn('Storage upload error:', error.message);
      return { error: error.message };
    }
    return { path: data.path };
  } catch (err: any) {
    console.warn('Storage upload exception:', err);
    return { error: err.message || 'Storage upload failed' };
  }
}

/**
 * Retrieves a reliable display URL for a member's profile photo in Supabase storage.
 * 
 * Supports:
 * 1. Data URLs (data:image/...) and Blob URLs (blob:...)
 * 2. Signed URLs with active token (?token=...)
 * 3. Downloading object as Blob (URL.createObjectURL) - 100% reliable on mobile browsers, bypasses CORS restrictions
 * 4. Generating signed URL via createSignedUrl (for authenticated admins / policy permitted roles)
 * 5. Direct public storage URL via getPublicUrl (when bucket is public)
 */
export async function getMemberPhotoSignedUrl(
  path: string
): Promise<string | null> {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === '""') {
    return null;
  }

  // 1. If it's already an in-memory data URL or blob URL, return immediately
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // 2. If it is already a signed URL with active token
  if (trimmed.includes('token=')) {
    return trimmed;
  }

  // If path is a general external HTTP URL not matching Supabase storage
  if ((trimmed.startsWith('http://') || trimmed.startsWith('https://')) && !trimmed.includes('/member-photos/')) {
    return trimmed;
  }

  if (!supabase) return null;

  // Sanitize path: strip redundant bucket name prefixes, domain URLs, or leading slashes
  let cleanPath = trimmed;
  if (cleanPath.includes('/member-photos/')) {
    cleanPath = cleanPath.split('/member-photos/').pop() || cleanPath;
  }
  cleanPath = cleanPath
    .replace(/^\/?(member-photos\/)+/, '')
    .replace(/^\/+/, '')
    .split('?')[0];

  if (!cleanPath) return null;

  // 3. Try downloading the object as a Blob and creating an object URL.
  // This is the MOST reliable approach on mobile devices and exports:
  // - Validates that the file actually exists in storage
  // - Produces an in-origin blob: URL with ZERO CORS restrictions
  // - Renders cleanly in HTML5 canvas and jsPDF
  try {
    const { data: blobData, error: downloadError } = await supabase.storage
      .from('member-photos')
      .download(cleanPath);

    if (!downloadError && blobData && blobData.size > 0) {
      return URL.createObjectURL(blobData);
    }
  } catch (blobErr) {
    // Continue to next check
  }

  // 4. Try creating a signed URL from bucket (valid for 24 hours)
  try {
    const { data, error } = await supabase.storage
      .from('member-photos')
      .createSignedUrl(cleanPath, 86400);

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  } catch (err: any) {
    // If signed URL generation failed or object is missing, fall through
  }

  // If the file cannot be downloaded or signed, it does not exist in storage.
  // Returning null ensures the membership card immediately renders the clean
  // official "WE THE LEADER MEMBER" logo rather than a broken image box.
  return null;
}
