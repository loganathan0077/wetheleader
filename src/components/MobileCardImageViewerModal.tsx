import React, { useState } from 'react';
import { Member } from '../types';
import { Download, X, Smartphone, CreditCard, Sparkles, Check, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface MobileCardImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  frontImageSrc?: string | null;
  backImageSrc?: string | null;
  member: Member;
  onDownloadPdf?: () => void;
}

export const MobileCardImageViewerModal: React.FC<MobileCardImageViewerModalProps> = ({
  isOpen,
  onClose,
  frontImageSrc,
  backImageSrc,
  member,
  onDownloadPdf
}) => {
  const { language } = useLanguage();
  const isTamil = language === 'ta';
  const [activeTab, setActiveTab] = useState<'front' | 'back' | 'both'>('front');

  if (!isOpen) return null;

  const cleanId = (member.membership_number || 'Member').replace(/[^a-zA-Z0-9-_]/g, '_');

  const handleDownloadDirect = (side: 'FRONT' | 'BACK') => {
    const src = side === 'FRONT' ? frontImageSrc : backImageSrc;
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = `${cleanId}_${side}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[95vh] border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Smartphone className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#20223E]">
                {isTamil ? 'மொபைலில் சேமிக்க (Long Press)' : 'Save Card as Image'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isTamil ? 'படத்தை அழுத்திப் பிடித்து சேமிக்கவும்' : 'Tap & hold image to save to Photos'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-slate-100 flex items-center justify-center gap-1.5 border-b border-slate-200 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('front')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'front'
                ? 'bg-[#20223E] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isTamil ? 'முன்பக்கம்' : 'Front Side'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('back')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'back'
                ? 'bg-[#20223E] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isTamil ? 'பின்பக்கம்' : 'Back Side'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('both')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'both'
                ? 'bg-[#20223E] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isTamil ? 'இருபுறமும்' : 'Both Sides'}
          </button>
        </div>

        {/* Helpful Mobile Tip */}
        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 text-[11px] text-emerald-900 flex items-center gap-2 flex-shrink-0">
          <span className="text-base">💡</span>
          <span>
            {isTamil 
              ? 'கார்டு படத்தின் மீது விரலை அழுத்திப் பிடித்து (Long press) "Save to Photos" அல்லது "Download image" தேர்வு செய்யவும்.'
              : 'Press & hold (long-press) on the card image to save directly to your Photos / Gallery.'}
          </span>
        </div>

        {/* Image Display Area (Real <img> elements, No overlays, Standard context menu) */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col items-center gap-6 bg-slate-50">
          
          {/* Front Image */}
          {(activeTab === 'front' || activeTab === 'both') && frontImageSrc && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-[#91BD32]" />
                <span>{isTamil ? 'முன்பக்கம் (1016 × 1612 px)' : 'Front Side (1016 × 1612 px)'}</span>
              </span>
              <img
                src={frontImageSrc}
                alt={`${member.full_name} Front ID Card`}
                className="w-[280px] sm:w-[318px] h-auto rounded-2xl shadow-xl border border-slate-300 block select-auto pointer-events-auto"
                style={{
                  width: '300px',
                  height: 'auto',
                  aspectRatio: '1016 / 1612',
                  touchAction: 'auto',
                  WebkitUserSelect: 'auto',
                  userSelect: 'auto'
                }}
              />
              <button
                type="button"
                onClick={() => handleDownloadDirect('FRONT')}
                className="mt-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isTamil ? 'முன்பக்க படம் பதிவிறக்கு' : 'Download Front Image'}</span>
              </button>
            </div>
          )}

          {/* Back Image */}
          {(activeTab === 'back' || activeTab === 'both') && backImageSrc && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#2878B9]" />
                <span>{isTamil ? 'பின்பக்கம் (1016 × 1612 px)' : 'Back Side (1016 × 1612 px)'}</span>
              </span>
              <img
                src={backImageSrc}
                alt={`${member.full_name} Back ID Card`}
                className="w-[280px] sm:w-[318px] h-auto rounded-2xl shadow-xl border border-slate-300 block select-auto pointer-events-auto"
                style={{
                  width: '300px',
                  height: 'auto',
                  aspectRatio: '1016 / 1612',
                  touchAction: 'auto',
                  WebkitUserSelect: 'auto',
                  userSelect: 'auto'
                }}
              />
              <button
                type="button"
                onClick={() => handleDownloadDirect('BACK')}
                className="mt-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#2878B9]" />
                <span>{isTamil ? 'பின்பக்க படம் பதிவிறக்கு' : 'Download Back Image'}</span>
              </button>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-2 flex-shrink-0">
          {onDownloadPdf && (
            <button
              type="button"
              onClick={onDownloadPdf}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#2878B9]" />
              <span>{isTamil ? 'PDF பதிவிறக்கு' : 'Download PDF'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto px-4 py-2 rounded-xl bg-[#20223E] hover:bg-[#2c2f54] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {isTamil ? 'முடிந்தது' : 'Done'}
          </button>
        </div>

      </div>
    </div>
  );
};
