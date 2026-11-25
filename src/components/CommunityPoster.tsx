import React, { useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Download, Printer, Share2, Sparkles, MapPin, X, ArrowRight, Heart } from 'lucide-react';
import html2canvas from 'html2canvas';

interface CommunityPosterProps {
  onClose?: () => void;
  onRegisterClick?: () => void;
  isModal?: boolean;
}

export const CommunityPoster: React.FC<CommunityPosterProps> = ({ onClose, onRegisterClick, isModal = false }) => {
  const { t, language } = useLanguage();
  const posterRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!posterRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF'
      });
      const link = document.createElement('a');
      link.download = 'We_The_Leader_Kinathukadavu_Community_Poster.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error generating poster download:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const posterContent = (
    <div 
      ref={posterRef}
      className="relative overflow-hidden rounded-3xl shadow-2xl bg-white border border-slate-200/80 max-w-5xl w-full mx-auto"
      style={{ minHeight: '520px' }}
    >
      {/* Background Village Image: Smiling members positioned on right side */}
      <div 
        className="absolute inset-0 bg-no-repeat bg-cover bg-right sm:bg-[center_right] pointer-events-none"
        style={{ 
          backgroundImage: `url('/community-group.jpg')`,
        }}
      />

      {/* Clean, Bright Gradient Overlay on Left Side to preserve authentic warm natural lighting */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 42%, rgba(255, 255, 255, 0.75) 58%, rgba(255, 255, 255, 0.1) 85%, transparent 100%)'
        }}
      />

      {/* Subtle Top & Bottom Brand Accents (Navy, Green, Orange) */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#20223E] via-[#91BD32] to-[#E98A32] z-10" />

      {/* Poster Content Area - Left aligned for high contrast and readability */}
      <div className="relative z-10 p-6 sm:p-10 md:p-12 lg:p-14 max-w-xl sm:max-w-2xl flex flex-col justify-between min-h-[520px]">
        
        {/* Top: Official Brand Logo & Tagline */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white p-2.5 rounded-2xl shadow-md border border-slate-100 inline-block">
              <img 
                src="/logo.svg" 
                alt="WE the Leader" 
                className="h-10 sm:h-12 w-auto object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('we-the-leader-logo.jpg')) {
                    target.src = '/we-the-leader-logo.jpg';
                  }
                }}
              />
            </div>
            <div>
              <div className="text-xs font-black text-[#E98A32] tracking-widest uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>LEAD THE CHANGE</span>
              </div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-[#2878B9]" />
                <span>COIMBATORE DISTRICT</span>
              </div>
            </div>
          </div>

          {/* Location Badge: KINATHUKADAVU */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#20223E] text-white text-xs font-extrabold tracking-widest uppercase shadow-sm mb-4">
            <span className="w-2 h-2 rounded-full bg-[#91BD32]" />
            <span>KINATHUKADAVU</span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-[#91BD32] font-tamil">கிணத்துக்கடவு</span>
          </div>

          {/* Exact Tamil Headline in Navy Blue typography */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#20223E] leading-[1.15] font-tamil tracking-tight">
            மாற்றத்தின் தொடக்கமாக நாமே இருப்போம்!
          </h1>

          {/* English translation / Meaning subtitle */}
          <p className="text-sm sm:text-base font-bold text-[#2878B9] mt-3 tracking-wide font-sans">
            "Be the beginning of the change!"
          </p>

          <p className="text-xs sm:text-sm text-slate-600 mt-2 font-medium leading-relaxed max-w-lg">
            {language === 'ta'
              ? 'கிராமங்கள் மற்றும் வார்டுகள் தோறும் ஒன்றிணைந்து, சமூக ஒற்றுமை மற்றும் ஆக்கப்பூர்வ கூட்டு நடவடிக்கை மூலம் நம் பகுதியை முன்னேற்றுவோம்.'
              : 'Connecting our community across every village and ward through grassroots solidarity, leadership, and collective community action.'}
          </p>
        </div>

        {/* Bottom CTA & Highlights */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 space-y-4">
          
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[#20223E]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#91BD32]/15 text-[#20223E] border border-[#91BD32]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#91BD32]" />
              {language === 'ta' ? 'அடிப்படை மக்கள் முன்னேற்றம்' : 'Grassroots Empowerment'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#E98A32]/15 text-[#20223E] border border-[#E98A32]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E98A32]" />
              {language === 'ta' ? 'அரசியல் சார்பற்ற மக்கள் இயக்கம்' : 'Non-Partisan Community Initiative'}
            </span>
          </div>

          {onRegisterClick && (
            <div className="pt-1">
              <button
                onClick={onRegisterClick}
                className="inline-flex items-center gap-3 px-7 py-3 rounded-xl bg-[#91BD32] hover:bg-[#80a82b] text-[#20223E] font-black text-sm sm:text-base tracking-wide shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>{t('registerNowBtn')}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div className="relative max-w-5xl w-full my-8">
          
          {/* Controls Bar */}
          <div className="flex items-center justify-between pb-3 text-white">
            <span className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#91BD32]" />
              <span>We The Leader &bull; Official Community Poster</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="px-3.5 py-1.5 rounded-lg bg-[#91BD32] hover:bg-[#80a82b] text-[#20223E] text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isDownloading ? t('loading') : (language === 'ta' ? 'சுவரொட்டியை பதிவிறக்கு' : 'Download Poster')}</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t('btnPrint')}</span>
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white ml-2 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {posterContent}

        </div>
      </div>
    );
  }

  return posterContent;
};
