import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ArrowRight, CheckCircle2, Clock, Users, Shield, Sparkles, MapPin } from 'lucide-react';

interface HomePageProps {
  onRegisterClick: () => void;
  onAdminClick: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onRegisterClick, onAdminClick }) => {
  const { t, language } = useLanguage();

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)]">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#20223E] via-[#20223E] to-[#17192e] text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        
        {/* Subtle Decorative Background circles */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-[#91BD32]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#2878B9]/15 blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          
          {/* Official Logo Banner */}
          <div className="inline-block p-3 sm:p-4 bg-white rounded-2xl shadow-xl border-2 border-[#91BD32]/50 mb-6 transition-transform hover:scale-102">
            <img 
              src="/logo.svg" 
              alt="WE the Leader Official Logo" 
              className="h-20 sm:h-28 w-auto max-w-[280px] sm:max-w-[400px] object-contain mx-auto"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('we-the-leader-logo.jpg')) {
                  target.src = '/we-the-leader-logo.jpg';
                }
              }}
            />
          </div>

          {/* Titles & Tagline */}
          <div className="space-y-2 mb-4">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-sans">
              {t('orgName')}
            </h1>
            
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#91BD32] text-[#20223E] font-black text-sm sm:text-lg tracking-widest uppercase shadow-md">
              <Sparkles className="w-4 h-4" />
              <span>{t('tagline')}</span>
            </div>

            <p className="text-xs sm:text-sm font-bold text-slate-300 tracking-widest uppercase flex items-center justify-center gap-1.5 pt-1">
              <MapPin className="w-4 h-4 text-[#E98A32]" />
              {t('location')}
            </p>
          </div>

          {/* Welcome Message */}
          <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/15 shadow-inner mt-6 mb-8">
            <p className="text-base sm:text-xl font-medium text-slate-100 leading-relaxed font-sans">
              "{t('welcomeSubtitle')}"
            </p>
            {language === 'en' && (
              <p className="text-xs sm:text-sm text-slate-300 font-tamil mt-2 pt-2 border-t border-white/10">
                "WE the Leader அமைப்பிற்கு உங்களை வரவேற்கிறோம். உறுப்பினராக பதிவு செய்து எங்களுடன் இணையுங்கள்."
              </p>
            )}
            {language === 'ta' && (
              <p className="text-xs sm:text-sm text-slate-300 font-sans mt-2 pt-2 border-t border-white/10">
                "Welcome to WE the Leader. Join our community by registering as a member."
              </p>
            )}
          </div>

          {/* Main Action Call to Action */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onRegisterClick}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#91BD32] hover:bg-[#80a82b] text-[#20223E] font-extrabold text-lg sm:text-xl tracking-wide shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 group"
            >
              <span>{t('registerNowBtn')}</span>
              <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Quick Value Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10 max-w-2xl mx-auto text-left">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <Clock className="w-5 h-5 text-[#91BD32] flex-shrink-0" />
              <span className="text-xs font-semibold text-slate-200">{t('fastRegistration')}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <CheckCircle2 className="w-5 h-5 text-[#2878B9] flex-shrink-0" />
              <span className="text-xs font-semibold text-slate-200">{t('instantId')}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <Shield className="w-5 h-5 text-[#E98A32] flex-shrink-0" />
              <span className="text-xs font-semibold text-slate-200">{t('noPaperwork')}</span>
            </div>
          </div>

        </div>
      </section>

      {/* Organization Info Card Section */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-[#20223E] mb-3">
              {t('aboutHeading')}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {t('aboutText')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100 text-center">
            <div className="p-4 rounded-xl bg-[#F5F7FA]">
              <div className="text-2xl font-black text-[#20223E]">100%</div>
              <div className="text-xs font-semibold text-slate-600 mt-1">{t('statGrassroots')}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#F5F7FA]">
              <div className="text-2xl font-black text-[#2878B9]">Kinathukadavu</div>
              <div className="text-xs font-semibold text-slate-600 mt-1">{t('statKinathukadavu')}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#F5F7FA]">
              <div className="text-2xl font-black text-[#91BD32]">Coimbatore</div>
              <div className="text-xs font-semibold text-slate-600 mt-1">{t('statCoimbatore')}</div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={onRegisterClick}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#91BD32] hover:bg-[#80a82b] text-[#20223E] font-bold text-base shadow transition-all"
            >
              <span>{t('registerNowBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
