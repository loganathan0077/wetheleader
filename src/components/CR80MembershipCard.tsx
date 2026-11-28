import React, { forwardRef, useState, useEffect } from 'react';
import { Member } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { MapPin } from 'lucide-react';
import { getMemberPhotoSignedUrl, supabase } from '../lib/supabase';

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

    const rawPhoto = (member.profile_photo_url || (member as any).photo_path || '').trim();
    const hasPhotoUploaded = Boolean(
      rawPhoto && 
      rawPhoto !== 'null' && 
      rawPhoto !== 'undefined' && 
      rawPhoto !== '""' &&
      !rawPhoto.includes('/logo.svg') &&
      !rawPhoto.includes('we-the-leader-logo')
    );

    const isDirectUrl = hasPhotoUploaded && (
      rawPhoto.startsWith('data:') || 
      rawPhoto.startsWith('blob:') || 
      rawPhoto.includes('token=')
    );

    const [photoUrl, setPhotoUrl] = useState<string | null>(isDirectUrl ? rawPhoto : null);
    const [photoError, setPhotoError] = useState(false);

    useEffect(() => {
      if (!hasPhotoUploaded) {
        setPhotoUrl(null);
        setPhotoError(false);
        return;
      }

      if (rawPhoto.startsWith('data:') || rawPhoto.startsWith('blob:') || rawPhoto.includes('token=')) {
        setPhotoUrl(rawPhoto);
        setPhotoError(false);
        return;
      }

      // Resolve display URL (Blob URL, signed URL, or public URL)
      let isMounted = true;
      getMemberPhotoSignedUrl(rawPhoto).then(resolvedUrl => {
        if (!isMounted) return;
        if (resolvedUrl) {
          setPhotoUrl(resolvedUrl);
          setPhotoError(false);
        } else {
          console.warn('Could not resolve photo URL for storage path:', rawPhoto);
          setPhotoError(true);
        }
      }).catch((err) => {
        if (!isMounted) return;
        console.warn('Error resolving photo URL:', err);
        setPhotoError(true);
      });

      return () => {
        isMounted = false;
      };
    }, [rawPhoto, hasPhotoUploaded]);

    // Fallback handler if <img src={photoUrl}> triggers onError
    const handleImageError = async () => {
      // If photo failed to load and was not already a blob URL, try downloading directly as blob
      if (hasPhotoUploaded && !photoUrl?.startsWith('blob:') && supabase) {
        try {
          let cleanPath = rawPhoto;
          if (cleanPath.includes('/member-photos/')) {
            cleanPath = cleanPath.split('/member-photos/').pop() || cleanPath;
          }
          cleanPath = cleanPath.replace(/^\/?(member-photos\/)+/, '').replace(/^\/+/, '').split('?')[0];
          const { data: blob } = await supabase.storage.from('member-photos').download(cleanPath);
          if (blob && blob.size > 0) {
            const blobUrl = URL.createObjectURL(blob);
            setPhotoUrl(blobUrl);
            setPhotoError(false);
            return;
          }
        } catch {}
      }
      setPhotoError(true);
    };

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
            flexShrink: 0,
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact'
          }}
        >
          {/* Card Header in Navy Blue with micro green accent */}
          <div
            className="bg-[#20223E] text-white px-3 py-2 relative border-b-[3px] border-[#91BD32] flex-shrink-0"
            style={{ backgroundColor: '#20223E', borderBottom: '3px solid #91BD32' }}
          >
            <div className="flex items-center justify-between">
              
              {/* Logo in clean white container */}
              <div className="bg-white p-1 rounded-lg shadow-xs flex-shrink-0">
                <img
                  src="/logo.svg"
                  alt="WE the Leader"
                  className="h-6.5 w-auto object-contain max-w-[76px]"
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
                <div className="text-[11.5px] font-black tracking-tight leading-tight text-white uppercase">
                  WE THE LEADER
                </div>
                <div className="text-[7.5px] font-black text-[#91BD32] tracking-wider uppercase mt-0.5" style={{ color: '#91BD32' }}>
                  LEAD THE CHANGE
                </div>
                <div className="text-[6.5px] text-slate-300 font-bold uppercase tracking-wider flex items-center justify-end gap-0.5 mt-0.5">
                  <MapPin className="w-2.5 h-2.5 text-[#E98A32]" />
                  <span>KINATHUKADAVU | COIMBATORE</span>
                </div>
              </div>

            </div>
          </div>

          {/* Member Identity Body (Evenly Distributed, Generous Margins, Zero Clipping) */}
          <div className="px-3.5 pt-2 pb-3.5 flex flex-col items-center flex-1 justify-between text-center">
            
            {/* Photo Frame (Passport proportion 84 × 98 px) */}
            <div
              className="w-[84px] h-[98px] rounded-xl border-[2.5px] border-[#91BD32] p-0.5 bg-white shadow-xs overflow-hidden relative flex items-center justify-center flex-shrink-0"
              style={{ width: '84px', height: '98px', maxWidth: '84px', maxHeight: '98px', flexShrink: 0 }}
            >
              {hasPhotoUploaded && photoUrl && !photoError ? (
                <img
                  src={photoUrl}
                  alt=""
                  loading="eager"
                  onError={() => {
                    console.warn('Member photo failed to load on card, switching to official logo fallback:', photoUrl);
                    setPhotoError(true);
                  }}
                  className="w-full h-full object-cover rounded-[8px]"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                /* PHOTO FALLBACK: Official logo on clean background. NEVER broken or empty avatar */
                <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-1.5 rounded-[8px] text-center">
                  <img
                    src="/logo.svg"
                    alt="WE the Leader Official"
                    className="w-11 h-auto object-contain max-h-[44px] mb-1"
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

            {/* Status Pill (Vertically Centered Text, No Glyph Clipping) */}
            <div className="inline-flex items-center justify-center gap-1.5 px-3 h-[22px] rounded-full bg-emerald-50 border border-emerald-300 text-[#20223E] text-[7.5px] font-extrabold uppercase shadow-xs flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#91BD32] flex-shrink-0" style={{ backgroundColor: '#91BD32' }} />
              <span className="tracking-wide leading-none flex items-center">ACTIVE MEMBER</span>
              <span className="text-slate-400 font-normal leading-none flex items-center">•</span>
              <span className="font-tamil font-bold text-emerald-900 leading-none flex items-center">அதிகாரப்பூர்வ உறுப்பினர்</span>
            </div>

            {/* Member Name Layout: Line 1 = Tamil Name (Bold, larger), Line 2 = English Name (Medium, directly below) */}
            <div className="w-full flex flex-col items-center justify-center px-1 min-h-[30px] flex-shrink-0">
              {parsedName.tamilName && parsedName.englishName ? (
                <>
                  {/* Line 1: Tamil Name */}
                  <div
                    className={`${tamilFontSize} font-black text-[#20223E] font-tamil text-center leading-normal max-w-[280px] break-words`}
                    title={parsedName.tamilName}
                  >
                    {parsedName.tamilName}
                  </div>
                  {/* Line 2: English Name directly below (Medium weight, NO parentheses) */}
                  <div
                    className={`${englishFontSize} font-medium text-slate-700 text-center leading-normal max-w-[280px] break-words tracking-wide`}
                    title={parsedName.englishName}
                  >
                    {parsedName.englishName}
                  </div>
                </>
              ) : parsedName.tamilName ? (
                <div
                  className={`${tamilFontSize} font-black text-[#20223E] font-tamil text-center leading-normal max-w-[280px] break-words`}
                  title={parsedName.tamilName}
                >
                  {parsedName.tamilName}
                </div>
              ) : (
                <div
                  className={`${singleFontSize} font-bold text-[#20223E] text-center leading-normal max-w-[280px] break-words`}
                  title={parsedName.singleName || member.full_name}
                >
                  {parsedName.singleName || member.full_name}
                </div>
              )}
            </div>

            {/* Membership Number Box (Vertically Centered) */}
            <div className="w-full bg-[#F5F7FA] border border-slate-200 rounded-lg py-1.5 px-2.5 flex flex-col items-center justify-center text-center shadow-xs flex-shrink-0 min-h-[38px]">
              <span className="text-[7px] font-extrabold text-slate-500 uppercase tracking-widest block font-tamil leading-tight">
                MEMBERSHIP ID / உறுப்பினர் எண்
              </span>
              <span className="text-[13px] font-black text-[#20223E] font-mono tracking-wider block mt-0.5 leading-none">
                {member.membership_number}
              </span>
            </div>

            {/* Member Details Panel (Village, Ward, District, Date) - Unclipped Two-Column Layout */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 text-left flex-shrink-0 shadow-xs">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {/* Village */}
                <div className="flex flex-col justify-start">
                  <span className="text-[7.5px] font-extrabold text-slate-500 uppercase block font-tamil leading-tight tracking-tight">
                    VILLAGE / கிராமம்
                  </span>
                  <span
                    className="font-black text-[#20223E] text-[9.5px] block leading-tight tracking-tight mt-0.5"
                    title={member.village_name || 'Kinathukadavu'}
                  >
                    {member.village_name || 'Kinathukadavu'}
                  </span>
                </div>

                {/* Ward */}
                <div className="flex flex-col justify-start">
                  <span className="text-[7.5px] font-extrabold text-slate-500 uppercase block font-tamil leading-tight tracking-tight">
                    WARD / வார்டு
                  </span>
                  <span className="font-black text-[#20223E] text-[9.5px] block leading-tight tracking-tight mt-0.5">
                    {member.ward_number ? `Ward ${member.ward_number}` : '-'}
                  </span>
                </div>

                {/* District */}
                <div className="flex flex-col justify-start">
                  <span className="text-[7.5px] font-extrabold text-slate-500 uppercase block font-tamil leading-tight tracking-tight">
                    DISTRICT / மாவட்டம்
                  </span>
                  <span className="font-black text-[#20223E] text-[9.5px] block leading-tight tracking-tight mt-0.5">
                    {member.district || 'Coimbatore'}
                  </span>
                </div>

                {/* Issued Date */}
                <div className="flex flex-col justify-start">
                  <span className="text-[7.5px] font-extrabold text-slate-500 uppercase block font-tamil leading-tight tracking-tight">
                    ISSUED / பதிவு தேதி
                  </span>
                  <span className="font-black text-[#20223E] text-[9.5px] block leading-tight tracking-tight mt-0.5">
                    {formattedDate}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Footer: Center Website with Visible Bottom Padding */}
          <div
            className="bg-[#20223E] text-white px-3 h-[26px] flex items-center justify-center text-[8px] font-extrabold border-t border-slate-200 flex-shrink-0"
            style={{ backgroundColor: '#20223E', height: '26px' }}
          >
            <span className="text-center text-white font-extrabold tracking-wider lowercase leading-none">
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
          flexShrink: 0,
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact'
        }}
      >
        {/* Back Card Header in Navy Blue with micro green accent */}
        <div
          className="bg-[#20223E] text-white px-3 py-2 relative border-b-[3px] border-[#91BD32] flex-shrink-0"
          style={{ backgroundColor: '#20223E', borderBottom: '3px solid #91BD32' }}
        >
          <div className="flex items-center justify-between">
            <div className="bg-white p-1 rounded-lg shadow-xs flex-shrink-0">
              <img
                src="/logo.svg"
                alt="WE the Leader"
                className="h-6.5 w-auto object-contain max-w-[76px]"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('we-the-leader-logo.jpg')) {
                    target.src = '/we-the-leader-logo.jpg';
                  }
                }}
              />
            </div>
            <div className="text-right flex-1 pl-2">
              <div className="text-[11.5px] font-black tracking-tight leading-tight text-white uppercase">
                WE THE LEADER
              </div>
              <div className="text-[7.5px] font-black text-[#91BD32] tracking-wider uppercase mt-0.5" style={{ color: '#91BD32' }}>
                LEAD THE CHANGE
              </div>
              <div className="text-[6.5px] text-slate-300 font-bold uppercase tracking-wider">
                MEMBERSHIP VERIFICATION
              </div>
            </div>
          </div>
        </div>

        {/* Back Content Area: Functional QR Code & Verification Data */}
        <div className="px-3.5 pt-2 pb-3.5 flex flex-col items-center flex-1 justify-between text-center">
          
          {/* Digital Verification Instructions */}
          <div className="space-y-0.5 flex-shrink-0">
            <span className="text-[8.5px] font-black text-[#20223E] tracking-wider uppercase block leading-tight">
              OFFICIAL DIGITAL VERIFICATION
            </span>
            <span className="text-[7.5px] font-medium text-slate-500 block font-tamil leading-tight">
              உறுப்பினர் விவரங்களைச் சரிபார்க்க QR குறியீட்டை ஸ்கேன் செய்யவும்
            </span>
          </div>

          {/* Functional QR Code Frame with White Quiet Zone */}
          <div
            className="p-2 bg-white border-2 border-[#20223E] rounded-xl shadow-xs flex items-center justify-center my-0.5 flex-shrink-0"
            style={{ width: '112px', height: '112px', boxSizing: 'border-box', flexShrink: 0 }}
          >
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt={`Verification QR Code for ${member.membership_number}`}
                className="w-[94px] h-[94px] object-contain"
                style={{ width: '94px', height: '94px', objectFit: 'contain' }}
              />
            ) : (
              <div className="w-[94px] h-[94px] bg-slate-100 flex items-center justify-center text-[8.5px] text-slate-400 font-medium">
                Generating QR...
              </div>
            )}
          </div>

          {/* Membership ID Confirmation below QR - Vertically Centered & Unclipped */}
          <div className="font-mono text-[11px] font-black text-[#20223E] tracking-wider bg-slate-100 px-4 h-[26px] rounded-md border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-xs">
            <span className="leading-none">{member.membership_number}</span>
          </div>

          {/* Official Terms & Notice */}
          <div className="bg-[#F5F7FA] border border-slate-200 rounded-lg p-2 text-left w-full space-y-1 flex-shrink-0">
            <p className="text-[7.5px] text-slate-600 leading-normal">
              &bull; This card confirms active registered membership in <strong className="text-[#20223E]">WE the Leader</strong>, Kinathukadavu. It is non-transferable.
            </p>
            <p className="text-[7.5px] text-slate-600 leading-normal font-tamil">
              &bull; இவ்வட்டை <strong className="text-[#20223E]">WE the Leader</strong> அமைப்பின் அதிகாரப்பூர்வ உறுப்பினர் சான்றாகும். மற்றவருக்கு மாற்றத்தக்கதல்ல.
            </p>
          </div>

          {/* Official Contact Info */}
          <div className="text-[7.5px] text-slate-500 space-y-0.5 border-t border-slate-100 pt-1.5 w-full text-center flex-shrink-0">
            <p className="font-extrabold text-[#20223E] tracking-wide leading-tight">WE THE LEADER &bull; KINATHUKADAVU</p>
            <p className="text-slate-600 leading-tight">Kinathukadavu, Coimbatore - 642109, Tamil Nadu, India</p>
            <p className="text-[#2878B9] font-bold leading-tight">www.wetheleader.org</p>
          </div>

        </div>

        {/* Bottom Bar: Center Website matching Front */}
        <div
          className="bg-[#20223E] text-white px-3 h-[26px] flex items-center justify-center text-[8px] font-extrabold border-t border-slate-200 flex-shrink-0"
          style={{ backgroundColor: '#20223E', height: '26px' }}
        >
          <span className="text-center text-white font-extrabold tracking-wider lowercase leading-none">
            www.wetheleader.online
          </span>
        </div>
      </div>
    );
  }
);
