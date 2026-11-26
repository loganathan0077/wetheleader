import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type SocialPlatformId = 
  | 'facebook' 
  | 'instagram' 
  | 'twitter' 
  | 'youtube' 
  | 'linkedin' 
  | 'whatsapp' 
  | 'telegram' 
  | 'website' 
  | 'other';

export interface SocialLink {
  id: string;
  platform: SocialPlatformId;
  name: string;
  url: string;
  enabled: boolean;
  order: number;
  custom_label?: string;
  is_custom?: boolean;
}

export interface WebsiteSettings {
  download_id_button_text: string;
  contact_section_heading: string;
  contact_designation: string;
  whatsapp_number: string;
  country_code: string;
  whatsapp_button_text: string;
  whatsapp_message: string;
  show_download_id_button: boolean;
  show_contact_section: boolean;
  show_whatsapp_button: boolean;
  show_social_in_footer?: boolean;
  show_social_in_contact?: boolean;
  social_links: SocialLink[];
  updated_at?: string;
}

export const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'facebook',
    platform: 'facebook',
    name: 'Facebook',
    url: 'https://facebook.com/wetheleader',
    enabled: true,
    order: 1,
    custom_label: 'Facebook'
  },
  {
    id: 'instagram',
    platform: 'instagram',
    name: 'Instagram',
    url: 'https://instagram.com/wetheleader',
    enabled: true,
    order: 2,
    custom_label: 'Instagram'
  },
  {
    id: 'twitter',
    platform: 'twitter',
    name: 'X (Twitter)',
    url: 'https://x.com/wetheleader',
    enabled: false,
    order: 3,
    custom_label: 'X (Twitter)'
  },
  {
    id: 'youtube',
    platform: 'youtube',
    name: 'YouTube',
    url: 'https://youtube.com/@wetheleader',
    enabled: false,
    order: 4,
    custom_label: 'YouTube'
  },
  {
    id: 'linkedin',
    platform: 'linkedin',
    name: 'LinkedIn',
    url: 'https://linkedin.com/company/wetheleader',
    enabled: false,
    order: 5,
    custom_label: 'LinkedIn'
  },
  {
    id: 'whatsapp',
    platform: 'whatsapp',
    name: 'WhatsApp Channel',
    url: 'https://wa.me/919750855623',
    enabled: true,
    order: 6,
    custom_label: 'WhatsApp'
  },
  {
    id: 'telegram',
    platform: 'telegram',
    name: 'Telegram',
    url: 'https://t.me/wetheleader',
    enabled: false,
    order: 7,
    custom_label: 'Telegram'
  },
  {
    id: 'website',
    platform: 'website',
    name: 'Official Website',
    url: 'https://www.wetheleader.online',
    enabled: true,
    order: 8,
    custom_label: 'Website'
  }
];

export const DEFAULT_SETTINGS: WebsiteSettings = {
  download_id_button_text: 'DOWNLOAD ID CARD',
  contact_section_heading: 'Need Help? Contact Us',
  contact_designation: 'Kinathukadavu Admin',
  whatsapp_number: '9750855623',
  country_code: '+91',
  whatsapp_button_text: 'Contact on WhatsApp',
  whatsapp_message: 'Hello We The Leader, I would like to know more about membership and joining the Kinathukadavu team.',
  show_download_id_button: true,
  show_contact_section: true,
  show_whatsapp_button: true,
  show_social_in_footer: true,
  show_social_in_contact: true,
  social_links: DEFAULT_SOCIAL_LINKS,
};

const STORAGE_KEY = 'wtl_website_settings';
export const SETTINGS_UPDATED_EVENT = 'wtl_settings_updated';

/**
 * Builds a standardized WhatsApp chat URL with international country code and pre-filled message.
 */
export function buildWhatsAppUrl(countryCode: string, number: string, message: string): string {
  const cleanCode = (countryCode || '+91').replace(/[^0-9]/g, '');
  const cleanNum = (number || '9750855623').replace(/[^0-9]/g, '');
  const encodedMsg = encodeURIComponent((message || '').trim());
  return `https://wa.me/${cleanCode}${cleanNum}?text=${encodedMsg}`;
}

/**
 * Validates a social media profile URL.
 * Accepts valid HTTPS / HTTP URLs, or wa.me URLs.
 */
export function validateSocialUrl(url: string): { isValid: boolean; error?: string } {
  if (!url || !url.trim()) {
    return { isValid: false, error: 'URL cannot be empty.' };
  }
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { isValid: false, error: 'URL must begin with https:// or http://' };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Please enter a valid URL (e.g. https://instagram.com/wetheleader)' };
  }
}

