import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  ArrowLeft, 
  MapPin, 
  Users, 
  Target, 
  HeartHandshake, 
  ChevronRight, 
  Sparkles,
  Quote
} from 'lucide-react';

interface AboutUsPageProps {
  onBackToHome: () => void;
  onRegisterClick: () => void;
}

export const AboutUsPage: React.FC<AboutUsPageProps> = ({ onBackToHome, onRegisterClick }) => {
  const { language } = useLanguage();
  const isTamil = language === 'ta';

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#20223E] py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Back Navigation & Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 transition-colors shadow-xs cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 text-[#91BD32] group-hover:-translate-x-0.5 transition-transform" />
            <span>{isTamil ? 'முகப்புக்குத் திரும்பு' : 'Back to Home'}</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="hover:text-slate-700 cursor-pointer" onClick={onBackToHome}>
              {isTamil ? 'முகப்பு' : 'Home'}
            </span>
            <span>/</span>
            <span className="font-bold text-[#20223E]">
              {isTamil ? 'எங்களைப் பற்றி' : 'About Us'}
            </span>
          </div>
        </div>

        {/* Top Header Badge & Title */}
        <div className="text-center space-y-2.5 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#20223E] text-white text-xs font-black tracking-wider uppercase shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#91BD32]" />
            <span>WE THE LEADER &bull; KINATHUKADAVU</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#20223E] tracking-tight leading-tight">
            {isTamil ? 'எங்களைப் பற்றி' : 'ABOUT US'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center justify-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#E98A32]" />
            <span>Kinathukadavu | Coimbatore</span>
          </p>
        </div>

        {/* Profile Card: Two-Column Responsive Layout */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Prominent Profile Photograph (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-sm sm:max-w-md rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-slate-100 group">
                <img
                  src="/apa-manikandakumar.jpg"
                  alt={isTamil ? 'திரு. APA. மணிகண்டகுமார்' : 'Mr. APA. Manikandakumar'}
                  className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-102"
                  loading="eager"
                />
                
                {/* Brand Corner Accent Ribbon */}
                <div className="absolute top-3 left-3 bg-[#20223E]/90 backdrop-blur-xs text-white px-3 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase border border-white/20">
                  WE THE LEADER
                </div>
              </div>

              {/* Quick Profile Tag below photo */}
              <div className="mt-4 text-center">
                <h3 className="text-lg sm:text-xl font-black text-[#20223E] leading-tight">
                  {isTamil ? 'திரு. APA. மணிகண்டகுமார்' : 'Mr. APA. Manikandakumar'}
                </h3>
                <p className="text-xs font-bold text-[#91BD32] uppercase tracking-wider mt-0.5">
                  We The Leader – Kinathukadavu
                </p>
              </div>
            </div>

            {/* Right Column: Profile Content & Biography (7 Cols) */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              {/* Header Title & Subtitle */}
              <div className="border-b border-slate-100 pb-4">
                <div className="inline-block px-3 py-0.5 rounded-full bg-[#91BD32]/15 text-[#20223E] text-xs font-extrabold mb-2">
                  {isTamil ? 'முக்கிய முகம்' : 'Leadership Profile'}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#20223E] tracking-tight">
                  {isTamil ? 'திரு. APA. மணிகண்டகுமார்' : 'Mr. APA. Manikandakumar'}
                </h2>
                <p className="text-sm sm:text-base font-bold text-[#2878B9] mt-0.5">
                  We The Leader – Kinathukadavu
                </p>
              </div>

              {/* Content Body Paragraphs */}
              {isTamil ? (
                // TAMIL CONTENT
                <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed font-tamil">
                  <p className="font-semibold text-slate-800">
                    We The Leader – Kinathukadavu அமைப்பின் முக்கிய முகமாகத் திகழ்பவர் திரு. APA. மணிகண்டகுமார்.
                  </p>
                  
                  <p>
                    அண்ணாமலை அவர்களின் வழிகாட்டுதலின்படி, கிணத்துக்கடவு மற்றும் அதன் சுற்றுவட்டாரப் பகுதிகளில் இளைஞர்களை ஒன்றிணைத்து, சமூகப் பொறுப்புணர்வு, மக்கள் சேவை மற்றும் தலைமைத்துவச் சிந்தனைகளை வளர்ப்பதை நோக்கமாகக் கொண்டு செயல்பட்டு வருகிறார்.
                  </p>

                  <p>
                    இளைஞர்களின் திறமைகளை வெளிக்கொண்டு வருதல், மக்களின் தேவைகளுக்காகக் குரல் கொடுத்தல், சமூக நலப் பணிகளில் பங்கேற்றல் மற்றும் ஊர் வளர்ச்சியில் இளைஞர்களின் பங்களிப்பை அதிகரித்தல் ஆகியவற்றை முக்கிய நோக்கங்களாகக் கொண்டுள்ளார்.
                  </p>
                </div>
              ) : (
                // ENGLISH CONTENT
                <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed">
                  <p className="font-semibold text-slate-800">
                    Mr. APA. Manikandakumar is a prominent face of We The Leader – Kinathukadavu.
                  </p>

                  <p>
                    Under the guidance of Mr. Annamalai, he works towards bringing young people together across Kinathukadavu and surrounding areas, encouraging social responsibility, public service and leadership.
                  </p>

                  <p>
                    His focus is on encouraging youth participation, bringing attention to people's needs, supporting community welfare initiatives and creating opportunities for young people to contribute to the development of their locality.
                  </p>
                </div>
              )}

              {/* Dedicated Vision Box */}
              <div className="p-5 rounded-2xl bg-[#F5F7FA] border-l-4 border-[#91BD32] border border-slate-200 relative">
                <Quote className="w-8 h-8 text-[#91BD32]/30 absolute top-3 right-3" />
                <div className="flex items-center gap-2 mb-1.5 text-xs font-black uppercase tracking-wider text-[#20223E]">
                  <Target className="w-4 h-4 text-[#91BD32]" />
                  <span>{isTamil ? 'அவரது நோக்கம்:' : 'His Vision:'}</span>
                </div>
                <p className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
                  {isTamil
                    ? 'இளைஞர்கள் ஒன்றிணைந்து, சமூக மாற்றத்திற்கான பொறுப்பை ஏற்று, நமது மண்ணுக்கும் மக்களுக்கும் பயனுள்ள செயல்களை முன்னெடுப்பதே.'
                    : 'To unite young people, inspire responsible leadership and encourage meaningful action for the welfare and development of our people and our community.'}
                </p>
              </div>

              {/* Prominent Motto Ribbon */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#20223E] text-white text-center shadow-md border-2 border-[#91BD32]">
                <p className="text-xs font-extrabold text-[#91BD32] uppercase tracking-widest mb-1">
                  {isTamil ? 'முழக்கம்' : 'OUR CORE MOTTO'}
                </p>
                <h3 className="text-base sm:text-xl font-black text-white tracking-tight">
                  {isTamil
                    ? 'நம் மண், நம் மக்கள், நம் பொறுப்பு!'
                    : 'Our Land, Our People, Our Responsibility!'}
                </h3>
              </div>

            </div>

          </div>
        </div>

        {/* 4 Pillars of Engagement Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#91BD32]/20 text-[#20223E] flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-[#91BD32]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase">
                {isTamil ? 'இளைஞர் ஒற்றுமை' : 'Youth Leadership'}
              </h4>
              <p className="text-sm font-extrabold text-[#20223E] mt-0.5">
                {isTamil ? 'இளைஞர்களை ஒன்றிணைத்தல்' : 'Bringing Youth Together'}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2878B9] flex items-center justify-center flex-shrink-0">
              <HeartHandshake className="w-5 h-5 text-[#2878B9]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase">
                {isTamil ? 'மக்கள் சேவை' : 'Public Service'}
              </h4>
              <p className="text-sm font-extrabold text-[#20223E] mt-0.5">
                {isTamil ? 'சமூகப் பொறுப்புணர்வு' : 'Social Responsibility'}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#E98A32] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-[#E98A32]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase">
                {isTamil ? 'மக்கள் குரல்' : 'Community Voice'}
              </h4>
              <p className="text-sm font-extrabold text-[#20223E] mt-0.5">
                {isTamil ? 'தேவைகளுக்காகக் குரல்' : 'Advocating Local Needs'}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase">
                {isTamil ? 'ஊர் வளர்ச்சி' : 'Local Growth'}
              </h4>
              <p className="text-sm font-extrabold text-[#20223E] mt-0.5">
                {isTamil ? 'மண்ணின் முன்னேற்றம்' : 'Constituency Welfare'}
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action Banner */}
        <div className="bg-[#20223E] text-white rounded-3xl p-6 sm:p-8 text-center border-2 border-[#91BD32] space-y-4">
          <div className="max-w-2xl mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {isTamil ? 'கிணத்துக்கடவு இளைஞர் இயக்கத்தில் இணையுங்கள்!' : 'Join the Kinathukadavu Youth Movement!'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              {isTamil
                ? 'இலவச உறுப்பினர் பதிவு செய்து நமது பகுதிக்கான சமூக நலப் பணிகளில் பங்காற்றிடுங்கள்.'
                : 'Register as a free member and participate in positive community development.'}
            </p>
          </div>

          <div>
            <button
              onClick={onRegisterClick}
              className="px-8 py-3.5 rounded-xl bg-[#91BD32] hover:bg-[#80a82b] text-[#20223E] font-black text-sm sm:text-base inline-flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <span>{isTamil ? 'இன்றே பதிவு செய்யுங்கள்' : 'Register Now'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
