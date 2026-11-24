import React, { useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Member } from '../types';
import { 
  CheckCircle, 
  Download, 
  Printer, 
  Copy, 
  Home, 
  Sparkles, 
  Check, 
  MapPin, 
  Calendar, 
  User, 
  Shield 
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface RegistrationSuccessPageProps {
  member: Member;
  onHomeClick: () => void;
}

export const RegistrationSuccessPage: React.FC<RegistrationSuccessPageProps> = ({ member, onHomeClick }) => {
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Copy membership ID
  const handleCopyId = () => {
    navigator.clipboard.writeText(member.membership_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Print confirmation using native browser print
  const handlePrint = () => {
    window.print();
  };

  // Generate and download Confirmation PDF
  const handleDownloadPdf = async () => {
    if (!cardRef.current) return;
    setIsExportingPdf(true);

    try {
      const element = cardRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Add Header info
      pdf.setFontSize(16);
      pdf.setTextColor(32, 34, 62); // #20223E
      pdf.text('WE THE LEADER - MEMBERSHIP CONFIRMATION', pdfWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setTextColor(145, 189, 50); // #91BD32
      pdf.text('LEAD THE CHANGE | KINATHUKADAVU, COIMBATORE', pdfWidth / 2, 27, { align: 'center' });

      // Embed Card Image
      const yOffset = 35;
      pdf.addImage(imgData, 'PNG', 15, yOffset, pdfWidth - 30, (pdfHeight * (pdfWidth - 30)) / pdfWidth);

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text(`Official Record: ${member.membership_number} | Generated on ${new Date().toLocaleDateString()}`, pdfWidth / 2, 280, { align: 'center' });

      pdf.save(`${member.membership_number}_Confirmation.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const formattedDate = member.registration_date 
    ? new Date(member.registration_date).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString();

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      
      {/* Success Badge & Header */}
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
      </div>

      {/* Printable Confirmation Card */}
      <div 
        ref={cardRef} 
        id="printable-confirmation"
        className="bg-white rounded-3xl shadow-xl border-2 border-[#91BD32] overflow-hidden mb-8 transform transition-all"
      >
        {/* Card Header with Navy background and Official Logo */}
        <div className="bg-[#20223E] text-white p-5 sm:p-6 text-center relative border-b-4 border-[#91BD32]">
          <div className="bg-white p-2 rounded-xl inline-block shadow mb-2">
            <img 
              src="/logo.svg" 
              alt="WE the Leader" 
              className="h-12 w-auto object-contain mx-auto"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('we-the-leader-logo.jpg')) {
                  target.src = '/we-the-leader-logo.jpg';
                }
              }}
            />
          </div>
          <div className="text-xl font-black tracking-tight text-white">
            {t('orgName')}
          </div>
          <div className="text-xs font-black text-[#91BD32] tracking-widest uppercase">
            {t('tagline')}
          </div>
          <div className="text-[10px] text-slate-300 font-medium tracking-wider mt-0.5">
            {t('location')}
          </div>
        </div>

        {/* Card Body with Membership Number & Details */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Membership Number Hero Display */}
          <div className="text-center p-4 rounded-2xl bg-[#F5F7FA] border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              {t('membershipNumberLabel')}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#20223E] tracking-wider font-mono">
              {member.membership_number}
            </div>
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-0.5 rounded-full bg-[#91BD32]/20 text-[#20223E] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#91BD32]" />
              <span>Official Active Member</span>
            </div>
          </div>

          {/* Member Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            
            {/* Full Name */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                {t('nameLabel')}
              </div>
              <div className="text-base font-bold text-[#20223E] mt-0.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#2878B9] flex-shrink-0" />
                <span className="truncate">{member.full_name}</span>
              </div>
            </div>

            {/* Registration Date */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                {t('dateCardLabel')}
              </div>
              <div className="text-sm font-bold text-[#20223E] mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#E98A32] flex-shrink-0" />
                <span>{formattedDate}</span>
              </div>
            </div>

            {/* Village */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                {t('villageCardLabel')}
              </div>
              <div className="text-sm font-bold text-[#20223E] mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#91BD32] flex-shrink-0" />
                <span>{member.village_name || 'Kinathukadavu'}</span>
              </div>
            </div>

            {/* Ward & District */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                {t('wardCardLabel')} / {t('districtCardLabel')}
              </div>
              <div className="text-sm font-bold text-[#20223E] mt-0.5 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#2878B9] flex-shrink-0" />
                <span>{member.ward_number ? `${member.ward_number}, ` : ''}{member.district || 'Coimbatore'}</span>
              </div>
            </div>

          </div>

          {/* Privacy Notice Note */}
          <p className="text-[11px] text-center text-slate-400">
            {t('cardNotice')}
          </p>

        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        
        {/* Copy Membership Number */}
        <button
          onClick={handleCopyId}
          className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-[#20223E] font-bold text-sm border-2 border-slate-300 shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-green-700">{t('copiedToast')}</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-[#2878B9]" />
              <span>{t('btnCopyNumber')}</span>
            </>
          )}
        </button>

        {/* Download PDF & Print Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="py-3.5 px-4 rounded-xl bg-[#20223E] hover:bg-[#2c2f54] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#91BD32]" />
            <span>{isExportingPdf ? t('loading') : t('btnDownloadPdf')}</span>
          </button>

          <button
            onClick={handlePrint}
            className="py-3.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-[#20223E] font-bold text-sm border border-slate-300 shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#E98A32]" />
            <span>{t('btnPrint')}</span>
          </button>
        </div>

        {/* Back to Home */}
        <div className="pt-2">
          <button
            onClick={onHomeClick}
            className="w-full py-3 px-4 rounded-xl text-slate-600 hover:text-[#20223E] hover:bg-slate-100 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>{t('btnBackHome')}</span>
          </button>
        </div>

      </div>

    </div>
  );
};