/**
 * Helper to ensure social_links array is properly merged with default platforms.
 */
function normalizeSocialLinks(incoming?: any[]): SocialLink[] {
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return DEFAULT_SOCIAL_LINKS;
  }

  // Preserve existing links and ensure default platforms exist
  const existingMap = new Map<string, SocialLink>();
  incoming.forEach(item => {
    if (item && item.id) {
      existingMap.set(item.id, {
        id: item.id,
        platform: item.platform || 'other',
        name: item.name || 'Social Link',
        url: item.url || '',
        enabled: Boolean(item.enabled),
        order: typeof item.order === 'number' ? item.order : 99,
        custom_label: item.custom_label || item.name || '',
        is_custom: Boolean(item.is_custom)
      });
    }
  });

  // Ensure all standard default platforms exist in map
  DEFAULT_SOCIAL_LINKS.forEach(def => {
    if (!existingMap.has(def.id)) {
      existingMap.set(def.id, def);
    }
  });

  return Array.from(existingMap.values()).sort((a, b) => a.order - b.order);
}

export const settingsService = {
  /**
   * Synchronously returns the currently cached settings or default values.
   */
  getSettings(): WebsiteSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          social_links: normalizeSocialLinks(parsed.social_links)
        };
      }
    } catch (e) {
      console.warn('Error reading local website settings:', e);
    }
    return DEFAULT_SETTINGS;
  },

  /**
   * Loads settings from Supabase if available and updates local cache.
   */
  async loadSettings(): Promise<WebsiteSettings> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('website_settings')
          .select('*')
          .eq('key', 'homepage_contact')
          .maybeSingle();

        if (!error && data) {
          const settings: WebsiteSettings = {
            download_id_button_text: data.download_id_button_text || DEFAULT_SETTINGS.download_id_button_text,
            contact_section_heading: data.contact_section_heading || DEFAULT_SETTINGS.contact_section_heading,
            contact_designation: data.contact_designation || DEFAULT_SETTINGS.contact_designation,
            whatsapp_number: data.whatsapp_number || DEFAULT_SETTINGS.whatsapp_number,
            country_code: data.country_code || DEFAULT_SETTINGS.country_code,
            whatsapp_button_text: data.whatsapp_button_text || DEFAULT_SETTINGS.whatsapp_button_text,
            whatsapp_message: data.whatsapp_message || DEFAULT_SETTINGS.whatsapp_message,
            show_download_id_button: data.show_download_id_button ?? DEFAULT_SETTINGS.show_download_id_button,
            show_contact_section: data.show_contact_section ?? DEFAULT_SETTINGS.show_contact_section,
            show_whatsapp_button: data.show_whatsapp_button ?? DEFAULT_SETTINGS.show_whatsapp_button,
            show_social_in_footer: data.show_social_in_footer ?? DEFAULT_SETTINGS.show_social_in_footer,
            show_social_in_contact: data.show_social_in_contact ?? DEFAULT_SETTINGS.show_social_in_contact,
            social_links: normalizeSocialLinks(data.social_links),
            updated_at: data.updated_at,
          };

          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
          }
          return settings;
        } else if (error) {
          console.warn('Supabase website_settings query warning:', error.message);
        }
      } catch (err) {
        console.warn('Failed to load settings from Supabase:', err);
      }
    }
    return this.getSettings();
  },

  /**
   * Validates and saves settings locally and to Supabase.
   * STRICT: If Supabase operation returns an error, it returns failure with developer-friendly message!
   */
  async saveSettings(newSettings: WebsiteSettings): Promise<{ success: boolean; error?: string; timestamp?: string }> {
    // 1. Validation
    if (!newSettings.download_id_button_text?.trim()) {
      return { success: false, error: 'Download ID Card button text cannot be empty.' };
    }
    if (!newSettings.contact_section_heading?.trim()) {
      return { success: false, error: 'Contact section heading cannot be empty.' };
    }
    if (!newSettings.contact_designation?.trim()) {
      return { success: false, error: 'Contact person designation cannot be empty.' };
    }
    const cleanNum = newSettings.whatsapp_number?.replace(/[^0-9]/g, '');
    if (!cleanNum || cleanNum.length < 7) {
      return { success: false, error: 'Please enter a valid WhatsApp phone number (minimum 7 digits).' };
    }
    if (!newSettings.country_code?.trim().startsWith('+')) {
      return { success: false, error: 'Country code must start with + (e.g., +91).' };
    }

    // Validate enabled social URLs
    const sanitizedSocialLinks = (newSettings.social_links || DEFAULT_SOCIAL_LINKS).map((item, idx) => ({
      ...item,
      order: typeof item.order === 'number' ? item.order : idx + 1,
      url: (item.url || '').trim()
    }));

    for (const link of sanitizedSocialLinks) {
      if (link.enabled && link.url) {
        const val = validateSocialUrl(link.url);
        if (!val.isValid) {
          return { 
            success: false, 
            error: `Invalid URL for ${link.custom_label || link.name}: ${val.error}` 
          };
        }
      }
    }

    const timestamp = new Date().toISOString();
    const payload = {
      download_id_button_text: newSettings.download_id_button_text.trim(),
      contact_section_heading: newSettings.contact_section_heading.trim(),
      contact_designation: newSettings.contact_designation.trim(),
      whatsapp_number: cleanNum,
      country_code: newSettings.country_code.trim(),
      whatsapp_button_text: newSettings.whatsapp_button_text.trim(),
      whatsapp_message: newSettings.whatsapp_message.trim(),
      show_download_id_button: Boolean(newSettings.show_download_id_button),
      show_contact_section: Boolean(newSettings.show_contact_section),
      show_whatsapp_button: Boolean(newSettings.show_whatsapp_button),
      show_social_in_footer: Boolean(newSettings.show_social_in_footer ?? true),
      show_social_in_contact: Boolean(newSettings.show_social_in_contact ?? true),
      social_links: sanitizedSocialLinks,
      key: 'homepage_contact',
      updated_at: timestamp,
    };

    // 2. Persist to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('website_settings')
          .upsert(payload, { onConflict: 'key' });

        if (error) {
          console.error('Supabase settings save failed:', error);
          return {
            success: false,
            error: `Database save failed: ${error.message} (Code: ${error.code || 'UNKNOWN'}). If this is an RLS or column error, run the updated SQL migration in Supabase SQL Editor.`
          };
        }
      } catch (err: any) {
        console.error('Supabase settings network error:', err);
        return {
          success: false,
          error: `Network error connecting to Supabase: ${err.message || 'Check your internet connection.'}`
        };
      }
    }

    // 3. Persist locally & broadcast event immediately across current window and localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        // Dispatch in current window
        window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT, { detail: payload }));
      } catch (storageErr) {
        console.warn('LocalStorage error while saving settings:', storageErr);
      }
    }

    return { success: true, timestamp };
  },

  /**
   * Sets up a real-time subscription to the website_settings table in Supabase.
   * Returns an unsubscribe function.
   */
  subscribeToSettings(onChange: (settings: WebsiteSettings) => void): () => void {
    if (!isSupabaseConfigured || !supabase) {
      return () => {};
    }

    try {
      const channel = supabase
        .channel('realtime_website_settings')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'website_settings' },
          (payload) => {
            if (payload.new) {
              const data = payload.new as any;
              const updated: WebsiteSettings = {
                download_id_button_text: data.download_id_button_text || DEFAULT_SETTINGS.download_id_button_text,
                contact_section_heading: data.contact_section_heading || DEFAULT_SETTINGS.contact_section_heading,
                contact_designation: data.contact_designation || DEFAULT_SETTINGS.contact_designation,
                whatsapp_number: data.whatsapp_number || DEFAULT_SETTINGS.whatsapp_number,
                country_code: data.country_code || DEFAULT_SETTINGS.country_code,
                whatsapp_button_text: data.whatsapp_button_text || DEFAULT_SETTINGS.whatsapp_button_text,
                whatsapp_message: data.whatsapp_message || DEFAULT_SETTINGS.whatsapp_message,
                show_download_id_button: data.show_download_id_button ?? DEFAULT_SETTINGS.show_download_id_button,
                show_contact_section: data.show_contact_section ?? DEFAULT_SETTINGS.show_contact_section,
                show_whatsapp_button: data.show_whatsapp_button ?? DEFAULT_SETTINGS.show_whatsapp_button,
                show_social_in_footer: data.show_social_in_footer ?? DEFAULT_SETTINGS.show_social_in_footer,
                show_social_in_contact: data.show_social_in_contact ?? DEFAULT_SETTINGS.show_social_in_contact,
                social_links: normalizeSocialLinks(data.social_links),
                updated_at: data.updated_at,
              };

              if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT, { detail: updated }));
              }
              onChange(updated);
            }
          }
        )
        .subscribe();

      return () => {
        if (supabase) {
          supabase.removeChannel(channel);
        }
      };
    } catch (err) {
      console.warn('Failed to subscribe to realtime website_settings:', err);
      return () => {};
    }
  }
};
