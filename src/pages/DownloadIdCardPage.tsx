import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Member } from '../types';
import { memberService } from '../services/memberService';
import { CR80MembershipCard } from '../components/CR80MembershipCard';
import { exportCardPdf } from '../utils/idCardExport';
import QRCode from 'qrcode';
import {
  CreditCard,
  ShieldCheck,
  Download,
  Printer,
  ArrowLeft,
  AlertCircle,
  Phone,
  KeyRound,
  CheckCircle2,
  Calendar,
  Lock,
  RefreshCw
} from 'lucide-react';

interface DownloadIdCardPageProps {
  onBackToHome: () => void;
}

export const DownloadIdCardPage: React.FC<DownloadIdCardPageProps> = ({ onBackToHome }) => {
  const { t, language } = useLanguage();
  const isTamil = language === 'ta';

  // Input states
  const [mobileNumber, setMobileNumber] = useState('');
  const [membershipIdOrDob, setMembershipIdOrDob] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Verified member state
  const [verifiedMember, setVerifiedMember] = useState<Member | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [activeCardSide, setActiveCardSide] = useState<'both' | 'front' | 'back'>('both');

  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);

  // Generate QR code when member is verified
  useEffect(() => {
    if (verifiedMember) {
      const verifyUrl = `${window.location.origin}/?verify=${encodeURIComponent(verifiedMember.membership_number)}`;
      QRCode.toDataURL(verifyUrl, {
        width: 300,
        margin: 1,
        color: {
          dark: '#20223E',
          light: '#FFFFFF'
        }
      }).then(url => {
        setQrCodeUrl(url);
      }).catch(err => {
        console.error('QR code generation error:', err);
      });
    }
  }, [verifiedMember]);

  // Handle Form Submission
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const result = await memberService.verifyAndGetMemberForDownload(
        mobileNumber,
        membershipIdOrDob
      );

      if (result.success && result.member) {
        setVerifiedMember(result.member);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorMsg(result.error || (isTamil ? 'உறுப்பினர் விவரங்கள் பொருந்தவில்லை.' : 'Verification failed. Details do not match.'));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during verification.');
    } finally {
      setIsLoading(false);
    }
  };

  // PDF Export
  const handleDownloadPdf = async () => {
    if (!verifiedMember || !frontCardRef.current || !backCardRef.current) return;
    setIsExportingPdf(true);
    try {
      await exportCardPdf(
        frontCardRef.current,
        backCardRef.current,
        verifiedMember,
        activeCardSide
      );
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Print ID Card
  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setVerifiedMember(null);
    setMobileNumber('');
    setMembershipIdOrDob('');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F5F7FA] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Top Back Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#20223E] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isTamil ? 'முகப்பு பக்கத்திற்கு திரும்பு' : 'Back to Homepage'}</span>
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#91BD32]/15 text-[#20223E] text-xs font-black tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4 text-[#91BD32]" />
            <span>CR80 Physical & Digital ID</span>
          </span>
        </div>

        {/* =========================================================================
            STATE 1: AUTHENTICATION / VERIFICATION FORM
           ========================================================================= */}
        {!verifiedMember ? (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
              
              {/* Header Banner */}
              <div className="bg-[#20223E] text-white p-6 sm:p-8 text-center border-b-4 border-[#91BD32]">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <CreditCard className="w-7 h-7 text-[#91BD32]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {isTamil ? 'உறுப்பினர் அட்டையை பதிவிறக்கவும்' : 'Download Membership ID Card'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
                  {isTamil
                    ? 'உங்கள் பதிவு செய்யப்பட்ட தொலைபேசி எண் மற்றும் உறுப்பினர் எண்ணை உள்ளிடவும்.'
                    : 'Verify your membership credentials to access and download your official CR80 ID Card.'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleVerify} className="p-6 sm:p-8 space-y-5">
                
                {errorMsg && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs font-semibold animate-fadeIn">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isTamil ? 'பதிவு செய்யப்பட்ட அலைபேசி எண்' : 'Registered Mobile Number'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 9842100001"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-[#91BD32] focus:ring-2 focus:ring-[#91BD32]/20 font-mono tracking-wide"
                    />
                  </div>
                </div>

                {/* Membership ID or Date of Birth */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {isTamil ? 'உறுப்பினர் எண் அல்லது பிறந்த தேதி' : 'Membership ID or Date of Birth'}
                    </label>
                    <span className="text-[10px] text-slate-400">e.g. WTL-2026-00001</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={membershipIdOrDob}
                      onChange={(e) => setMembershipIdOrDob(e.target.value)}
                      placeholder="WTL-2026-00001 or YYYY-MM-DD"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-[#91BD32] focus:ring-2 focus:ring-[#91BD32]/20 font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isTamil
                      ? 'பாதுகாப்பிற்காக இரண்டு காரணிகள் தேவை: அலைபேசி எண் + உறுப்பினர் எண்.'
                      : 'Dual-factor verification ensures only you can access and print your ID card.'}
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#91BD32] hover:bg-[#80a82b] text-[#20223E] font-extrabold text-sm sm:text-base tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isTamil ? 'உறுதி செய்து அட்டையை பெறவும்' : 'Verify & Retrieve ID Card'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Security Note */}
                <div className="pt-2 text-center">
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Official 256-Bit Encrypted Member Verification</span>
                  </span>
                </div>

              </form>
            </div>
          </div>
        ) : (
          /* =========================================================================
              STATE 2: VERIFIED MEMBER ID CARD ACCESS & DOWNLOAD SCREEN
             ========================================================================= */
          <div className="space-y-6">
            
            {/* Success Notification Bar */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="w-12 h-12 rounded-2xl bg-green-100 text-[#91BD32] flex items-center justify-center flex-shrink-0 shadow-xs">
                    <CheckCircle2 className="w-6 h-6 text-[#91BD32]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-[#91BD32] uppercase block">
                      OFFICIAL VERIFIED MEMBER
                    </span>
                    <h2 className="text-xl font-black text-[#20223E]">
                      {verifiedMember.full_name}
                    </h2>
                    <p className="font-mono text-xs font-bold text-slate-500">
                      ID: {verifiedMember.membership_number} &bull; {verifiedMember.village_name || 'Kinathukadavu'}
                    </p>
                  </div>
                </div>

                {/* Actions: Download PDF & Print */}
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-center">
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isExportingPdf}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#91BD32] hover:bg-[#80a82b] text-[#20223E] font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isExportingPdf ? 'Exporting...' : 'Download CR80 PDF'}</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#20223E] hover:bg-[#2c2f54] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Card</span>
                  </button>

                  <button
                    onClick={handleReset}
                    className="p-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                    title="Retrieve Another Card"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Side Switcher (Mobile) */}
            <div className="flex justify-center md:hidden">
              <div className="bg-slate-200 p-1 rounded-xl inline-flex gap-1 text-xs font-bold">
                <button
                  onClick={() => setActiveCardSide('both')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${activeCardSide === 'both' ? 'bg-white shadow text-[#20223E]' : 'text-slate-600'}`}
                >
                  Both Sides
                </button>
                <button
                  onClick={() => setActiveCardSide('front')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${activeCardSide === 'front' ? 'bg-white shadow text-[#20223E]' : 'text-slate-600'}`}
                >
                  Front
                </button>
                <button
                  onClick={() => setActiveCardSide('back')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${activeCardSide === 'back' ? 'bg-white shadow text-[#20223E]' : 'text-slate-600'}`}
                >
                  Back
                </button>
              </div>
            </div>

            {/* CR80 Cards Display Canvas */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-slate-200 flex flex-col items-center">
              
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-12 w-full">
                {/* Front Side */}
                <div className={`flex flex-col items-center ${activeCardSide === 'back' ? 'hidden md:flex' : 'flex'}`}>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <span>FRONT SIDE (53.98 × 85.60 mm)</span>
                  </span>
                  <div className="shadow-2xl rounded-2xl overflow-hidden border border-slate-200">
                    <CR80MembershipCard
                      ref={frontCardRef}
                      member={verifiedMember}
                      side="front"
                    />
                  </div>
                </div>

                {/* Back Side */}
                <div className={`flex flex-col items-center ${activeCardSide === 'front' ? 'hidden md:flex' : 'flex'}`}>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <span>BACK SIDE (VERIFICATION & QR)</span>
                  </span>
                  <div className="shadow-2xl rounded-2xl overflow-hidden border border-slate-200">
                    <CR80MembershipCard
                      ref={backCardRef}
                      member={verifiedMember}
                      side="back"
                      qrCodeUrl={qrCodeUrl}
                    />
                  </div>
                </div>
              </div>

              {/* Physical Specifications Note */}
              <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500 max-w-lg">
                <p className="font-bold text-[#20223E]">ISO/IEC 7810 ID-1 Standard CR80 Dimensions</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Matches standard physical debit/credit card specifications. Printed with high-contrast functional QR code for official grassroots verification.
                </p>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
