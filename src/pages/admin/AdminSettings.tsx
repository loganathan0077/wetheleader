import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { 
  settingsService, 
  WebsiteSettings, 
  DEFAULT_SETTINGS, 
  DEFAULT_SOCIAL_LINKS,
  SocialLink,
  SocialPlatformId,
  buildWhatsAppUrl,
  validateSocialUrl
} from '../../services/settingsService';
import { SocialIcons, PlatformIcon } from '../../components/SocialIcons';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Terminal, 
  Phone,
  MessageCircle,
  CreditCard,
  User,
  Save,
  Eye,
  RefreshCw,
  Sliders,
  Share2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Clock,
  AlertTriangle
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { t, language } = useLanguage();

  // Sub-tabs in Settings
  const [activeSection, setActiveSection] = useState<'contact-settings' | 'social-settings' | 'database'>('contact-settings');

  // Authoritative & Working Settings State
  const [initialSettings, setInitialSettings] = useState<WebsiteSettings>(() => settingsService.getSettings());
  const [settings, setSettings] = useState<WebsiteSettings>(() => settingsService.getSettings());

  // Save UI State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // New Custom Social Link Form State
  const [showAddSocialForm, setShowAddSocialForm] = useState(false);
  const [newSocialPlatform, setNewSocialPlatform] = useState<SocialPlatformId>('other');
  const [newSocialName, setNewSocialName] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [newSocialError, setNewSocialError] = useState<string | null>(null);

  // Copy Schema State
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Check for unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(initialSettings) !== JSON.stringify(settings);
  }, [initialSettings, settings]);

  // Warn on tab closing if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Load latest settings on mount
  useEffect(() => {
    settingsService.loadSettings().then(loaded => {
      setSettings(loaded);
      setInitialSettings(loaded);
      if (loaded.updated_at) {
        setLastSavedTime(new Date(loaded.updated_at).toLocaleString());
      }
    });
  }, []);

  // Handle Save across all sections
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      const result = await settingsService.saveSettings(settings);
      if (result.success) {
        setSaveSuccess(true);
        setInitialSettings(settings);
        const timeStr = result.timestamp 
          ? new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSavedTime(`${new Date().toLocaleDateString()} at ${timeStr}`);
        setTimeout(() => setSaveSuccess(false), 5000);
      } else {
        setErrorMessage(result.error || 'Failed to save settings.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // Social link manipulation helpers
  const handleToggleSocial = (id: string) => {
    setSettings(prev => ({
      ...prev,
      social_links: (prev.social_links || []).map(link => 
        link.id === id ? { ...link, enabled: !link.enabled } : link
      )
    }));
  };

  const handleUpdateSocialUrl = (id: string, url: string) => {
    setSettings(prev => ({
      ...prev,
      social_links: (prev.social_links || []).map(link => 
        link.id === id ? { ...link, url } : link
      )
    }));
  };

  const handleUpdateSocialLabel = (id: string, custom_label: string) => {
    setSettings(prev => ({
      ...prev,
      social_links: (prev.social_links || []).map(link => 
        link.id === id ? { ...link, custom_label } : link
      )
    }));
  };

  const handleMoveSocial = (index: number, direction: 'up' | 'down') => {
    const list = [...(settings.social_links || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Reassign order numbers
    const reordered = list.map((item, idx) => ({ ...item, order: idx + 1 }));
    setSettings(prev => ({ ...prev, social_links: reordered }));
  };

  const handleDeleteSocial = (id: string) => {
    if (window.confirm('Are you sure you want to remove this social link?')) {
      setSettings(prev => ({
        ...prev,
        social_links: (prev.social_links || []).filter(link => link.id !== id)
      }));
    }
  };

  const handleAddSocialLink = (e: React.FormEvent) => {
    e.preventDefault();
    setNewSocialError(null);

    const trimmedUrl = newSocialUrl.trim();
    const val = validateSocialUrl(trimmedUrl);
    if (!val.isValid) {
      setNewSocialError(val.error || 'Please enter a valid URL.');
      return;
    }

    const currentLinks = settings.social_links || [];
    const maxOrder = currentLinks.reduce((max, item) => Math.max(max, item.order || 0), 0);
    const newId = `custom-${Date.now()}`;

    const newLink: SocialLink = {
      id: newId,
      platform: newSocialPlatform,
      name: newSocialName.trim() || newSocialPlatform.toUpperCase(),
      custom_label: newSocialName.trim() || newSocialPlatform.toUpperCase(),
      url: trimmedUrl,
      enabled: true,
      order: maxOrder + 1,
      is_custom: true
    };

    setSettings(prev => ({
      ...prev,
      social_links: [...(prev.social_links || []), newLink]
    }));

    // Reset form
    setNewSocialName('');
    setNewSocialUrl('');
    setNewSocialPlatform('other');
    setShowAddSocialForm(false);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all website settings to factory defaults?')) {
      setSettings(DEFAULT_SETTINGS);
    }
  };

  const sqlSchemaScript = `-- ==============================================================================
-- WE THE LEADER - WEBSITE SETTINGS & SOCIAL MEDIA MIGRATION
-- Run this in your Supabase SQL Editor:
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

-- Ensure columns exist if table was already created
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS show_social_in_footer BOOLEAN DEFAULT true;
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS show_social_in_contact BOOLEAN DEFAULT true;
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]'::jsonb;

-- Enable RLS
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

-- 1. Public visitors can read settings
DROP POLICY IF EXISTS "Public read website_settings" ON public.website_settings;
CREATE POLICY "Public read website_settings"
ON public.website_settings FOR SELECT
TO anon, authenticated
USING (true);

-- 2. Authenticated administrators can manage settings (Secure RLS)
DROP POLICY IF EXISTS "Admin manage website_settings" ON public.website_settings;
CREATE POLICY "Admin manage website_settings"
ON public.website_settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Seed initial row
INSERT INTO public.website_settings (key)
VALUES ('homepage_contact')
ON CONFLICT (key) DO NOTHING;
`;

  const handleCopySchema = () => {
    navigator.clipboard.writeText(sqlSchemaScript);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 3000);
  };

  const previewWhatsAppUrl = buildWhatsAppUrl(
    settings.country_code,
    settings.whatsapp_number,
    settings.whatsapp_message
  );

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#20223E]">{t('settingsTitle')}</h1>
            {hasUnsavedChanges && (
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Unsaved changes
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage public website contact options, social media icons, and database synchronization.
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="bg-[#F5F7FA] p-1 rounded-xl flex items-center border border-slate-200">
          <button
            onClick={() => setActiveSection('contact-settings')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'contact-settings'
                ? 'bg-white text-[#20223E] shadow-sm'
                : 'text-slate-600 hover:text-[#20223E]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-[#91BD32]" />
            <span>Contact & Hero</span>
          </button>

          <button
            onClick={() => setActiveSection('social-settings')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'social-settings'
                ? 'bg-white text-[#20223E] shadow-sm'
                : 'text-slate-600 hover:text-[#20223E]'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-[#2878B9]" />
            <span>Social Media</span>
          </button>
          
          <button
            onClick={() => setActiveSection('database')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'database'
                ? 'bg-white text-[#20223E] shadow-sm'
                : 'text-slate-600 hover:text-[#20223E]'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[#E98A32]" />
            <span>Database</span>
          </button>
        </div>
      </div>

      {/* Global Status & Feedback Banners */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold">Settings saved successfully!</p>
              <p className="text-xs text-emerald-700">The public website and Supabase database have been synchronized.</p>
            </div>
          </div>
          {lastSavedTime && (
            <span className="text-xs font-mono text-emerald-700 bg-white/60 px-2 py-1 rounded-md border border-emerald-200">
              {lastSavedTime}
            </span>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold">Database Save Error</p>
            <p className="text-xs text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: WEBSITE SETTINGS -> HOMEPAGE & CONTACT SETTINGS
         ========================================================================= */}
      {activeSection === 'contact-settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Configuration Form (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-[#20223E] flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#91BD32]" />
                <span>Homepage Buttons & Contact Configuration</span>
              </h2>
              {lastSavedTime && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Saved: {lastSavedTime}
                </span>
              )}
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              
              {/* Group 1: Download ID Card Button */}
              <div className="p-4 rounded-xl bg-[#F5F7FA] border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#20223E] flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-[#91BD32]" />
                    <span>Download ID Card Settings</span>
                  </span>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={settings.show_download_id_button}
                      onChange={(e) => setSettings(prev => ({ ...prev, show_download_id_button: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#91BD32]"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Download ID Card Button Text
                  </label>
                  <input 
                    type="text"
                    required
                    value={settings.download_id_button_text}
                    onChange={(e) => setSettings(prev => ({ ...prev, download_id_button_text: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold focus:ring-2 focus:ring-[#91BD32] focus:outline-none"
                    placeholder="e.g. DOWNLOAD ID CARD"
                  />
                </div>
              </div>

              {/* Group 2: Contact Section Heading & Designation */}
              <div className="p-4 rounded-xl bg-[#F5F7FA] border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#20223E] flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#2878B9]" />
                    <span>Contact Person & Section Heading</span>
                  </span>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={settings.show_contact_section}
                      onChange={(e) => setSettings(prev => ({ ...prev, show_contact_section: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2878B9]"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Section Heading
                  </label>
                  <input 
                    type="text"
                    required
                    value={settings.contact_section_heading}
                    onChange={(e) => setSettings(prev => ({ ...prev, contact_section_heading: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold focus:ring-2 focus:ring-[#2878B9] focus:outline-none"
                    placeholder="e.g. Need Help? Contact Us"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kinathukadavu Admin Designation / Coordinator
                  </label>
                  <input 
                    type="text"
                    required
                    value={settings.contact_designation}
                    onChange={(e) => setSettings(prev => ({ ...prev, contact_designation: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold focus:ring-2 focus:ring-[#2878B9] focus:outline-none"
                    placeholder="e.g. Kinathukadavu Admin / Official Coordinator"
                  />
                </div>
              </div>

              {/* Group 3: WhatsApp Contact & Pre-filled Message */}
              <div className="p-4 rounded-xl bg-[#F5F7FA] border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#20223E] flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp Contact Options</span>
                  </span>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={settings.show_whatsapp_button}
                      onChange={(e) => setSettings(prev => ({ ...prev, show_whatsapp_button: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Country Code
                    </label>
                    <input 
                      type="text"
                      required
                      value={settings.country_code}
                      onChange={(e) => setSettings(prev => ({ ...prev, country_code: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="+91"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      WhatsApp Phone Number (Digits only)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input 
                        type="tel"
                        required
                        value={settings.whatsapp_number}
                        onChange={(e) => setSettings(prev => ({ ...prev, whatsapp_number: e.target.value.replace(/\D/g, '') }))}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        placeholder="9750855623"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp Action Button Text
                  </label>
                  <input 
                    type="text"
                    required
                    value={settings.whatsapp_button_text}
                    onChange={(e) => setSettings(prev => ({ ...prev, whatsapp_button_text: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Contact on WhatsApp"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pre-filled WhatsApp Chat Message
                  </label>
                  <textarea 
                    rows={2}
                    value={settings.whatsapp_message}
                    onChange={(e) => setSettings(prev => ({ ...prev, whatsapp_message: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Hello We The Leader, I would like to know more about membership."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset to Factory Defaults</span>
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-extrabold text-[#20223E] bg-[#91BD32] hover:bg-[#80a82b] transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#20223E] border-t-transparent rounded-full animate-spin" />
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save & Synchronize</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* RIGHT: Live Preview (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 sticky top-6">
            <div className="bg-[#20223E] text-white rounded-2xl p-4 shadow-sm border-2 border-[#91BD32]/40 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#91BD32] flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>Live Homepage Preview</span>
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
                Real-Time
              </span>
            </div>

            {/* Preview Box: Download ID Card Button */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                1. Hero Action Buttons Preview
              </span>
              
              <div className="flex flex-col gap-2 pt-1">
                <div className="w-full py-2.5 px-4 rounded-xl bg-[#91BD32] text-[#20223E] font-black text-xs text-center">
                  REGISTER NOW / இன்றே இணைந்திடுங்கள்!
                </div>
                
                {settings.show_download_id_button ? (
                  <div className="w-full py-2.5 px-4 rounded-xl bg-[#20223E] text-white border border-slate-700 font-extrabold text-xs flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#91BD32]" />
                    <span>{settings.download_id_button_text}</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic text-center py-2">
                    (Download ID Card button hidden on homepage)
                  </p>
                )}
              </div>
            </div>

            {/* Preview Box: Contact Kinathukadavu Admin Section */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                2. Contact Section Preview
              </span>

              {settings.show_contact_section ? (
                <div className="p-4 rounded-2xl bg-[#F5F7FA] border border-slate-200 space-y-3 text-center">
                  <p className="text-sm font-extrabold text-[#20223E]">
                    {settings.contact_section_heading}
                  </p>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-left flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2878B9] flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Coordinator</span>
                        <span className="text-xs font-extrabold text-[#20223E]">{settings.contact_designation}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                    <span className="text-slate-500 font-medium">WhatsApp:</span>
                    <span className="font-mono font-black text-[#20223E]">
                      {settings.country_code} {settings.whatsapp_number}
                    </span>
                  </div>

                  {settings.show_whatsapp_button && (
                    <a
                      href={previewWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-transform hover:scale-[1.01]"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{settings.whatsapp_button_text}</span>
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic text-center py-4">
                  (Contact Section hidden on public website)
                </p>
              )}
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          SECTION 2: SOCIAL MEDIA SETTINGS (Dynamic Platform URLs, Toggles & Order)
         ========================================================================= */}
      {activeSection === 'social-settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Social Media Manager (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-[#20223E] flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-[#2878B9]" />
                  <span>Social Media Links & Visibility</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure active social links, profile URLs, display order, and location toggles.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddSocialForm(!showAddSocialForm)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#2878B9] hover:bg-[#1f639c] transition-all flex items-center gap-1 shadow-xs cursor-pointer flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Platform</span>
              </button>
            </div>

            {/* Global Display Placement Switches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                <span className="font-bold text-slate-700">Display in Website Footer</span>
                <input
                  type="checkbox"
                  checked={settings.show_social_in_footer !== false}
                  onChange={(e) => setSettings(prev => ({ ...prev, show_social_in_footer: e.target.checked }))}
                  className="rounded text-[#91BD32] focus:ring-[#91BD32] h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                <span className="font-bold text-slate-700">Display in Contact Section</span>
                <input
                  type="checkbox"
                  checked={settings.show_social_in_contact !== false}
                  onChange={(e) => setSettings(prev => ({ ...prev, show_social_in_contact: e.target.checked }))}
                  className="rounded text-[#2878B9] focus:ring-[#2878B9] h-4 w-4"
                />
              </label>
            </div>

            {/* Add New Platform Inline Form Modal/Card */}
            {showAddSocialForm && (
              <form onSubmit={handleAddSocialLink} className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#20223E] flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-[#2878B9]" />
                    <span>Add New Social Media Profile</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddSocialForm(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Platform Type
                    </label>
                    <select
                      value={newSocialPlatform}
                      onChange={(e) => setNewSocialPlatform(e.target.value as SocialPlatformId)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold focus:ring-2 focus:ring-[#2878B9] focus:outline-none"
                    >
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="twitter">X (Twitter)</option>
                      <option value="youtube">YouTube</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="whatsapp">WhatsApp Channel</option>
                      <option value="telegram">Telegram</option>
                      <option value="website">Official Website</option>
                      <option value="other">Other Platform</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Display Label (Optional)
                    </label>
                    <input
                      type="text"
                      value={newSocialName}
                      onChange={(e) => setNewSocialName(e.target.value)}
                      placeholder="e.g. Kinathukadavu News"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium focus:ring-2 focus:ring-[#2878B9] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Profile / Channel URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={newSocialUrl}
                    onChange={(e) => setNewSocialUrl(e.target.value)}
                    placeholder="https://instagram.com/wetheleader"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono focus:ring-2 focus:ring-[#2878B9] focus:outline-none"
                  />
                  {newSocialError && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{newSocialError}</p>
                  )}
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-extrabold text-white bg-[#2878B9] hover:bg-[#1f639c] transition-colors cursor-pointer"
                  >
                    Confirm & Add Link
                  </button>
                </div>
              </form>
            )}

            {/* List of Configured Social Links */}
            <div className="space-y-3">
              {(settings.social_links || []).map((link, index) => {
                const isUrlValid = !link.url || validateSocialUrl(link.url).isValid;
                return (
                  <div 
                    key={link.id}
                    className={`p-4 rounded-xl border transition-all ${
                      link.enabled 
                        ? 'bg-white border-slate-200 shadow-xs' 
                        : 'bg-slate-50/80 border-slate-200/60 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      {/* Platform Icon & Name */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#20223E] text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                          <PlatformIcon platform={link.platform} className="w-4 h-4 text-[#91BD32]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-[#20223E] flex items-center gap-1.5 truncate">
                            <span>{link.custom_label || link.name}</span>
                            {link.is_custom && (
                              <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                Custom
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                              Order #{link.order || index + 1}
                            </span>
                            <span className="text-[10px] text-slate-300">&bull;</span>
                            <span className={`text-[10px] font-bold ${link.enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {link.enabled ? '● Visible on Website' : '○ Hidden from Website'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controls: Reorder, Delete, Enable Toggle */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Move Up */}
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveSocial(index, 'up')}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-600 cursor-pointer"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          disabled={index === (settings.social_links?.length || 0) - 1}
                          onClick={() => handleMoveSocial(index, 'down')}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-600 cursor-pointer"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete (if custom or delete requested) */}
                        {link.is_custom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSocial(link.id)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                            title="Delete custom link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Explicit Enable / Disable Toggle Controls */}
                        <div className="flex items-center gap-1.5 ml-1">
                          <button
                            type="button"
                            onClick={() => handleToggleSocial(link.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wide border flex items-center gap-1.5 transition-all cursor-pointer ${
                              link.enabled
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                                : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                            }`}
                            title={link.enabled ? 'Click to Disable platform' : 'Click to Enable platform'}
                          >
                            <span 
                              className={`w-2 h-2 rounded-full ${
                                link.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                              }`} 
                            />
                            <span>{link.enabled ? 'Enabled' : 'Disabled'}</span>
                          </button>

                          {/* Accessible Toggle Switch */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={link.enabled}
                            onClick={() => handleToggleSocial(link.id)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              link.enabled ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                            title={link.enabled ? 'Switch to Disable' : 'Switch to Enable'}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                link.enabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Inputs: URL & Custom Label */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                      <div className="sm:col-span-8">
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => handleUpdateSocialUrl(link.id, e.target.value)}
                          placeholder={`https://${link.platform}.com/yourpage`}
                          className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono focus:outline-none focus:ring-1 ${
                            isUrlValid 
                              ? 'border-slate-300 focus:ring-[#91BD32] bg-white' 
                              : 'border-red-400 focus:ring-red-300 bg-red-50/50'
                          }`}
                        />
                        {!isUrlValid && (
                          <p className="mt-0.5 text-[10px] text-red-600 font-medium">
                            Please enter a valid URL beginning with https://
                          </p>
                        )}
                      </div>

                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={link.custom_label || ''}
                          onChange={(e) => handleUpdateSocialLabel(link.id, e.target.value)}
                          placeholder="Label (e.g. Official)"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium focus:ring-1 focus:ring-[#91BD32] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Save Button Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                {hasUnsavedChanges ? (
                  <span className="text-amber-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    You have unsaved changes. Click Save below.
                  </span>
                ) : (
                  <span>All social settings are synchronized.</span>
                )}
              </span>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveSettings()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-extrabold text-[#20223E] bg-[#91BD32] hover:bg-[#80a82b] transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#20223E] border-t-transparent rounded-full animate-spin" />
                    <span>Saving to Supabase...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Social Settings</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* RIGHT: Live Social Icons Preview (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 sticky top-6">
            <div className="bg-[#20223E] text-white rounded-2xl p-4 shadow-sm border-2 border-[#2878B9]/40 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#91BD32] flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>Live Social Icons Preview</span>
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
                Responsive
              </span>
            </div>

            {/* Dark Theme Preview: Website Footer */}
            <div className="bg-[#20223E] text-white rounded-2xl p-5 shadow-sm border border-slate-700 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Footer Preview (Dark Mode)
                </span>
                <span className="text-[10px] text-[#91BD32] font-semibold">
                  {settings.show_social_in_footer !== false ? 'Active' : 'Disabled'}
                </span>
              </div>

              {settings.show_social_in_footer !== false ? (
                <div className="py-2 flex flex-col items-center justify-center gap-2">
                  <SocialIcons 
                    socialLinks={settings.social_links} 
                    variant="dark" 
                    size="md" 
                    className="justify-center"
                  />
                  <span className="text-[10px] text-slate-400">
                    Icons link directly to configured URLs with safe target="_blank".
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic text-center py-3">
                  (Social icons hidden in website footer)
                </p>
              )}
            </div>

            {/* Light Theme Preview: Contact Us Section */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Contact Section Preview (Light Mode)
                </span>
                <span className="text-[10px] text-[#2878B9] font-semibold">
                  {settings.show_social_in_contact !== false ? 'Active' : 'Disabled'}
                </span>
              </div>

              {settings.show_social_in_contact !== false ? (
                <div className="p-3 bg-[#F5F7FA] rounded-xl border border-slate-200 text-center space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Connect with WE the Leader
                  </span>
                  <SocialIcons 
                    socialLinks={settings.social_links} 
                    variant="light" 
                    size="md" 
                    className="justify-center"
                  />
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic text-center py-3">
                  (Social icons hidden in contact section)
                </p>
              )}
            </div>

            {/* Quick Status Info */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <p className="font-bold text-[#20223E] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Instant Synchronization</span>
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                When you click Save, settings persist into Supabase table <code className="font-mono text-[10px] bg-slate-200 px-1 py-0.5 rounded">website_settings</code> and update all connected devices in real time without redeploying.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          SECTION 3: DATABASE & SUPABASE SETUP
         ========================================================================= */}
      {activeSection === 'database' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-extrabold text-[#20223E] flex items-center gap-2">
                <Database className="w-5 h-5 text-[#2878B9]" />
                <span>Supabase PostgreSQL Schema & RLS Setup</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Copy and run this SQL script in your Supabase SQL Editor to enable dynamic website settings and social links.
              </p>
            </div>

            <button
              onClick={handleCopySchema}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
                copiedSchema 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-[#20223E] hover:bg-[#2e3159] text-white'
              }`}
            >
              {copiedSchema ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SQL Script</span>
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-96 border border-slate-800">
              <pre>{sqlSchemaScript}</pre>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
