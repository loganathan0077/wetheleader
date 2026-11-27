import React, { forwardRef, useState, useEffect } from 'react';
import { Member } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { MapPin } from 'lucide-react';
import { getMemberPhotoSignedUrl } from '../lib/supabase';

interface CR80MembershipCardProps {
  member: Member;
  side: 'front' | 'back';
  qrCodeUrl?: string;
}

/**
 * Standard CR80 Card Dimensions:
 * Physical Size: 53.98 mm × 85.60 mm (Standard ATM / Debit Card)
 * Ratio: 53.98 / 85.60 = 0.630607
 * Display Size in pixels: 318px × 504px (318 / 504 = 0.63095)
 * 300 DPI Export: 638px × 1011px
 */
/**
 * Helper to split bilingual member names into clean separate Tamil and English lines.
 * Strips parentheses, slashes, or brackets and ensures proper line assignment.
 */
export function formatCardMemberName(rawName?: string): {
  tamilName?: string;
  englishName?: string;
  singleName?: string;
} {
  if (!rawName) return { singleName: '' };
  const trimmed = rawName.trim();

  // Pattern A: Name with parentheses, e.g. "கதிரவன் ராமசாமி (Kathiravan Ramasamy)"
  const parenMatch = trimmed.match(/^([^(]+)\s*\(([^)]+)\)$/);
  if (parenMatch) {
    const p1 = parenMatch[1].trim();
    const p2 = parenMatch[2].trim();
    const p1HasTamil = /[\u0B80-\u0BFF]/.test(p1);
    const p2HasTamil = /[\u0B80-\u0BFF]/.test(p2);

    if (p1HasTamil) {
      return { tamilName: p1, englishName: p2 };
    } else if (p2HasTamil) {
      return { tamilName: p2, englishName: p1 };
    } else {
      return { tamilName: p1, englishName: p2 };
    }
  }

  // Pattern B: Newline, slash or dash separation, e.g. "கதிரவன் ராமசாமி / Kathiravan Ramasamy"
  const delimiterMatch = trimmed.split(/\r?\n|\s*[/|–—]\s*/);
  if (delimiterMatch.length >= 2) {
    const p1 = delimiterMatch[0].trim();
    const p2 = delimiterMatch[1].trim();
    const p1HasTamil = /[\u0B80-\u0BFF]/.test(p1);
    const p2HasTamil = /[\u0B80-\u0BFF]/.test(p2);

    if (p2HasTamil && !p1HasTamil) {
      return { tamilName: p2, englishName: p1 };
    }
    return { tamilName: p1, englishName: p2 };
  }

  // Pattern C: Single string containing both Tamil and English words without delimiters
  const hasTamil = /[\u0B80-\u0BFF]/.test(trimmed);
  const hasEnglish = /[a-zA-Z]/.test(trimmed);
  if (hasTamil && hasEnglish) {
    const tamilSegment = trimmed.match(/[\u0B80-\u0BFF\s.]+/);
    const englishSegment = trimmed.match(/[a-zA-Z\s.]+/);
    if (tamilSegment && englishSegment) {
      const t = tamilSegment[0].trim();
      const e = englishSegment[0].trim();
      if (t && e) {
        return { tamilName: t, englishName: e };
      }
    }
  }

  // Single language name (only English or only Tamil)
  if (hasTamil) {
    return { tamilName: trimmed, englishName: undefined };
  }
  return { singleName: trimmed };
}

