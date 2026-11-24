import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#20223E] text-white border-t border-slate-700/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Logo & Tagline */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left">
            <div className="bg-white p-1 rounded-md">
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

          {/* Mission Note */}
          <div className="text-center text-xs text-slate-300">
            <p className="leading-relaxed">
              Kinathukadavu grassroots community membership portal.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Coimbatore District, Tamil Nadu, India.
            </p>
          </div>

          {/* Links & Admin Access */}
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-end gap-3 text-xs">
            <button
              onClick={() => onNavigate('register')}
              className="text-[#91BD32] font-semibold hover:underline"
            >
              {t('navRegister')}
            </button>
            <span className="hidden sm:inline text-slate-500">•</span>
            <button
              onClick={() => onNavigate('admin-login')}
              className="text-slate-300 hover:text-white flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#E98A32]" />
              {t('adminPortalLink')}
            </button>
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
