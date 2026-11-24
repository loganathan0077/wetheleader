import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe, ShieldCheck, UserPlus, Home as HomeIcon } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isAdminLoggedIn?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, isAdminLoggedIn }) => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 bg-[#20223E] text-white shadow-md border-b-2 border-[#91BD32]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Info */}
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 text-left focus:outline-none group"
          >
            <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 transition-transform group-hover:scale-105">
              <img 
                src="/logo.svg" 
                alt="WE the Leader Logo" 
                className="h-10 w-auto object-contain max-w-[130px] sm:max-w-[170px]"
                onError={(e) => {
                  // Fallback to jpg logo if svg fails
                  const target = e.currentTarget;
                  if (!target.src.includes('we-the-leader-logo.jpg')) {
                    target.src = '/we-the-leader-logo.jpg';
                  }
                }}
              />
            </div>
            <div className="hidden xs:block">
              <div className="font-extrabold text-base sm:text-lg tracking-tight text-white leading-tight">
                {t('orgName')}
              </div>
              <div className="text-xs font-bold text-[#91BD32] tracking-wider uppercase">
                {t('tagline')}
              </div>
              <div className="text-[10px] text-slate-300 font-medium tracking-wide hidden sm:block">
                {t('location')}
              </div>
            </div>
          </button>

          {/* Navigation & Language Switcher */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Quick Navigation */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => onNavigate('home')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  currentView === 'home'
                    ? 'bg-[#91BD32] text-[#20223E]'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <HomeIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{t('navHome')}</span>
              </button>

              <button
                onClick={() => onNavigate('register')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  currentView === 'register'
                    ? 'bg-[#91BD32] text-[#20223E]'
                    : 'bg-[#91BD32]/90 hover:bg-[#91BD32] text-[#20223E] shadow-sm'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('navRegister')}</span>
              </button>

              <button
                onClick={() => onNavigate(isAdminLoggedIn ? 'admin-dashboard' : 'admin-login')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  currentView.startsWith('admin')
                    ? 'bg-[#2878B9] text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title={t('navAdmin')}
              >
                <ShieldCheck className="w-4 h-4 text-[#E98A32]" />
                <span className="hidden md:inline">{t('navAdmin')}</span>
              </button>
            </nav>

            {/* Language Switcher Pill */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-xs sm:text-sm font-bold text-white transition-all shadow-sm"
              title="Switch Language / மொழியை மாற்றவும்"
            >
              <Globe className="w-3.5 h-3.5 text-[#91BD32]" />
              <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