export const CR80MembershipCard = forwardRef<HTMLDivElement, CR80MembershipCardProps>(
  ({ member, side, qrCodeUrl }, ref) => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';

    const [photoUrl, setPhotoUrl] = useState<string | null>(member.profile_photo_url || (member as any).photo_path || null);
    const [photoError, setPhotoError] = useState(false);

    useEffect(() => {
      const initial = member.profile_photo_url || (member as any).photo_path || null;
      if (!initial) {
        setPhotoUrl(null);
        return;
      }
      if (initial.startsWith('data:') || initial.startsWith('http://') || initial.startsWith('https://') || initial.startsWith('blob:')) {
        setPhotoUrl(initial);
        setPhotoError(false);
      } else {
        // Resolve signed URL for private Supabase storage path
        getMemberPhotoSignedUrl(initial).then(signed => {
          if (signed) {
            setPhotoUrl(signed);
            setPhotoError(false);
          } else {
            setPhotoError(true);
          }
        }).catch(() => {
          setPhotoError(true);
        });
      }
    }, [member.profile_photo_url, (member as any).photo_path]);

    const formattedDate = member.registration_date
      ? new Date(member.registration_date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });

    // Parse member name into separate Tamil (Line 1) and English (Line 2) lines
    const parsedName = formatCardMemberName(member.full_name);
    const tamilLen = parsedName.tamilName ? parsedName.tamilName.length : 0;
    const tamilFontSize =
      tamilLen > 28 ? 'text-[12px]' : tamilLen > 18 ? 'text-[13px]' : 'text-[14px]';

    const englishLen = parsedName.englishName ? parsedName.englishName.length : 0;
    const englishFontSize =
      englishLen > 28 ? 'text-[10px]' : englishLen > 18 ? 'text-[10.5px]' : 'text-[11.5px]';

    const singleLen = parsedName.singleName ? parsedName.singleName.length : 0;
    const singleFontSize =
      singleLen > 28 ? 'text-[12px]' : singleLen > 18 ? 'text-[13px]' : 'text-[14px]';

    // =========================================================================
    // FRONT SIDE: MEMBERSHIP IDENTITY
    // =========================================================================
    if (side === 'front') {
      return (
        <div
          ref={ref}
          id="printable-cr80-card-front"
          className="bg-white text-[#20223E] overflow-hidden shadow-xl rounded-[16px] border border-slate-300 relative select-none flex flex-col justify-between"
          style={{
            width: '318px',
            height: '504px',
            boxSizing: 'border-box',
            pageBreakInside: 'avoid',
            flexShrink: 0
          }}
        >
          {/* Card Header in Navy Blue with micro green accent */}
          <div className="bg-[#20223E] text-white p-3 pb-2.5 relative border-b-[3px] border-[#91BD32] flex-shrink-0">
            <div className="flex items-center justify-between">
              
              {/* Logo in clean white container */}
              <div className="bg-white p-1 rounded-lg shadow-xs flex-shrink-0">
                <img
                  src="/logo.svg"
                  alt="WE the Leader"
                  className="h-7 w-auto object-contain max-w-[80px]"
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
                <div className="text-[8px] font-black text-[#91BD32] tracking-wider uppercase mt-0.5">
                  LEAD THE CHANGE
                </div>
                <div className="text-[7px] text-slate-300 font-bold uppercase tracking-wider flex items-center justify-end gap-0.5 mt-0.5">
                  <MapPin className="w-2.5 h-2.5 text-[#E98A32]" />
                  <span>KINATHUKADAVU | COIMBATORE</span>
                </div>
              </div>

            </div>
          </div>

          {/* Member Identity Body (Evenly Distributed, Safe Inside CR80 Area) */}
          <div className="px-4 py-2.5 flex flex-col items-center flex-1 justify-between text-center overflow-hidden">
            
            {/* Photo Frame (Passport proportion 86 × 102 px) */}
            <div className="w-[86px] h-[102px] rounded-xl border-[2.5px] border-[#91BD32] p-0.5 bg-white shadow-sm overflow-hidden relative flex items-center justify-center flex-shrink-0">
              {photoUrl && !photoError ? (
                <img
                  src={photoUrl}
                  alt={member.full_name}
                  crossOrigin="anonymous"
                  onError={() => setPhotoError(true)}
                  className="w-full h-full object-cover rounded-[8px]"
                />
              ) : (
                /* PHOTO FALLBACK: Official logo on clean background. NEVER broken or empty avatar */
                <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-1.5 rounded-[8px] text-center">
                  <img
                    src="/logo.svg"
                    alt="WE the Leader Official"
                    className="w-12 h-auto object-contain max-h-[46px] mb-1"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('we-the-leader-logo.jpg')) {
                        target.src = '/we-the-leader-logo.jpg';
                      }
                    }}
                  />
                  <span className="text-[7.5px] font-black text-[#20223E] leading-tight uppercase tracking-tight">
                    WE THE LEADER
                  </span>
                  <span className="text-[6.5px] font-bold text-[#91BD32] uppercase tracking-wider">
                    MEMBER
                  </span>
                </div>
              )}
            </div>

            {/* Status Pill (Clear font size, no cramped/overlapping characters) */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-[#20223E] text-[7.5px] font-extrabold uppercase shadow-xs flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#91BD32] flex-shrink-0" />
              <span className="tracking-wide">ACTIVE MEMBER</span>
              <span className="text-slate-400 font-normal">•</span>
              <span className="font-tamil font-bold text-emerald-900">அதிகாரப்பூர்வ உறுப்பினர்</span>
            </div>

            {/* Member Name Layout: Line 1 = Tamil Name (Bold, larger), Line 2 = English Name (Medium, directly below, NO parentheses) */}
            <div className="w-full flex flex-col items-center justify-center my-0.5 px-1 min-h-[32px]">
              {parsedName.tamilName && parsedName.englishName ? (
                <>
                  {/* Line 1: Tamil Name */}
                  <div
                    className={`${tamilFontSize} font-black text-[#20223E] font-tamil text-center leading-[1.25] max-w-[280px] break-words`}
                    title={parsedName.tamilName}
                  >
                    {parsedName.tamilName}
                  </div>
                  {/* Line 2: English Name directly below (Medium weight, NO parentheses) */}
                  <div
                    className={`${englishFontSize} font-medium text-slate-700 text-center leading-[1.2] max-w-[280px] break-words mt-0.5 tracking-wide`}
                    title={parsedName.englishName}
                  >
                    {parsedName.englishName}
                  </div>
                </>
              ) : parsedName.tamilName ? (
                <div
                  className={`${tamilFontSize} font-black text-[#20223E] font-tamil text-center leading-[1.25] max-w-[280px] break-words`}
                  title={parsedName.tamilName}
                >
                  {parsedName.tamilName}
                </div>
              ) : (
                <div
                  className={`${singleFontSize} font-bold text-[#20223E] text-center leading-[1.25] max-w-[280px] break-words`}
                  title={parsedName.singleName || member.full_name}
                >
                  {parsedName.singleName || member.full_name}
                </div>
              )}
            </div>

            {/* Membership Number Box */}
            <div className="w-full bg-[#F5F7FA] border border-slate-200 rounded-lg py-1 px-2.5 text-center shadow-xs flex-shrink-0">
              <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest block font-tamil">
                MEMBERSHIP ID / உறுப்பினர் எண்
              </span>
              <span className="text-[13.5px] font-black text-[#20223E] font-mono tracking-wider block mt-0.5">
                {member.membership_number}
              </span>
            </div>

            {/* Member Details Grid (Village, Ward, District, Date) */}
            <div className="w-full grid grid-cols-2 gap-1.5 text-left bg-slate-50 p-2 rounded-lg border border-slate-200 flex-shrink-0">
              <div className="overflow-hidden">
                <span className="text-[7px] font-bold text-slate-500 uppercase block font-tamil truncate">
                  VILLAGE / கிராமம்
                </span>
                <span
                  className="font-bold text-[#20223E] text-[8.5px] block truncate"
                  title={member.village_name || 'Kinathukadavu'}
                >
                  {member.village_name || 'Kinathukadavu'}
                </span>
              </div>
              <div className="overflow-hidden">
                <span className="text-[7px] font-bold text-slate-500 uppercase block font-tamil truncate">
                  WARD / வார்டு
                </span>
                <span className="font-bold text-[#20223E] text-[8.5px] block truncate">
                  {member.ward_number ? `Ward ${member.ward_number}` : '-'}
                </span>
              </div>
              <div className="overflow-hidden">
                <span className="text-[7px] font-bold text-slate-500 uppercase block font-tamil truncate">
                  DISTRICT / மாவட்டம்
                </span>
                <span className="font-bold text-[#20223E] text-[8.5px] block truncate">
                  {member.district || 'Coimbatore'}
                </span>
              </div>
              <div className="overflow-hidden">
                <span className="text-[7px] font-bold text-slate-500 uppercase block font-tamil truncate">
                  ISSUED / பதிவு தேதி
                </span>
                <span className="font-bold text-[#20223E] text-[8.5px] block truncate">
                  {formattedDate}
                </span>
              </div>
            </div>

          </div>

          {/* Bottom Footer: Center Website */}
          <div className="bg-[#20223E] text-white px-3 py-1.5 flex items-center justify-center text-[7px] font-bold border-t border-slate-200 flex-shrink-0">
            <span className="text-center text-white font-extrabold tracking-wider lowercase">
              www.wetheleader.online
            </span>
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
        className="bg-white text-[#20223E] overflow-hidden shadow-xl rounded-[16px] border border-slate-300 relative select-none flex flex-col justify-between"
        style={{
          width: '318px',
          height: '504px',
          boxSizing: 'border-box',
          pageBreakInside: 'avoid',
          flexShrink: 0
        }}
      >
        {/* Back Card Header in Navy Blue with micro green accent */}
        <div className="bg-[#20223E] text-white p-3 pb-2.5 relative border-b-[3px] border-[#91BD32] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="bg-white p-1 rounded-lg shadow-xs flex-shrink-0">
              <img
                src="/logo.svg"
                alt="WE the Leader"
                className="h-7 w-auto object-contain max-w-[80px]"
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
              <div className="text-[8px] font-black text-[#91BD32] tracking-wider uppercase mt-0.5">
                LEAD THE CHANGE
              </div>
              <div className="text-[7px] text-slate-300 font-bold uppercase tracking-wider">
                MEMBERSHIP VERIFICATION
              </div>
            </div>
          </div>
        </div>

        {/* Back Content Area: Functional QR Code & Verification Data */}
        <div className="px-4 py-2.5 flex flex-col items-center flex-1 justify-between text-center overflow-hidden">
          
          {/* Digital Verification Instructions */}
          <div className="space-y-0.5 flex-shrink-0">
            <span className="text-[8.5px] font-black text-[#20223E] tracking-wider uppercase block">
              OFFICIAL DIGITAL VERIFICATION
            </span>
            <span className="text-[7.5px] font-medium text-slate-500 block font-tamil leading-tight">
              உறுப்பினர் விவரங்களைச் சரிபார்க்க QR குறியீட்டை ஸ்கேன் செய்யவும்
            </span>
          </div>

          {/* Functional QR Code Frame with White Quiet Zone */}
          <div className="p-2 bg-white border-2 border-[#20223E] rounded-xl shadow-xs inline-block my-0.5 flex-shrink-0">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt={`Verification QR Code for ${member.membership_number}`}
                className="w-[106px] h-[106px] object-contain"
              />
            ) : (
              <div className="w-[106px] h-[106px] bg-slate-100 flex items-center justify-center text-[8.5px] text-slate-400 font-medium">
                Generating QR...
              </div>
            )}
          </div>

          {/* Membership ID Confirmation below QR */}
          <div className="font-mono text-[10.5px] font-black text-[#20223E] tracking-wider bg-slate-100 px-3 py-0.5 rounded-md border border-slate-200 flex-shrink-0">
            {member.membership_number}
          </div>

          {/* Official Terms & Notice (Proper Tamil Line-height & Non-overlapping glyphs) */}
          <div className="bg-[#F5F7FA] border border-slate-200 rounded-lg p-2 text-left w-full space-y-1 flex-shrink-0">
            <p className="text-[7.5px] text-slate-600 leading-normal">
              &bull; This card confirms active registered membership in <strong className="text-[#20223E]">WE the Leader</strong>, Kinathukadavu. It is non-transferable.
            </p>
            <p className="text-[7.5px] text-slate-600 leading-relaxed font-tamil">
              &bull; இவ்வட்டை <strong className="text-[#20223E]">WE the Leader</strong> அமைப்பின் அதிகாரப்பூர்வ உறுப்பினர் சான்றாகும். மற்றவருக்கு மாற்றத்தக்கதல்ல.
            </p>
          </div>

          {/* Official Contact Info */}
          <div className="text-[7.5px] text-slate-500 space-y-0.5 border-t border-slate-100 pt-1 w-full text-center flex-shrink-0">
            <p className="font-extrabold text-[#20223E] tracking-wide">WE THE LEADER &bull; KINATHUKADAVU</p>
            <p className="text-slate-600">Kinathukadavu, Coimbatore - 642109, Tamil Nadu, India</p>
            <p className="text-[#2878B9] font-bold">www.wetheleader.org</p>
          </div>

        </div>

        {/* Bottom Bar: Center Website matching Front */}
        <div className="bg-[#20223E] text-white px-3 py-1.5 flex items-center justify-center text-[7px] font-bold border-t border-slate-200 flex-shrink-0">
          <span className="text-center text-white font-extrabold tracking-wider lowercase">
            www.wetheleader.online
          </span>
        </div>
      </div>
    );
  }
);
