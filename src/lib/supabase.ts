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
 * Retrieves a signed URL for a protected member photo in the private 'member-photos' bucket.
 * Cleans leading/bucket prefixes, supports 24-hour expiration (86400s), and preserves external/data URLs.
 */
export async function getMemberPhotoSignedUrl(
  path: string
): Promise<string | null> {
  if (!supabase || !path) return null;
  const trimmed = path.trim();
  if (!trimmed) return null;

  // If it's already a full data URL, blob URL, or external link
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // If it is already a signed URL with active token
  if (trimmed.includes('token=')) {
    return trimmed;
  }

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

  // 1. Try creating a signed URL from private bucket
  try {
    const { data, error } = await supabase.storage
      .from('member-photos')
      .createSignedUrl(cleanPath, 86400); // 24 hours validity for viewing, printing & PDF export

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
    if (error) {
      console.warn('Supabase createSignedUrl notice:', error.message);
    }
  } catch (err: any) {
    console.warn('Storage getMemberPhotoSignedUrl exception:', err?.message || err);
  }

  // 2. Fallback: try public URL in case bucket is public or public read policy is active
  try {
    const { data: pubData } = supabase.storage
      .from('member-photos')
      .getPublicUrl(cleanPath);

    if (pubData?.publicUrl) {
      return pubData.publicUrl;
    }
  } catch (pubErr) {
    console.warn('Storage getPublicUrl fallback exception:', pubErr);
  }

  return null;
}
