import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Member } from '../types';
import { memberService } from '../services/memberService';
import { CR80MembershipCard } from '../components/CR80MembershipCard';
import { MobileCardImageViewerModal } from '../components/MobileCardImageViewerModal';
import { 
  exportCardPdf, 
  exportCardPng, 
  exportBothCardsZip, 
  printCardIsolated,
  captureCardCanvas
} from '../utils/idCardExport';
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
  RefreshCw,
  Image,
  ChevronDown,
  Info,
  Smartphone
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
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [paperFormat, setPaperFormat] = useState<'cr80' | 'a4'>('cr80');
  const [showPngMenu, setShowPngMenu] = useState(false);
  const [activeCardSide, setActiveCardSide] = useState<'both' | 'front' | 'back'>('both');
  const [mobileImageViewOpen, setMobileImageViewOpen] = useState(false);
  const [frontPngDataUrl, setFrontPngDataUrl] = useState<string | null>(null);
  const [backPngDataUrl, setBackPngDataUrl] = useState<string | null>(null);
  const [isGeneratingMobileImages, setIsGeneratingMobileImages] = useState(false);
  const [displayMode, setDisplayMode] = useState<'preview' | 'images'>('preview');

  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);

  // Generates high-res PNG data URLs for mobile view and long-press saving
  const handleOpenMobileImageViewer = async () => {
    if (!verifiedMember || !frontCardRef.current || !backCardRef.current) return;
    setIsGeneratingMobileImages(true);
    try {
      let fData = frontPngDataUrl;
      let bData = backPngDataUrl;
      if (!fData) {
        const fCanvas = await captureCardCanvas(frontCardRef.current);
        fData = fCanvas.toDataURL('image/png', 1.0);
        setFrontPngDataUrl(fData);
      }
      if (!bData) {
        const bCanvas = await captureCardCanvas(backCardRef.current);
        bData = bCanvas.toDataURL('image/png', 1.0);
        setBackPngDataUrl(bData);
      }
      setMobileImageViewOpen(true);
    } catch (err) {
      console.error('Error preparing mobile images:', err);
    } finally {
      setIsGeneratingMobileImages(false);
    }
  };

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

  // Dedicated 2-Page CR80 PDF Export
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

  // High-Resolution 480 DPI PNG Export (1016 × 1612 px)
  const handleDownloadPng = async (variant: 'FRONT' | 'BACK' | 'BOTH') => {
    if (!verifiedMember || !frontCardRef.current) return;
    setIsExportingPng(true);
    setShowPngMenu(false);
    try {
      if (variant === 'BOTH' && backCardRef.current) {
        await exportBothCardsZip(
          frontCardRef.current,
          backCardRef.current,
          verifiedMember
        );
      } else if (variant === 'BACK' && backCardRef.current) {
        await exportCardPng(backCardRef.current, verifiedMember, 'BACK');
      } else {
        await exportCardPng(frontCardRef.current, verifiedMember, 'FRONT');
      }
    } catch (err) {
      console.error('PNG export error:', err);
    } finally {
      setIsExportingPng(false);
    }
  };

  // Isolated CR80 / A4 Print Action (Guaranteed 2 pages without clipping or enlargement)
  const handlePrint = async () => {
    if (!verifiedMember || !frontCardRef.current) return;
    setIsPrinting(true);
    try {
      await printCardIsolated(
        frontCardRef.current,
        backCardRef.current,
        verifiedMember,
        { mode: activeCardSide, paperFormat }
      );
    } catch (err) {
      console.error('Print card error:', err);
    } finally {
      setIsPrinting(false);
    }
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
        <div className="mb-6 flex items-center justify-between no-print">
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
          <div className="max-w-md mx-auto no-print">
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
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-200 no-print">
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

                {/* Actions: Download PDF, Download PNG & Print */}
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-center">
                  
                  {/* Download PNG (480 DPI - 1016 × 1612 px) */}
                  <div className="relative">
                    <div className="inline-flex rounded-xl shadow-xs">
                      <button
                        type="button"
                        onClick={() => handleDownloadPng('BOTH')}
                        disabled={isExportingPng}
                        className="px-4 py-3 rounded-l-xl bg-slate-100 hover:bg-slate-200 text-[#20223E] border border-slate-300 font-black text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        title="Download 1016 × 1612 px PNG Cards"
                      >
                        <Image className="w-4 h-4 text-emerald-600" />
                        <span>{isExportingPng ? 'Generating...' : 'Download PNG'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPngMenu(!showPngMenu)}
                        disabled={isExportingPng}
                        className="px-2 py-3 rounded-r-xl bg-slate-100 hover:bg-slate-200 border-y border-r border-slate-300 text-slate-700 cursor-pointer disabled:opacity-50"
                        title="PNG Options"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {showPngMenu && (
                      <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-fadeIn">
                        <button
                          type="button"
                          onClick={() => handleDownloadPng('BOTH')}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between font-bold text-slate-800"
                        >
                          <span>Download Both (ZIP)</span>
                          <span className="text-[10px] text-emerald-600 font-mono">1016×1612</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPng('FRONT')}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700"
                        >
                          <span>Front Side PNG</span>
                          <span className="text-[10px] text-slate-400 font-mono">1016×1612</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPng('BACK')}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700"
                        >
                          <span>Back Side PNG</span>
                          <span className="text-[10px] text-slate-400 font-mono">1016×1612</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mobile Long-Press Image Saver */}
                  <button
                    type="button"
                    onClick={handleOpenMobileImageViewer}
                    disabled={isGeneratingMobileImages}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                    title="Save Front & Back Images to Phone Gallery"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-200" />
                    <span>{isGeneratingMobileImages ? 'Preparing Images...' : (isTamil ? '📱 மொபைல் சேமிப்பு' : '📱 Mobile Save')}</span>
                  </button>

                  {/* Download PDF */}
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isExportingPdf}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#91BD32] hover:bg-[#80a82b] text-[#20223E] font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                    title="Download 2-Page CR80 PDF"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isExportingPdf ? 'Exporting...' : 'Download CR80 PDF'}</span>
                  </button>

                  {/* Print Card */}
                  <button
                    onClick={handlePrint}
                    disabled={isPrinting}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#20223E] hover:bg-[#2c2f54] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                    title="Print 2 Pages (Flip on Short Edge)"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{isPrinting ? 'Preparing...' : 'Print Card'}</span>
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

            {/* Printing Format & Duplex Guide Notice */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs no-print">
              <div className="flex items-center gap-2 text-slate-700">
                <Info className="w-4 h-4 text-[#91BD32] flex-shrink-0" />
                <span>
                  <strong>Duplex Printing:</strong> Set printer to <strong>"Flip on short edge"</strong> for portrait CR80 card. For standard paper, choose A4 Sheet (Scale 100%).
                </span>
              </div>
              <div className="flex items-center gap-1.5 self-center sm:self-auto">
                <span className="font-bold text-slate-600 mr-1">Target:</span>
                <button
                  type="button"
                  onClick={() => setPaperFormat('cr80')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    paperFormat === 'cr80'
                      ? 'bg-[#20223E] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  CR80 Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaperFormat('a4')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    paperFormat === 'a4'
                      ? 'bg-[#20223E] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  A4 Sheet (100%)
                </button>
              </div>
            </div>

            {/* Side Switcher (Mobile) */}
            <div className="flex justify-center md:hidden no-print">
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
              
              <div 
                id="printable-cr80-container"
                className={`flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-12 w-full print-side-${activeCardSide}`}
              >
                {/* Front Side */}
                <div className={`flex flex-col items-center ${activeCardSide === 'back' ? 'hidden md:flex' : 'flex'}`}>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1 no-print print-label">
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
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1 no-print print-label">
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
              <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500 max-w-lg no-print">
                <p className="font-bold text-[#20223E]">ISO/IEC 7810 ID-1 Standard CR80 Dimensions</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Matches standard physical debit/credit card specifications. Printed with high-contrast functional QR code for official grassroots verification.
                </p>
              </div>

            </div>

            {/* Mobile Card Image Viewer Modal (Long-Press Save to Gallery) */}
            {verifiedMember && (
              <MobileCardImageViewerModal
                isOpen={mobileImageViewOpen}
                onClose={() => setMobileImageViewOpen(false)}
                frontImageSrc={frontPngDataUrl}
                backImageSrc={backPngDataUrl}
                member={verifiedMember}
                onDownloadPdf={handleDownloadPdf}
              />
            )}

          </div>
        )}

      </div>
    </div>
  );
};
