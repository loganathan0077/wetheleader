import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  Globe, 
  UserPlus, 
  Home as HomeIcon, 
  Menu, 
  X, 
  CreditCard, 
  User, 
  Info, 
  MapPin 
} from 'lucide-react';
import { settingsService, WebsiteSettings, buildWhatsAppUrl, SETTINGS_UPDATED_EVENT } from '../services/settingsService';
import { SocialIcons } from './SocialIcons';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isAdminLoggedIn?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { language, toggleLanguage, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settings, setSettings] = useState<WebsiteSettings>(() => settingsService.getSettings());

  // Subscribe to live Admin Settings updates
  useEffect(() => {
    // 1. Initial load
    settingsService.loadSettings().then((s: WebsiteSettings) => setSettings(s)).catch(() => {});

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

    // 4. Window focus refetch
    const handleFocus = () => {
      settingsService.loadSettings().then((s: WebsiteSettings) => setSettings(s)).catch(() => {});
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

  // Keyboard Escape listener and body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  // Smooth scroll to homepage sections
  const scrollToSection = (sectionId: string) => {
    if (currentView === 'home') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      onNavigate('home');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#20223E] text-white shadow-md border-b-2 border-[#91BD32] max-w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Logo & Brand Info */}
            <button 
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 sm:gap-3 text-left focus:outline-none group flex-shrink-0 cursor-pointer"
            >
              <div className="bg-white p-1 sm:p-1.5 rounded-lg shadow-sm border border-slate-200 transition-transform group-hover:scale-105">
                <img 
                  src="/logo.svg" 
                  alt="WE the Leader Logo" 
                  className="h-8 sm:h-10 w-auto object-contain max-w-[110px] sm:max-w-[170px]"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('we-the-leader-logo.jpg')) {
                      target.src = '/we-the-leader-logo.jpg';
                    }
                  }}
                />
              </div>
              <div className="hidden md:block">
                <div className="font-extrabold text-base sm:text-lg tracking-tight text-white leading-tight">
                  {t('orgName')}
                </div>
                <div className="text-xs font-bold text-[#91BD32] tracking-wider uppercase">
                  {t('tagline')}
                </div>
                <div className="text-[10px] text-slate-300 font-medium tracking-wide">
                  {t('location')}
                </div>
              </div>
            </button>

            {/* Navigation, Language Switcher & Hamburger Menu */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Quick Navigation */}
              <nav className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => onNavigate('home')}
                  className={`p-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'home'
                      ? 'bg-[#91BD32] text-[#20223E]'
                      : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                  title={t('navHome')}
                >
                  <HomeIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('navHome')}</span>
                </button>

                <button
                  onClick={() => onNavigate('register')}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-colors flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
                    currentView === 'register'
                      ? 'bg-[#91BD32] text-[#20223E]'
                      : 'bg-[#91BD32] hover:bg-[#80a82b] text-[#20223E] shadow-sm'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="truncate">{t('navRegister')}</span>
                </button>
              </nav>

              {/* Language Switcher Pill */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-xs sm:text-sm font-bold text-white transition-all shadow-sm flex-shrink-0 cursor-pointer"
                title="Switch Language / மொழியை மாற்றவும்"
              >
                <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#91BD32]" />
                <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
              </button>

              {/* Three-Line Hamburger Icon Button (☰) */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all shadow-sm flex items-center justify-center cursor-pointer ml-0.5 sm:ml-1 group"
                aria-label="Toggle Navigation Menu"
                title="Menu / பட்டி"
              >
                <Menu className="w-5 h-5 text-[#91BD32] group-hover:scale-110 transition-transform" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Slide-out Backdrop Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-[#20223E]/60 backdrop-blur-xs z-50 transition-opacity animate-fadeIn"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-80 sm:w-96 bg-white text-slate-800 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 bg-[#20223E] text-white flex items-center justify-between border-b-2 border-[#91BD32]">
          <div className="flex items-center gap-2.5">
            <div className="bg-white p-1 rounded-md shadow-xs">
              <img 
                src="/logo.svg" 
                alt="WE the Leader" 
                className="h-7 w-auto object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('we-the-leader-logo.jpg')) {
                    target.src = '/we-the-leader-logo.jpg';
                  }
                }}
              />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base leading-tight">WE the Leader</div>
              <div className="text-[10px] font-bold text-[#91BD32] uppercase tracking-wider">Kinathukadavu</div>
            </div>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          
          {/* SECTION 1: MEMBERSHIP */}
          <div>
            <div className="text-[11px] font-black tracking-wider text-slate-400 uppercase mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#91BD32]" />
              <span>{language === 'ta' ? 'உறுப்பினர் சேவை' : 'MEMBERSHIP'}</span>
            </div>
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  onNavigate('download-id');
                  setMenuOpen(false);
                }}
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-[#91BD32]/10 border border-slate-200 hover:border-[#91BD32]/50 transition-all flex items-center gap-3 text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-[#91BD32]/20 text-[#20223E] flex items-center justify-center flex-shrink-0 group-hover:bg-[#91BD32] group-hover:text-white transition-colors">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-extrabold text-[#20223E] flex items-center justify-between">
                    <span>{language === 'ta' ? 'அடையாள அட்டை பதிவிறக்கம்' : 'Download ID Card'}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {language === 'ta' ? 'உடனடி' : 'PDF'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {language === 'ta' ? 'உறுப்பினர் அட்டையை சரிபார்த்து பதிவிறக்கவும்' : 'Instant membership verification & ID card'}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* SECTION 2: CONTACT */}
          <div>
            <div className="text-[11px] font-black tracking-wider text-slate-400 uppercase mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2878B9]" />
              <span>{language === 'ta' ? 'தொடர்புக்கு' : 'CONTACT'}</span>
            </div>
            <div className="space-y-2">
              {/* Contact Kinathukadavu Admin */}
              <button
                onClick={() => {
                  scrollToSection('contact');
                  setMenuOpen(false);
                }}
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-[#2878B9]/40 transition-all flex items-center gap-3 text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#2878B9] flex items-center justify-center flex-shrink-0 group-hover:bg-[#2878B9] group-hover:text-white transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-extrabold text-[#20223E]">
                    {language === 'ta' ? 'கிணத்துக்கடவு நிர்வாகி' : 'Contact Kinathukadavu Admin'}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {settings.contact_designation || 'Mr. A. Annamalai (Kinathukadavu Incharge)'}
                  </p>
                </div>
              </button>

              {/* WhatsApp Support */}
              <a
                href={buildWhatsAppUrl(settings.country_code, settings.whatsapp_number, settings.whatsapp_message)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="w-full p-3 rounded-xl bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200/80 hover:border-emerald-300 transition-all flex items-center gap-3 text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-[#25D366] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-extrabold text-[#20223E] flex items-center justify-between">
                    <span>{language === 'ta' ? 'வாட்ஸ்அப் உதவி' : 'WhatsApp Support'}</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      Chat
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-emerald-700 font-semibold truncate mt-0.5">
                    {settings.country_code} {settings.whatsapp_number}
                  </p>
                </div>
              </a>
            </div>
          </div>

          {/* SECTION 3: INFORMATION */}
          <div>
            <div className="text-[11px] font-black tracking-wider text-slate-400 uppercase mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E98A32]" />
              <span>{language === 'ta' ? 'தகவல்கள்' : 'INFORMATION'}</span>
            </div>
            <div className="space-y-1">
              {/* About We The Leader */}
              <button
                onClick={() => {
                  scrollToSection('about');
                  setMenuOpen(false);
                }}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-3 text-left cursor-pointer"
              >
                <Info className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="text-sm font-bold text-slate-700">
                  {language === 'ta' ? 'அமைப்பைப் பற்றி' : 'About We The Leader'}
                </span>
              </button>

              {/* Contact Information */}
              <button
                onClick={() => {
                  scrollToSection('contact');
                  setMenuOpen(false);
                }}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-3 text-left cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="text-sm font-bold text-slate-700">
                  {language === 'ta' ? 'தொடர்பு விபரங்கள்' : 'Contact Information'}
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 space-y-3">
          {settings.social_links && (
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Connect With Us
              </span>
              <SocialIcons 
                socialLinks={settings.social_links} 
                variant="light" 
                size="sm" 
                className="justify-center"
              />
            </div>
          )}
          <button
            onClick={() => {
              onNavigate('register');
              setMenuOpen(false);
            }}
            className="w-full py-3 px-4 rounded-xl bg-[#91BD32] hover:bg-[#80a82b] text-[#20223E] font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{language === 'ta' ? 'இன்றே இணைந்திடுங்கள்' : 'Register Now'}</span>
          </button>
        </div>

      </div>
    </>
  );
};
