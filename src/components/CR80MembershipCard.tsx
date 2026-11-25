import React, { forwardRef } from 'react';
import { Member } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles, MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface CR80MembershipCardProps {
  member: Member;
  side: 'front' | 'back';
  qrCodeUrl?: string;
}

/**
 * Standard CR80 Card Dimensions:
 * Physical Size: 53.98 mm × 85.60 mm (ATM / Debit Card)
 * Ratio: 53.98 / 85.60 = 0.630607
 * Display Size in pixels: 318px × 504.28px
 * 300 DPI Export: 638px × 1011px
 */
export const CR80MembershipCard = forwardRef<HTMLDivElement, CR80MembershipCardProps>(
  ({ member, side, qrCodeUrl }, ref) => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';

    const formattedDate = member.registration_date
      ? new Date(member.registration_date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : new Date().toLocaleDateString('en-IN');

    // =========================================================================
    // FRONT SIDE: MEMBERSHIP IDENTITY
    // =========================================================================
    if (side === 'front') {
      return (
        <div
          ref={ref}
          id="printable-cr80-card-front"
          className="bg-white text-[#20223E] overflow-hidden shadow-2xl rounded-[16px] border border-slate-300 relative select-none flex flex-col justify-between"
          style={{
            width: '318px',
            height: '504px',
            boxSizing: 'border-box',
            pageBreakInside: 'avoid'
          }}
        >
          {/* Card Header in Navy Blue with micro green accent */}
          <div className="bg-[#20223E] text-white p-3.5 pb-2.5 relative border-b-[3px] border-[#91BD32]">
            <div className="flex items-center justify-between">
              
              {/* Logo in clean white container */}
              <div className="bg-white p-1 rounded-lg shadow-xs flex-shrink-0">
                <img
                  src="/logo.svg"
                  alt="WE the Leader"
                  className="h-8 w-auto object-contain max-w-[85px]"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('we-the-leader-logo.jpg')) {
                      target.src = '/we-the-leader-logo.jpg';
                    }
                  }}
                />
              </div>

              {/* Header Title & Tagline */}
              <div className="text-right flex-1 pl-2">
                <div className="text-[12px] font-black tracking-tight leading-tight text-white uppercase">
                  WE THE LEADER
                </div>
                <div className="text-[8px] font-black text-[#91BD32] tracking-wider uppercase">
                  LEAD THE CHANGE
                </div>
                <div className="text-[7.5px] text-slate-300 font-bold uppercase tracking-wider flex items-center justify-end gap-0.5 mt-0.5">
                  <MapPin className="w-2.5 h-2.5 text-[#E98A32]" />
                  <span>KINATHUKADAVU | COIMBATORE</span>
                </div>
              </div>

            </div>
          </div>

          {/* Member Photograph & Status (Center) */}
          <div className="px-5 pt-3 pb-2 flex flex-col items-center flex-1 justify-center">
            
            {/* Photo Frame (Exact rectangular / slightly rounded proportions) */}
            <div className="w-[96px] h-[116px] rounded-xl border-[2.5px] border-[#91BD32] p-0.5 bg-white shadow-md overflow-hidden relative mb-2 flex items-center justify-center">
              {member.profile_photo_url ? (
                <img
                  src={member.profile_photo_url}
                  alt={member.full_name}
                  className="w-full h-full object-cover rounded-[8px]"
                />
              ) : (
                /* PHOTO FALLBACK: Official logo on clean white background. NEVER broken or empty avatar! */
                <div className="w-full h-full bg-white flex flex-col items-center justify-center p-2 rounded-[8px] text-center">
                  <img
                    src="/logo.svg"
                    alt="WE the Leader Official"
                    className="w-14 h-auto object-contain max-h-[50px] mb-1"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('we-the-leader-logo.jpg')) {
                        target.src = '/we-the-leader-logo.jpg';
                      }
                    }}
                  />
                  <span className="text-[7.5px] font-black text-[#20223E] leading-tight uppercase">
                    WE THE LEADER
                  </span>
                  <span className="text-[6.5px] font-bold text-[#91BD32] uppercase">
                    MEMBER
                  </span>
                </div>
              )}
            </div>

            {/* Status Pill */}
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#91BD32]/15 border border-[#91BD32]/40 text-[#20223E] text-[8px] font-extrabold uppercase mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#91BD32]" />
              <span>ACTIVE MEMBER &bull; அதிகாரப்பூர்வ உறுப்பினர்</span>
            </div>

            {/* Member Full Name */}
            <h2 className="text-[14px] font-black text-[#20223E] text-center leading-tight line-clamp-2 max-w-[270px]">
              {member.full_name}
            </h2>

            {/* Membership Number Box */}
            <div className="mt-2 w-full bg-[#F5F7FA] border border-slate-200 rounded-lg py-1 px-2 text-center">
              <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest block">
                MEMBERSHIP ID / உறுப்பினர் எண்
              </span>
              <span className="text-[14px] font-black text-[#20223E] font-mono tracking-wider block">
                {member.membership_number}
              </span>
            </div>

            {/* Member Details Grid (Village, Ward, District, Date) */}
            <div className="mt-2 w-full grid grid-cols-2 gap-1.5 text-left text-[9px] bg-slate-50 p-2 rounded-lg border border-slate-100">
              <div>
                <span className="text-[7.5px] font-bold text-slate-400 uppercase block">VILLAGE / கிராமம்</span>
                <span className="font-bold text-[#20223E] truncate block">{member.village_name || 'Kinathukadavu'}</span>
              </div>
              <div>
                <span className="text-[7.5px] font-bold text-slate-400 uppercase block">WARD / வார்டு</span>
                <span className="font-bold text-[#20223E] truncate block">{member.ward_number || '-'}</span>
              </div>
              <div>
                <span className="text-[7.5px] font-bold text-slate-400 uppercase block">DISTRICT / மாவட்டம்</span>
                <span className="font-bold text-[#20223E] block">{member.district || 'Coimbatore'}</span>
              </div>
              <div>
                <span className="text-[7.5px] font-bold text-slate-400 uppercase block">ISSUED / பதிவு தேதி</span>
                <span className="font-bold text-[#20223E] block">{formattedDate}</span>
              </div>
            </div>

          </div>

          {/* Bottom Security Stripe & Dimension tag */}
          <div className="bg-[#20223E] text-white px-3 py-1.5 flex items-center justify-between text-[7px] font-bold border-t border-slate-200">
            <span className="text-[#91BD32] uppercase tracking-wider">CR80 STANDARD CARD</span>
            <span className="text-slate-300">KINATHUKADAVU &bull; TAMIL NADU</span>
          </div>
        </div>
      );
    }

    // =========================================================================
    // BACK SIDE: MEMBERSHIP VERIFICATION
    // =========================================================================
    return (
      <div
        ref={ref}
        id="printable-cr80-card-back"
        className="bg-white text-[#20223E] overflow-hidden shadow-2xl rounded-[16px] border border-slate-300 relative select-none flex flex-col justify-between"
        style={{
          width: '318px',
          height: '504px',
          boxSizing: 'border-box',
          pageBreakInside: 'avoid'
        }}
      >
        {/* Back Card Header in Navy Blue with micro green accent */}
        <div className="bg-[#20223E] text-white p-3.5 pb-2.5 relative border-b-[3px] border-[#91BD32]">
          <div className="flex items-center justify-between">
            <div className="bg-white p-1 rounded-lg shadow-xs flex-shrink-0">
              <img
                src="/logo.svg"
                alt="WE the Leader"
                className="h-8 w-auto object-contain max-w-[85px]"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('we-the-leader-logo.jpg')) {
                    target.src = '/we-the-leader-logo.jpg';
                  }
                }}
              />
            </div>
            <div className="text-right flex-1 pl-2">
              <div className="text-[12px] font-black tracking-tight leading-tight text-white uppercase">
                WE THE LEADER
              </div>
              <div className="text-[8px] font-black text-[#91BD32] tracking-wider uppercase">
                LEAD THE CHANGE
              </div>
              <div className="text-[7.5px] text-slate-300 font-bold uppercase tracking-wider">
                MEMBERSHIP VERIFICATION
              </div>
            </div>
          </div>
        </div>

        {/* Back Content Area: Functional QR Code & Verification Data */}
        <div className="px-5 py-3 flex flex-col items-center flex-1 justify-around text-center">
          
          <div className="space-y-1">
            <span className="text-[9px] font-black text-[#20223E] tracking-wider uppercase block">
              OFFICIAL DIGITAL VERIFICATION
            </span>
            <span className="text-[8px] font-medium text-slate-500 block font-tamil">
              உறுப்பினர் விவரங்களைச் சரிபார்க்க QR குறியீட்டை ஸ்கேன் செய்யவும்
            </span>
          </div>

          {/* Functional QR Code Frame */}
          <div className="p-2.5 bg-white border-2 border-[#20223E] rounded-xl shadow-sm inline-block my-1">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt={`Verification QR Code for ${member.membership_number}`}
                className="w-[124px] h-[124px] object-contain"
              />
            ) : (
              <div className="w-[124px] h-[124px] bg-slate-100 flex items-center justify-center text-[9px] text-slate-400">
                Generating QR...
              </div>
            )}
          </div>

          {/* Membership ID Confirmation below QR */}
          <div className="font-mono text-[11px] font-black text-[#20223E] tracking-wider bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
            {member.membership_number}
          </div>

          {/* Official Terms & Notice */}
          <div className="bg-[#F5F7FA] border border-slate-200 rounded-lg p-2 text-left w-full space-y-1">
            <p className="text-[7.5px] text-slate-600 leading-tight">
              &bull; This card confirms active registered membership in <strong>WE the Leader</strong>, Kinathukadavu. It is non-transferable.
            </p>
            <p className="text-[7.5px] text-slate-600 leading-tight font-tamil">
              &bull; இவ்வட்டை <strong>WE the Leader</strong> அமைப்பின் அதிகாரப்பூர்வ உறுப்பினர் சான்றாகும். மற்றவருக்கு மாற்றத்தக்கதல்ல.
            </p>
          </div>

          {/* Official Contact Info */}
          <div className="text-[7.5px] text-slate-500 space-y-0.5 border-t border-slate-100 pt-1.5 w-full">
            <p className="font-bold text-[#20223E]">WE THE LEADER &bull; KINATHUKADAVU</p>
            <p>Kinathukadavu, Coimbatore - 642109, Tamil Nadu, India</p>
            <p className="text-[#2878B9] font-semibold">wetheleader.org</p>
          </div>

        </div>

        {/* Bottom Bar matching Front */}
        <div className="bg-[#20223E] text-white px-3 py-1.5 flex items-center justify-between text-[7px] font-bold border-t border-slate-200">
          <span className="text-[#91BD32] uppercase tracking-wider">STANDARD CR80 &bull; 53.98 × 85.60 MM</span>
          <span className="text-slate-300">WWW.WETHELEADER.ORG</span>
        </div>
      </div>
    );
  }
);
