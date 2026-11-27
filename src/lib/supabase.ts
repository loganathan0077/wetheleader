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
 * Retrieves a signed URL for a protected member photo (valid for 1 hour)
 */
export async function getMemberPhotoSignedUrl(
  path: string
): Promise<string | null> {
  if (!supabase || !path) return null;
  // If it's already a full data URL or external URL, return directly
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  try {
    const { data, error } = await supabase.storage
      .from('member-photos')
      .createSignedUrl(path, 3600);
    if (error || !data) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}
