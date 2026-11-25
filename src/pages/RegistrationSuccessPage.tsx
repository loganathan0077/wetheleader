import React, { useRef, useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Member } from '../types';
import { CR80MembershipCard } from '../components/CR80MembershipCard';
import { 
  CheckCircle, 
  Download, 
  Printer, 
  Copy, 
  Home, 
  Sparkles, 
  Check, 
  CreditCard,
  FileText,
  Image as ImageIcon,
  RotateCcw,
  Info
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

interface RegistrationSuccessPageProps {
  member: Member;
  onHomeClick: () => void;
}

export const RegistrationSuccessPage: React.FC<RegistrationSuccessPageProps> = ({ member, onHomeClick }) => {
  const { t, language } = useLanguage();
  const isTamil = language === 'ta';

  const [copied, setCopied] = useState(false);
  const [activeSide, setActiveSide] = useState<'both' | 'front' | 'back'>('both');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingFrontPng, setIsExportingFrontPng] = useState(false);
  const [isExportingBackPng, setIsExportingBackPng] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  // Generate real, functional QR code linking to the verification endpoint
  useEffect(() => {
    const generateQR = async () => {
      try {
        const verifyUrl = `${window.location.origin}/?verify=${encodeURIComponent(member.membership_number)}`;
        const url = await QRCode.toDataURL(verifyUrl, {
          width: 300,
          margin: 1,
          color: {
            dark: '#20223E',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(url);
      } catch (err) {
        console.error('QR code generation error:', err);
      }
    };
    generateQR();
  }, [member.membership_number]);

  // Copy membership ID
  const handleCopyId = () => {
    navigator.clipboard.writeText(member.membership_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // 1. GENERATE EXACT 2-PAGE CR80 PDF (53.98 × 85.60 mm per page)
  const handleDownloadPdf = async () => {
    if (!frontRef.current || !backRef.current) return;
    setIsExportingPdf(true);

    try {
      // 300 DPI scale factor: 638 px / offsetWidth
      const scaleFront = 638 / frontRef.current.offsetWidth;
      const frontCanvas = await html2canvas(frontRef.current, {
        scale: scaleFront,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false
      });
      const frontImgData = frontCanvas.toDataURL('image/png', 1.0);

      const scaleBack = 638 / backRef.current.offsetWidth;
      const backCanvas = await html2canvas(backRef.current, {
        scale: scaleBack,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false
      });
      const backImgData = backCanvas.toDataURL('image/png', 1.0);

      // Create PDF with exact CR80 vertical dimensions (53.98mm × 85.60mm)
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [53.98, 85.60],
        compress: true
      });

      // Page 1: Front
      pdf.addImage(frontImgData, 'PNG', 0, 0, 53.98, 85.60, undefined, 'FAST');

      // Page 2: Back
      pdf.addPage([53.98, 85.60], 'p');
      pdf.addImage(backImgData, 'PNG', 0, 0, 53.98, 85.60, undefined, 'FAST');

      pdf.save(`${member.membership_number}_CR80_ID_Card.pdf`);
    } catch (err) {
      console.error('Error generating CR80 PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 2. EXPORT HIGH-RES 300 DPI PNG (Front: 638 × 1011 px)
  const handleDownloadFrontPng = async () => {
    if (!frontRef.current) return;
    setIsExportingFrontPng(true);
    try {
      const scale = 638 / frontRef.current.offsetWidth;
      const canvas = await html2canvas(frontRef.current, {
        scale: scale,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false
      });
      const link = document.createElement('a');
      link.download = `${member.membership_number}_CR80_Front.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) {
      console.error('Error downloading Front PNG:', err);
    } finally {
      setIsExportingFrontPng(false);
    }
  };

  // 3. EXPORT HIGH-RES 300 DPI PNG (Back: 638 × 1011 px)
  const handleDownloadBackPng = async () => {
    if (!backRef.current) return;
    setIsExportingBackPng(true);
    try {
      const scale = 638 / backRef.current.offsetWidth;
      const canvas = await html2canvas(backRef.current, {
        scale: scale,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false
      });
      const link = document.createElement('a');
      link.download = `${member.membership_number}_CR80_Back.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) {
      console.error('Error downloading Back PNG:', err);
    } finally {
      setIsExportingBackPng(false);
    }
  };

  // 4. PRINT ID CARD (Print only the physical card sides)
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      
      {/* Success Badge & Notification Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-[#91BD32] mb-3 shadow-sm">
          <CheckCircle className="w-10 h-10 text-[#91BD32]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#20223E]">
          {t('regSuccessTitle')}
        </h1>
        <p className="text-sm font-semibold text-slate-600 mt-1">
          {t('regSuccessWelcome')}
        </p>

        {/* Copy ID Ribbon */}
        <div className="mt-3 inline-flex items-center gap-2 p-1.5 px-3 rounded-full bg-slate-100 border border-slate-200 text-xs">
          <span className="font-bold text-slate-500 uppercase">{t('membershipNumberLabel')}:</span>
          <span className="font-mono font-black text-[#20223E]">{member.membership_number}</span>
          <button
            onClick={handleCopyId}
            className="p-1 rounded-full hover:bg-slate-200 text-[#2878B9] transition-colors"
            title="Copy ID"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* CR80 Standard Size Indicator Badge */}
      <div className="max-w-xl mx-auto mb-5 p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs text-blue-900">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#2878B9] flex-shrink-0" />
          <span className="font-bold">
            {isTamil 
              ? 'நிலையான CR80 அட்டை அளவு (53.98 × 85.60 மிமீ • ATM / டெபிட் கார்டு அளவு)' 
              : 'Standard CR80 Dimensions: 53.98 × 85.60 mm (Actual ATM / Debit Card Size)'}
          </span>
        </div>
        <span className="text-[10px] font-mono bg-blue-100 px-2 py-0.5 rounded text-blue-800 font-bold hidden sm:inline">
          300 DPI
        </span>
      </div>

      {/* View Mode Switcher (Both / Front / Back) */}
      <div className="flex items-center justify-center gap-1.5 mb-6">
        <button
          onClick={() => setActiveSide('both')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSide === 'both'
              ? 'bg-[#20223E] text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {isTamil ? 'இரண்டு பக்கங்களும்' : 'Both Sides Preview'}
        </button>
        <button
          onClick={() => setActiveSide('front')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSide === 'front'
              ? 'bg-[#20223E] text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {isTamil ? 'முன்பக்கம்' : 'Front Side'}
        </button>
        <button
          onClick={() => setActiveSide('back')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSide === 'back'
              ? 'bg-[#20223E] text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {isTamil ? 'பின்பக்கம்' : 'Back Side'}
        </button>
      </div>

      {/* =========================================================================
          CR80 MEMBERSHIP ID CARD PREVIEW (Exact ATM Card Proportions)
         ========================================================================= */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 mb-8" id="printable-cr80-container">
        
        {/* FRONT SIDE */}
        <div 
          className={`flex flex-col items-center ${activeSide === 'back' ? 'hidden' : 'flex'}`}
        >
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-[#91BD32]" />
            <span>{isTamil ? 'முன்பக்கம் (அடையாள அட்டை)' : 'Front Side • Identity'}</span>
          </div>

          <CR80MembershipCard
            ref={frontRef}
            member={member}
            side="front"
          />
        </div>

        {/* BACK SIDE */}
        <div 
          className={`flex flex-col items-center ${activeSide === 'front' ? 'hidden' : 'flex'}`}
        >
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#2878B9]" />
            <span>{isTamil ? 'பின்பக்கம் (சரிபார்ப்பு & QR)' : 'Back Side • Verification QR'}</span>
          </div>

          <CR80MembershipCard
            ref={backRef}
            member={member}
            side="back"
            qrCodeUrl={qrCodeUrl}
          />
        </div>

      </div>

      {/* =========================================================================
          DOWNLOAD & ACTION BUTTONS
         ========================================================================= */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-4 max-w-2xl mx-auto">
        
        <h3 className="text-sm font-bold text-[#20223E] uppercase tracking-wider text-center border-b border-slate-100 pb-3">
          {isTamil ? 'பதிவிறக்கம் & அச்சிடும் தேர்வுகள்' : 'Export & Print Options'}
        </h3>

        {/* Primary PDF Download (2-Page Front & Back CR80) */}
        <button
          onClick={handleDownloadPdf}
          disabled={isExportingPdf}
          className="w-full py-4 px-5 rounded-2xl bg-[#20223E] hover:bg-[#2c2f54] text-white font-extrabold text-base shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
        >
          <FileText className="w-5 h-5 text-[#91BD32]" />
          <span>
            {isExportingPdf 
              ? (isTamil ? 'PDF உருவாக்கப்படுகிறது...' : 'Generating 2-Page CR80 PDF...') 
              : (isTamil ? 'முன்பக்கம் & பின்பக்கம் PDF பதிவிறக்கு (53.98 × 85.60 mm)' : 'Download Front & Back PDF (53.98 × 85.60 mm)')}
          </span>
        </button>

        {/* High-Res 300 DPI PNG Downloads */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleDownloadFrontPng}
            disabled={isExportingFrontPng}
            className="py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-[#20223E] font-bold text-xs sm:text-sm border-2 border-slate-200 shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <ImageIcon className="w-4 h-4 text-[#91BD32]" />
            <span>{isExportingFrontPng ? t('loading') : (isTamil ? 'முன்பக்கம் PNG (300 DPI)' : 'Download Front PNG (300 DPI)')}</span>
          </button>

          <button
            onClick={handleDownloadBackPng}
            disabled={isExportingBackPng}
            className="py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-[#20223E] font-bold text-xs sm:text-sm border-2 border-slate-200 shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <ImageIcon className="w-4 h-4 text-[#2878B9]" />
            <span>{isExportingBackPng ? t('loading') : (isTamil ? 'பின்பக்கம் PNG (300 DPI)' : 'Download Back PNG (300 DPI)')}</span>
          </button>
        </div>

        {/* Print Button */}
        <button
          onClick={handlePrint}
          className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#20223E] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4 text-[#E98A32]" />
          <span>{isTamil ? 'அடையாள அட்டையை அச்சிடுக (Print ID Card)' : 'Print ID Card (Exact ATM Card Size)'}</span>
        </button>

        {/* Duplex Printing Advice Box */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">
              {isTamil ? 'அச்சிடும் வழிகாட்டுதல்:' : 'Duplex Printing Instructions:'}
            </span>
            <span>
              {isTamil
                ? 'நிலையான PVC அட்டை அல்லது தடிமனான அட்டையில் அச்சிடலாம். இரட்டைப் பக்க அச்சுக்கு (Duplex Printing) உங்கள் பிரிண்டரில் "Flip on Short Edge" என்பதைத் தேர்ந்தெடுக்கவும்.'
                : 'Print on standard PVC card or cardstock. For double-sided (duplex) printing, select "Flip on Short Edge" in your printer dialog for portrait orientation.'}
            </span>
          </div>
        </div>

        {/* Back to Home Navigation */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={onHomeClick}
            className="w-full py-2.5 px-4 text-slate-500 hover:text-[#20223E] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>{t('btnBackHome')}</span>
          </button>
        </div>

      </div>

    </div>
  );
};
