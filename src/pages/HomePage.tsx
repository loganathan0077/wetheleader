import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Shield, 
  Sparkles, 
  MapPin, 
  Image as ImageIcon 
} from 'lucide-react';
import { CommunityPoster } from '../components/CommunityPoster';

interface HomePageProps {
  onRegisterClick: () => void;
  onAdminClick: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onRegisterClick, onAdminClick }) => {
  const { t, language } = useLanguage();
  const [showPosterModal, setShowPosterModal] = useState(false);

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)]">
      
      {/* =========================================================================
          HERO POSTER BANNER: Authentic Village Photography Background
          - Smiling community members on the right side
          - Clean, bright text area on the left side
          - Exact Tamil headline: மாற்றத்தின் தொடக்கமாக நாமே இருப்போம்!
          - Location: KINATHUKADAVU
          - Navy blue typography (#20223E) with Green (#91BD32) & Orange (#E98A32) accents
         ========================================================================= */}
      <section className="relative overflow-hidden bg-slate-100 border-b-4 border-[#91BD32] min-h-[580px] sm:min-h-[620px] flex items-center">
        
        {/* Primary Visual Reference: Village Group Photograph */}
        <div 
          className="absolute inset-0 bg-no-repeat bg-cover bg-right md:bg-[center_right] pointer-events-none transform scale-100 transition-transform duration-700"
          style={{ 
            backgroundImage: `url('/community-group.jpg')`,
            backgroundPosition: 'right 20% center',
          }}
        />

        {/* Clean, Bright Gradient Overlay on Left Side to preserve authentic warm natural lighting */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 45%, rgba(255, 255, 255, 0.80) 60%, rgba(255, 255, 255, 0.20) 88%, transparent 100%)'
          }}
        />

        {/* Hero Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative z-10 w-full">
          <div className="max-w-xl md:max-w-2xl text-left">
            
            {/* Official WE the Leader Logo */}
            <div className="inline-block p-2.5 sm:p-3 bg-white rounded-2xl shadow-lg border border-slate-200/90 mb-5 transition-transform hover:scale-102">
              <img 
                src="/logo.svg" 
                alt="WE the Leader Official Logo" 
                className="h-12 sm:h-16 w-auto object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('we-the-leader-logo.jpg')) {
                    target.src = '/we-the-leader-logo.jpg';
                  }
                }}
              />
            </div>

            {/* Official Tagline & Location Pills */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#91BD32] text-[#20223E] font-black text-xs sm:text-sm tracking-wider uppercase shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('tagline')}</span>
              </span>

              {/* Exact Location: KINATHUKADAVU */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#20223E] text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-[#E98A32]" />
                <span>KINATHUKADAVU</span>
              </span>
            </div>

            {/* Exact Tamil Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black text-[#20223E] leading-[1.15] font-tamil tracking-tight mb-3">
              மாற்றத்தின் தொடக்கமாக நாமே இருப்போம்!
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg font-bold text-[#2878B9] tracking-wide mb-3 font-sans">
              "Be the beginning of the change!"
            </p>

            {/* Welcome & Community Message */}
            <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed mb-6 max-w-lg">
              {language === 'ta'
                ? 'WE the Leader அமைப்பிற்கு உங்களை வரவேற்கிறோம். கிணத்துக்கடவு கிராமங்கள் மற்றும் வார்டுகள் தோறும் ஒன்றிணைந்து, உறுப்பினராக பதிவு செய்து சமூக மாற்றத்திற்கு வழிவகுப்போம்.'
                : 'Welcome to WE the Leader. Join our community across every village and ward in Kinathukadavu. Together, we lead positive, united change.'}
            </p>

            {/* Main Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
              <button
                onClick={onRegisterClick}
                className="px-8 py-4 rounded-xl bg-[#91BD32] hover:bg-[#80a82b] text-[#20223E] font-black text-lg tracking-wide shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 group cursor-pointer"
              >
                <span>{t('registerNowBtn')}</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => setShowPosterModal(true)}
                className="px-5 py-4 rounded-xl bg-white hover:bg-slate-50 text-[#20223E] font-bold text-sm border-2 border-slate-300 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-[#E98A32]" />
                <span>{language === 'ta' ? 'அதிகாரப்பூர்வ சுவரொட்டி' : 'Community Poster'}</span>
              </button>
            </div>

            {/* Quick Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-8 max-w-lg text-left">
              <div className="flex items-center gap-2.5 p-2.5 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-xs">
                <Clock className="w-4 h-4 text-[#91BD32] flex-shrink-0" />
                <span className="text-xs font-bold text-[#20223E]">{t('fastRegistration')}</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-[#2878B9] flex-shrink-0" />
                <span className="text-xs font-bold text-[#20223E]">{t('instantId')}</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-xs">
                <Shield className="w-4 h-4 text-[#E98A32] flex-shrink-0" />
                <span className="text-xs font-bold text-[#20223E]">{t('noPaperwork')}</span>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* Embedded Community Poster Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-bold text-[#91BD32] uppercase tracking-widest block mb-1">
            Official Organization Poster
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#20223E]">
            {language === 'ta' ? 'கிணத்துக்கடவு மக்கள் இயக்கம்' : 'Kinathukadavu Grassroots Leadership'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {language === 'ta' 
              ? 'சுவரொட்டியை பதிவிறக்கம் செய்து உங்கள் பகுதியில் பகிர்ந்து கொள்ளுங்கள்' 
              : 'Download and share the official poster with community members across villages and wards.'}
          </p>
        </div>

        {/* Render Poster Component */}
        <CommunityPoster onRegisterClick={onRegisterClick} />
      </section>

      {/* Organization Info Card Section */}
      <section className="pb-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-[#20223E] mb-3">
              {t('aboutHeading')}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {t('aboutText')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100 text-center">
            <div className="p-4 rounded-2xl bg-[#F5F7FA]">
              <div className="text-2xl font-black text-[#20223E]">100%</div>
              <div className="text-xs font-semibold text-slate-600 mt-1">{t('statGrassroots')}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#F5F7FA]">
              <div className="text-2xl font-black text-[#2878B9]">Kinathukadavu</div>
              <div className="text-xs font-semibold text-slate-600 mt-1">{t('statKinathukadavu')}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#F5F7FA]">
              <div className="text-2xl font-black text-[#91BD32]">Coimbatore</div>
              <div className="text-xs font-semibold text-slate-600 mt-1">{t('statCoimbatore')}</div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={onRegisterClick}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#91BD32] hover:bg-[#80a82b] text-[#20223E] font-black text-base shadow transition-all cursor-pointer"
            >
              <span>{t('registerNowBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Poster Modal Preview with Print / Download */}
      {showPosterModal && (
        <CommunityPoster 
          isModal={true}
          onClose={() => setShowPosterModal(false)}
          onRegisterClick={() => {
            setShowPosterModal(false);
            onRegisterClick();
          }}
        />
      )}

    </div>
  );
};
