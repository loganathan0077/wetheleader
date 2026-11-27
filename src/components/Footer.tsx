import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, ShieldCheck } from 'lucide-react';
import { getAdminPortalUrl } from '../utils/subdomain';
import { settingsService, WebsiteSettings, SETTINGS_UPDATED_EVENT } from '../services/settingsService';
import { SocialIcons } from './SocialIcons';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<WebsiteSettings>(() => settingsService.getSettings());

  useEffect(() => {
    // 1. Initial load
    settingsService.loadSettings().then(s => setSettings(s)).catch(() => {});

    // 2. Custom event listener (within same tab)
    const handleSettingsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<WebsiteSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      } else {
        setSettings(settingsService.getSettings());
      }
    };
    window.addEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdate);

    // 3. Storage event listener (across browser tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'wtl_website_settings' && e.newValue) {
        try {
          setSettings(JSON.parse(e.newValue));
        } catch {
          setSettings(settingsService.getSettings());
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 4. Window focus refetch (when tab gains focus)
    const handleFocus = () => {
      settingsService.loadSettings().then(s => setSettings(s)).catch(() => {});
    };
    window.addEventListener('focus', handleFocus);

    // 5. Supabase Realtime channel subscription
    const unsubscribe = settingsService.subscribeToSettings((updated) => {
      setSettings(updated);
    });

    return () => {
      window.removeEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      unsubscribe();
    };
  }, []);

  return (
    <footer className="bg-[#20223E] text-white border-t border-slate-700/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Logo & Tagline */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left">
            <div className="bg-white p-1 rounded-md shadow-xs flex-shrink-0">
              <img 
                src="/logo.svg" 
                alt="WE the Leader" 
                className="h-9 w-auto object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('we-the-leader-logo.jpg')) {
                    target.src = '/we-the-leader-logo.jpg';
                  }
                }}
              />
            </div>
            <div>
              <p className="font-extrabold text-sm tracking-wide">{t('orgName')}</p>
              <p className="text-xs font-bold text-[#91BD32] tracking-wider">{t('tagline')}</p>
              <p className="text-[11px] text-slate-400 flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-[#E98A32]" />
                {t('location')}
              </p>
            </div>
          </div>

          {/* Social Media Links & Mission Note */}
          <div className="flex flex-col items-center justify-center text-center gap-2.5">
            {settings.show_social_in_footer !== false && settings.social_links && (
              <SocialIcons 
                socialLinks={settings.social_links} 
                variant="dark" 
                size="md" 
                className="justify-center"
              />
            )}
            <p className="text-xs text-slate-300 leading-relaxed max-w-xs">
              Kinathukadavu grassroots community membership portal.
            </p>
          </div>

          {/* Links & Admin Access */}
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-end gap-3 text-xs">
            <button
              onClick={() => onNavigate('about')}
              className="text-slate-300 hover:text-white font-medium transition-colors cursor-pointer"
            >
              About Us
            </button>
            <span className="hidden sm:inline text-slate-500">•</span>
            <button
              onClick={() => onNavigate('register')}
              className="text-[#91BD32] font-semibold hover:underline cursor-pointer"
            >
              {t('navRegister')}
            </button>
            <span className="hidden sm:inline text-slate-500">•</span>
            <a
              href={getAdminPortalUrl()}
              className="text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
              title="WE The Leader Admin Portal"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#E98A32]" />
              <span>{t('adminPortalLink')}</span>
            </a>
          </div>

        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} {t('allRightsReserved')}</span>
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            Official Membership Registration System
          </span>
        </div>
      </div>
    </footer>
  );
};
