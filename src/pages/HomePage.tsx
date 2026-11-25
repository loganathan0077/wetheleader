import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Shield, 
  Sparkles, 
  MapPin, 
  Users, 
  Sprout, 
  GraduationCap, 
  HeartHandshake, 
  Building2,
  ChevronRight
} from 'lucide-react';

interface HomePageProps {
  onRegisterClick: () => void;
  onAdminClick: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onRegisterClick }) => {
  const { t, language } = useLanguage();

  const isTamil = language === 'ta';

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] overflow-x-hidden">
      
      {/* =========================================================================
          1. HERO SECTION: TWO-COLUMN ON DESKTOP, STACKED ON MOBILE
          - Left: Logo, Headlines, Supporting line, Location, Description, CTA
          - Right: Authentic Village Community Group Photograph (Crisp & Natural)
         ========================================================================= */}
      <section className="relative bg-white border-b border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* LEFT COLUMN: Clean & Bright Text Area (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-4 sm:space-y-5 text-left order-1">
              
              {/* Logo & Location Badges */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <div className="bg-white p-1.5 sm:p-2 rounded-xl border border-slate-200 shadow-xs inline-block">
                  <img 
                    src="/logo.svg" 
                    alt="WE the Leader" 
                    className="h-8 sm:h-11 w-auto object-contain max-w-[120px] sm:max-w-[160px]"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('we-the-leader-logo.jpg')) {
                        target.src = '/we-the-leader-logo.jpg';
                      }
                    }}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-[#91BD32] text-[#20223E] text-[11px] sm:text-xs font-black tracking-wider uppercase shadow-xs">
                    <Sparkles className="w-3 h-3 flex-shrink-0" />
                    <span>{t('tagline')}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-[#20223E] text-white text-[11px] sm:text-xs font-extrabold tracking-wider uppercase shadow-xs">
                    <MapPin className="w-3 h-3 text-[#E98A32] flex-shrink-0" />
                    <span>KINATHUKADAVU | COIMBATORE</span>
                  </span>
                </div>
              </div>

              {/* Main Headline (Controlled with CSS clamp, wraps naturally, high-contrast Navy) */}
              <div>
                <h1 className="hero-title font-black text-[#20223E] font-tamil tracking-tight text-left">
                  மாற்றத்தின் தொடக்கமாக நாமே இருப்போம்!
                </h1>
                
                {/* Supporting Line */}
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-50 border border-[#E98A32]/40 text-[#E98A32] font-black text-xs sm:text-sm md:text-base font-sans">
                  <span className="w-2 h-2 rounded-full bg-[#E98A32]" />
                  <span>"Be the Beginning of Change"</span>
                </div>
              </div>

              {/* Welcome Description (Responsive clamp typography) */}
              <p className="hero-description text-slate-600 font-medium">
                {isTamil
                  ? 'WE the Leader அமைப்பிற்கு உங்களை அன்புடன் வரவேற்கிறோம். கிணத்துக்கடவு முழுவதும் உள்ள கிராமங்கள் மற்றும் வார்டுகளை இணைக்கும் ஒரு வலிமையான, அரசியல் சார்பற்ற மக்கள் இயக்கம்.'
                  : 'Welcome to WE the Leader. Connecting and empowering residents across every village and ward in Kinathukadavu through grassroots community solidarity and leadership.'}
              </p>

              {/* Primary Call to Action Button */}
              <div className="pt-1">
                <button
                  onClick={onRegisterClick}
                  className="w-full sm:w-auto px-7 sm:px-9 py-3.5 sm:py-4 rounded-xl bg-[#91BD32] hover:bg-[#80a82b] text-[#20223E] font-black text-base sm:text-lg tracking-wide shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 group cursor-pointer"
                >
                  <span>{isTamil ? 'இன்றே இணைந்திடுங்கள்!' : 'REGISTER NOW / இன்றே இணைந்திடுங்கள்!'}</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1 flex-shrink-0" />
                </button>
              </div>

              {/* Quick Trust Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-100 max-w-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Clock className="w-4 h-4 text-[#91BD32] flex-shrink-0" />
                  <span>{t('fastRegistration')}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-[#2878B9] flex-shrink-0" />
                  <span>{t('instantId')}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Shield className="w-4 h-4 text-[#E98A32] flex-shrink-0" />
                  <span>{t('noPaperwork')}</span>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Community Photograph (Crisp, Natural & Full Color - 5 Cols) */}
            <div className="lg:col-span-5 relative mt-4 lg:mt-0 order-2">
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border-2 sm:border-4 border-white bg-slate-100">
                <img 
                  src="/community-group.jpg" 
                  alt="WE the Leader Community Members - Kinathukadavu"
                  className="w-full h-auto object-cover max-h-[360px] sm:max-h-[460px]"
                  loading="eager"
                />

                {/* Bottom Overlay Label */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#20223E]/95 via-[#20223E]/75 to-transparent p-3 sm:p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs font-black tracking-wider text-[#91BD32] uppercase">
                        KINATHUKADAVU COMMUNITY
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-white font-tamil">
                        கிராம மக்கள் ஒற்றுமையே நமது வலிமை
                      </p>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-slate-200 bg-white/20 px-2 py-0.5 rounded-full">
                      <Users className="w-3 h-3 text-[#91BD32]" />
                      <span>Solidarity</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          2. OUR FOCUS AREAS / CORE MISSION (Replaces duplicate poster display)
         ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#91BD32]/15 text-[#20223E] text-xs font-black tracking-wider uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#91BD32]" />
            <span>{isTamil ? 'நமது முக்கிய தூண்கள்' : 'OUR KEY PILLARS'}</span>
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#20223E] tracking-tight">
            {isTamil ? 'கிணத்துக்கடவு முன்னேற்றத்திற்கான செயல்பாடுகள்' : 'Action Areas Driving Progress in Kinathukadavu'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl mx-auto">
            {isTamil 
              ? 'அரசியல் சார்பற்ற தூய மக்கள் ஒருங்கிணைப்பு மூலம் ஒவ்வொரு கிராமத்திலும் நேர்மறையான மாற்றத்தை ஏற்படுத்துவோம்.'
              : 'Empowering local communities through non-partisan unity, practical grassroots initiatives, and direct representation.'}
          </p>
        </div>

        {/* 4 Focus Area Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Agriculture & Water */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-[#91BD32] hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-green-50 text-[#91BD32] flex items-center justify-center mb-4">
                <Sprout className="w-6 h-6 text-[#91BD32]" />
              </div>
              <h3 className="text-base font-bold text-[#20223E] mb-2 font-tamil">
                {isTamil ? 'விவசாயம் & நீர்வளம்' : 'Agriculture & Water Security'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isTamil
                  ? 'விவசாயிகளுக்கு வழிகாட்டுதல், மழைநீர் சேமிப்பு மற்றும் பாசனக் கால்வாய்கள் தூர்வாருதல்.'
                  : 'Farmer support networks, rainwater harvesting, canal maintenance, and local irrigation assistance.'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-[#91BD32]">
              <span>{isTamil ? 'பசுமை கிணத்துக்கடவு' : 'Green Kinathukadavu'}</span>
            </div>
          </div>

          {/* Card 2: Youth Leadership & Skills */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-[#2878B9] hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2878B9] flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6 text-[#2878B9]" />
              </div>
              <h3 className="text-base font-bold text-[#20223E] mb-2 font-tamil">
                {isTamil ? 'இளைஞர் திறன் & கல்வி' : 'Youth Leadership & Education'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isTamil
                  ? 'கிராமப்புற மாணவர்களுக்கு உயர்கல்வி ஆலோசனை மற்றும் வேலைவாய்ப்பு திறன் பயிற்சி முகாம்கள்.'
                  : 'Higher education counseling, vocational skill training workshops, and youth leadership initiatives.'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-[#2878B9]">
              <span>{isTamil ? 'எதிர்கால தலைமுறை' : 'Future Generation'}</span>
            </div>
          </div>

          {/* Card 3: Village Infrastructure & Health */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-[#E98A32] hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#E98A32] flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-[#E98A32]" />
              </div>
              <h3 className="text-base font-bold text-[#20223E] mb-2 font-tamil">
                {isTamil ? 'கிராம கட்டமைப்பு & சுகாதாரம்' : 'Village Infrastructure & Welfare'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isTamil
                  ? 'தெருவிளக்குகள், சாலை மேம்பாடு, தூய்மையான குடிநீர் மற்றும் அடிப்படை சுகாதார விழிப்புணர்வு.'
                  : 'Street lighting, rural road improvements, clean drinking water access, and community healthcare.'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-[#E98A32]">
              <span>{isTamil ? 'தன்னிறைவு கிராமங்கள்' : 'Self-Sufficient Villages'}</span>
            </div>
          </div>

          {/* Card 4: Grassroots Unity */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-[#20223E] hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-[#20223E] flex items-center justify-center mb-4">
                <HeartHandshake className="w-6 h-6 text-[#20223E]" />
              </div>
              <h3 className="text-base font-bold text-[#20223E] mb-2 font-tamil">
                {isTamil ? 'மக்கள் ஒற்றுமை & தலைமை' : 'Community Solidarity'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isTamil
                  ? 'அரசியல் சார்பற்ற மக்கள் ஒருங்கிணைப்பு, சமூக நல்லிணக்கம் மற்றும் கூட்டுப் பொறுப்புணர்வு.'
                  : 'Uniting all villages and wards beyond political affiliations for collective progress.'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-[#20223E]">
              <span>{isTamil ? 'ஒன்றிணைவோம் வெல்வோம்' : 'United We Grow'}</span>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          3. COMMUNITY ACTIVITIES GALLERY
         ========================================================================= */}
      <section className="py-12 sm:py-16 bg-[#F5F7FA] border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E98A32]/15 text-[#20223E] text-xs font-black tracking-wider uppercase mb-2">
              <Users className="w-3.5 h-3.5 text-[#E98A32]" />
              <span>{isTamil ? 'சமூக செயல்பாடுகள்' : 'COMMUNITY ACTIVITIES'}</span>
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#20223E] tracking-tight">
              {isTamil ? 'கிணத்துக்கடவு மக்களின் கூட்டு பயணம்' : 'Together We Build Kinathukadavu'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl mx-auto">
              {isTamil
                ? 'ஒவ்வொரு கிராமத்திலும் நேர்மறையான மாற்றத்தை ஏற்படுத்தும் நமது சமூக மக்கள் ஒன்றிணைந்து செல்கின்றனர்.'
                : 'Our community members across every village unite with smiles, solidarity and shared purpose.'}
            </p>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

            {/* Primary large photo (new upload) */}
            <div className="md:col-span-7 relative rounded-2xl overflow-hidden shadow-lg border-2 border-white group">
              <img
                src="/community-activities.jpg"
                alt="WE the Leader – Community Members Kinathukadavu"
                className="w-full h-72 sm:h-80 md:h-96 object-cover object-center transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#20223E]/90 via-[#20223E]/30 to-transparent flex flex-col justify-end p-5 sm:p-6">
                <span className="text-[10px] font-black tracking-widest text-[#91BD32] uppercase">
                  {isTamil ? 'கிணத்துக்கடவு சமூகம்' : 'KINATHUKADAVU COMMUNITY'}
                </span>
                <p className="text-sm sm:text-base font-bold text-white mt-0.5 font-tamil">
                  {isTamil ? 'கிராம மக்கள் ஒற்றுமையே நமது வலிமை!' : 'Village Unity is Our Strength!'}
                </p>
              </div>
            </div>

            {/* Right column: original group photo + stat cards */}
            <div className="md:col-span-5 flex flex-col gap-5">

              {/* Original community group photo (existing asset) */}
              <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-white group flex-1">
                <img
                  src="/community-group.jpg"
                  alt="WE the Leader – Village Leaders Kinathukadavu"
                  className="w-full h-48 sm:h-56 object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#20223E]/85 via-transparent to-transparent flex flex-col justify-end p-4">
                  <span className="text-[10px] font-black tracking-widest text-[#E98A32] uppercase">
                    {isTamil ? 'ஒன்றிணைந்த தலைவர்கள்' : 'UNITED LEADERS'}
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-white mt-0.5 font-tamil">
                    {isTamil ? 'மாற்றத்தை ஒன்றாக உருவாக்குவோம்' : 'Creating change together'}
                  </p>
                </div>
              </div>

              {/* Community stat badges */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 text-center">
                  <p className="text-2xl font-black text-[#20223E]">100+</p>
                  <p className="text-[11px] font-bold text-slate-500 mt-0.5 font-tamil">
                    {isTamil ? 'கிராமங்கள் & வார்டுகள்' : 'Villages & Wards'}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 text-center">
                  <p className="text-2xl font-black text-[#91BD32]">∞</p>
                  <p className="text-[11px] font-bold text-slate-500 mt-0.5 font-tamil">
                    {isTamil ? 'இலவச உறுப்பினர் பதிவு' : 'Free Membership'}
                  </p>
                </div>
                <div className="bg-[#20223E] rounded-xl p-4 shadow-sm text-center">
                  <p className="text-2xl font-black text-[#91BD32]">0</p>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5 font-tamil">
                    {isTamil ? 'அரசியல் சார்பு' : 'Political Bias'}
                  </p>
                </div>
                <div className="bg-[#E98A32] rounded-xl p-4 shadow-sm text-center">
                  <p className="text-2xl font-black text-white">2026</p>
                  <p className="text-[11px] font-bold text-white/80 mt-0.5 font-tamil">
                    {isTamil ? 'மாற்றத்தின் ஆண்டு' : 'Year of Change'}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Join CTA below gallery */}
          <div className="mt-8 text-center">
            <button
              onClick={onRegisterClick}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#20223E] hover:bg-[#2f325a] text-white font-black text-sm sm:text-base shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Users className="w-4 h-4 text-[#91BD32]" />
              <span>{isTamil ? 'இந்த இயக்கத்தில் இணைந்திடுங்கள்!' : 'Join This Community Movement!'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* =========================================================================
          4. HOW IT WORKS: 1-MINUTE REGISTRATION STEPS
         ========================================================================= */}
      <section className="py-10 sm:py-14 bg-white border-y border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#20223E]">
              {isTamil ? 'எளிய 3 படிகளில் உறுப்பினர் பதிவு' : 'Simple 3-Step Membership Registration'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isTamil ? 'எந்தவொரு கட்டணமும் இன்றி 1 நிமிடத்தில் முடித்திடுங்கள்' : 'Completely free and completed in under 1 minute'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-5 rounded-2xl bg-[#F5F7FA] border border-slate-200 text-left">
              <div className="w-9 h-9 rounded-xl bg-[#20223E] text-white font-black text-sm flex items-center justify-center mb-3">
                1
              </div>
              <h3 className="text-sm font-bold text-[#20223E] mb-1">
                {isTamil ? 'விவரங்களை உள்ளிடவும்' : 'Enter Basic Details'}
              </h3>
              <p className="text-xs text-slate-600">
                {isTamil ? 'பெயர் மற்றும் கைபேசி எண் மட்டுமே கட்டாயம். பிற விவரங்கள் விருப்பத்தேர்வு.' : 'Only Name and Mobile Number are required. No login or OTP needed.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F5F7FA] border border-slate-200 text-left">
              <div className="w-9 h-9 rounded-xl bg-[#91BD32] text-[#20223E] font-black text-sm flex items-center justify-center mb-3">
                2
              </div>
              <h3 className="text-sm font-bold text-[#20223E] mb-1">
                {isTamil ? 'உடனடி உறுப்பினர் எண்' : 'Instant Membership Number'}
              </h3>
              <p className="text-xs text-slate-600">
                {isTamil ? 'பதிவு செய்தவுடன் தானாகவே WTL-2026-XXXXX தனித்துவ எண் வழங்கப்படும்.' : 'Unique yearly membership sequence number is generated automatically.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F5F7FA] border border-slate-200 text-left">
              <div className="w-9 h-9 rounded-xl bg-[#2878B9] text-white font-black text-sm flex items-center justify-center mb-3">
                3
              </div>
              <h3 className="text-sm font-bold text-[#20223E] mb-1">
                {isTamil ? 'அட்டையை பதிவிறக்கவும்' : 'Download Digital ID Card'}
              </h3>
              <p className="text-xs text-slate-600">
                {isTamil ? 'உங்கள் அதிகாரப்பூர்வ உறுப்பினர் அட்டையை PDF-ஆக பதிவிறக்கலாம் அல்லது அச்சிடலாம்.' : 'Download or print your official membership confirmation card directly.'}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          4. FINAL CALL TO ACTION BANNER (Full-width mobile friendly)
         ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="bg-[#20223E] text-white rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xl border-4 border-[#91BD32] text-center relative overflow-hidden">
          
          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <span className="inline-block px-3.5 py-1 rounded-full bg-[#91BD32] text-[#20223E] font-black text-xs uppercase tracking-widest">
              WE THE LEADER &bull; KINATHUKADAVU
            </span>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-tamil tracking-tight leading-snug">
              மாற்றத்தின் தொடக்கமாக நாமே இருப்போம்!
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl mx-auto leading-relaxed">
              {isTamil
                ? 'கிணத்துக்கடவு சட்டமன்ற தொகுதிக்குட்பட்ட அனைத்து கிராம மக்கள் மற்றும் வார்டு குடியிருப்பாளர்களை அன்போடு அழைக்கிறோம்.'
                : 'Inviting all residents across every village and ward in Kinathukadavu to join hands and build a progressive future.'}
            </p>

            <div className="pt-2">
              <button
                onClick={onRegisterClick}
                className="w-full sm:w-auto px-8 sm:px-10 py-4 rounded-xl bg-[#91BD32] hover:bg-[#80a82b] text-[#20223E] font-black text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>{isTamil ? 'இன்றே இணைந்திடுங்கள்!' : 'JOIN TODAY / REGISTER NOW'}</span>
                <ChevronRight className="w-5 h-5 flex-shrink-0" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 pt-1">
              100% Free &bull; Paperless &bull; No Login Required
            </p>
          </div>

        </div>
      </section>

    </div>
  );
};
