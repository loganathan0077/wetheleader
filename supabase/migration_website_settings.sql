-- ==============================================================================
-- WE THE LEADER - WEBSITE SETTINGS & DYNAMIC SOCIAL MEDIA MIGRATION
-- Admin-editable Homepage Buttons, Contact Configuration, and Social Links
-- ==============================================================================

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

-- Ensure columns exist if table was previously created
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS show_social_in_footer BOOLEAN DEFAULT true;
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS show_social_in_contact BOOLEAN DEFAULT true;
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]'::jsonb;

-- Enable Row Level Security (RLS)
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

-- 1. Public visitors and members can read website settings
DROP POLICY IF EXISTS "Public read website_settings" ON public.website_settings;
CREATE POLICY "Public read website_settings"
ON public.website_settings FOR SELECT
TO anon, authenticated
USING (true);

-- 2. Allow administrative management of settings
-- Grants ALL exclusively to authenticated administrators (requires valid Supabase Auth JWT)
DROP POLICY IF EXISTS "Admin manage website_settings" ON public.website_settings;
CREATE POLICY "Admin manage website_settings"
ON public.website_settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Seed singleton initial configuration
INSERT INTO public.website_settings (
    key,
    download_id_button_text,
    contact_section_heading,
    contact_designation,
    whatsapp_number,
    country_code,
    whatsapp_button_text,
    whatsapp_message,
    show_download_id_button,
    show_contact_section,
    show_whatsapp_button,
    show_social_in_footer,
    show_social_in_contact,
    social_links
)
VALUES (
    'homepage_contact',
    'DOWNLOAD ID CARD',
    'Need Help? Contact Us',
    'Kinathukadavu Admin',
    '9750855623',
    '+91',
    'Contact on WhatsApp',
    'Hello We The Leader, I would like to know more about membership and joining the Kinathukadavu team.',
    true,
    true,
    true,
    true,
    true,
    '[
      {"id":"facebook","platform":"facebook","name":"Facebook","url":"https://facebook.com/wetheleader","enabled":true,"order":1,"custom_label":"Facebook"},
      {"id":"instagram","platform":"instagram","name":"Instagram","url":"https://instagram.com/wetheleader","enabled":true,"order":2,"custom_label":"Instagram"},
      {"id":"twitter","platform":"twitter","name":"X (Twitter)","url":"https://x.com/wetheleader","enabled":false,"order":3,"custom_label":"X (Twitter)"},
      {"id":"youtube","platform":"youtube","name":"YouTube","url":"https://youtube.com/@wetheleader","enabled":false,"order":4,"custom_label":"YouTube"},
      {"id":"linkedin","platform":"linkedin","name":"LinkedIn","url":"https://linkedin.com/company/wetheleader","enabled":false,"order":5,"custom_label":"LinkedIn"},
      {"id":"whatsapp","platform":"whatsapp","name":"WhatsApp Channel","url":"https://wa.me/919750855623","enabled":true,"order":6,"custom_label":"WhatsApp"},
      {"id":"telegram","platform":"telegram","name":"Telegram","url":"https://t.me/wetheleader","enabled":false,"order":7,"custom_label":"Telegram"},
      {"id":"website","platform":"website","name":"Official Website","url":"https://www.wetheleader.online","enabled":true,"order":8,"custom_label":"Website"}
    ]'::jsonb
)
ON CONFLICT (key) DO UPDATE SET
    social_links = COALESCE(public.website_settings.social_links, EXCLUDED.social_links);
