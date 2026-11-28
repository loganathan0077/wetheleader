import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MemberFormData, Member } from '../types';
import { memberService } from '../services/memberService';
import { isSupabaseConfigured, uploadMemberPhoto } from '../lib/supabase';
import { 
  User, 
  Phone, 
  Calendar, 
  MapPin, 
  Briefcase, 
  Upload,
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Droplet,
  HeartHandshake,
  Sparkles,
  Check,
  Loader2
} from 'lucide-react';
import { compressImageFile, isValidImageFile, formatFileSize } from '../utils/imageCompressor';

interface RegistrationPageProps {
  onSuccess: (member: Member) => void;
  onCancel: () => void;
}

// Structured skill categories matching exact requirements
export const SKILL_CATEGORIES = [
  {
    id: 'media',
    categoryKey: 'skillCatMedia' as const,
    skills: [
      { id: 'Photography', labelKey: 'skillPhotography' as const },
      { id: 'Videography', labelKey: 'skillVideography' as const },
      { id: 'Video Editing', labelKey: 'skillVideoEditing' as const },
      { id: 'Photo Editing', labelKey: 'skillPhotoEditing' as const },
      { id: 'Graphic Designing', labelKey: 'skillGraphicDesigning' as const },
      { id: 'Poster Designing', labelKey: 'skillPosterDesigning' as const },
      { id: 'Social Media Management', labelKey: 'skillSocialMedia' as const },
      { id: 'Content Writing', labelKey: 'skillContentWriting' as const },
      { id: 'Website Development', labelKey: 'skillWebDev' as const },
      { id: 'Digital Marketing', labelKey: 'skillDigitalMarketing' as const },
    ]
  },
  {
    id: 'event',
    categoryKey: 'skillCatEvent' as const,
    skills: [
      { id: 'Event Organisation', labelKey: 'skillEventOrg' as const },
      { id: 'Stage Management', labelKey: 'skillStageMgmt' as const },
      { id: 'Public Speaking', labelKey: 'skillPublicSpeaking' as const },
      { id: 'Anchoring / Hosting', labelKey: 'skillAnchoring' as const },
      { id: 'Sound & Music Management', labelKey: 'skillSoundMusic' as const },
      { id: 'Crowd Coordination', labelKey: 'skillCrowdCoord' as const },
    ]
  },
  {
    id: 'community',
    categoryKey: 'skillCatCommunity' as const,
    skills: [
      { id: 'Tree Plantation', labelKey: 'skillTreePlant' as const },
      { id: 'Environmental Cleaning', labelKey: 'skillEnvClean' as const },
      { id: 'School Activities', labelKey: 'skillSchoolAct' as const },
      { id: 'Women\'s Activities', labelKey: 'skillWomenAct' as const },
      { id: 'Sports Activities', labelKey: 'skillSportsAct' as const },
      { id: 'Blood Donation Camp Coordination', labelKey: 'skillBloodCampCoord' as const },
      { id: 'Community Awareness Programmes', labelKey: 'skillCommAwareness' as const },
    ]
  },
  {
    id: 'professional',
    categoryKey: 'skillCatProfessional' as const,
    skills: [
      { id: 'Teaching', labelKey: 'skillTeaching' as const },
      { id: 'Medical / Healthcare', labelKey: 'skillMedicalHealth' as const },
      { id: 'Legal Knowledge', labelKey: 'skillLegalKnowledge' as const },
      { id: 'Accounting', labelKey: 'skillAccounting' as const },
      { id: 'Electrical Work', labelKey: 'skillElectricalWork' as const },
      { id: 'Driving', labelKey: 'skillDriving' as const },
      { id: 'Translation', labelKey: 'skillTranslation' as const },
      { id: 'Administration', labelKey: 'skillAdministration' as const },
    ]
  }
];

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'] as const;

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ onSuccess }) => {
  const { t, language } = useLanguage();

  const [formData, setFormData] = useState<MemberFormData>({
    full_name: '',
    mobile_number: '',
    date_of_birth: '',
    gender: '',
    address: '',
    district: 'Coimbatore',
    village_name: '',
    street_name: '',
    ward_number: '',
    occupation: '',
    blood_group: '',
    volunteer_willingness: '',
    blood_donation_willingness: '',
    skills: [],
    other_skills: '',
    voter_id_number: '',
    aadhaar_number: '',
    profile_photo_url: '',
    consent_given: true,
  });

  const DRAFT_STORAGE_KEY = 'wtl_registration_form_draft';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoStats, setPhotoStats] = useState<{
    originalSize: string;
    compressedSize: string;
    ratio: number;
  } | null>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Hidden file input for device gallery/files picker
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preserve form draft across mobile app switches or memory reloads
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed, profile_photo_url: '' }));
      }
    } catch {}
  }, []);

  // Save non-sensitive draft on form change
  const saveDraft = (data: MemberFormData) => {
    try {
      const { profile_photo_url, aadhaar_number, voter_id_number, ...safeDraft } = data;
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(safeDraft));
    } catch {}
  };

  // Clean up object URLs on unmount to prevent mobile memory leaks
  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  // Validate form inputs
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // 1. Mandatory Full Name
    if (!formData.full_name || !formData.full_name.trim()) {
      errors.full_name = t('valNameRequired');
    }

    // 2. Mandatory Mobile Number (10 digits validation)
    const cleanMobile = formData.mobile_number.replace(/\D/g, '');
    if (!cleanMobile) {
      errors.mobile_number = t('valMobileRequired');
    } else if (cleanMobile.length !== 10 || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      errors.mobile_number = t('valMobileInvalid');
    }

    // 3. Mandatory Date of Birth (required for dual-factor ID card download & verification)
    if (!formData.date_of_birth || !formData.date_of_birth.trim()) {
      errors.date_of_birth = t('valDobRequired');
    }

    // 4. Mandatory Gender
    if (!formData.gender || !formData.gender.trim()) {
      errors.gender = t('valGenderRequired');
    }

    // 5. Mandatory Village / Town
    if (!formData.village_name || !formData.village_name.trim()) {
      errors.village_name = t('valVillageRequired');
    }

    // 6. Mandatory Street / Area
    if (!formData.street_name || !formData.street_name.trim()) {
      errors.street_name = t('valStreetRequired');
    }

    // 7. Aadhaar Number (if provided, must be 12 digits)
    if (formData.aadhaar_number && formData.aadhaar_number.trim()) {
      const cleanAadhaar = formData.aadhaar_number.replace(/\D/g, '');
      if (cleanAadhaar.length !== 12) {
        errors.aadhaar_number = t('valAadhaarInvalid');
      }
    }

    // 4. Mandatory Consent Checkbox
    if (!formData.consent_given) {
      errors.consent = t('valConsentRequired');
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof MemberFormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      saveDraft(updated);
      return updated;
    });
    // Clear field-specific error when user modifies
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
    if (errorMessage) setErrorMessage(null);
  };

  // Toggle multi-select skill checkbox
  const handleToggleSkill = (skillId: string) => {
    setFormData(prev => {
      const exists = prev.skills.includes(skillId);
      const newSkills = exists 
        ? prev.skills.filter(s => s !== skillId)
        : [...prev.skills, skillId];
      const updated = { ...prev, skills: newSkills };
      saveDraft(updated);
      return updated;
    });
  };

  // Memory-Safe Automatic Client-Side Profile Photo Compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);

    // 1. Validate file format
    if (!isValidImageFile(file)) {
      setPhotoError(t('photoInvalidType'));
      e.target.value = '';
      return;
    }

    setIsCompressingPhoto(true);

    try {
      // Clean up previous blob URL if exists
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }

      // 2. Automatically compress photo to 20-50 KB range, max 600x600 px, keeping aspect ratio
      const result = await compressImageFile(file, {
        maxDimension: 600,
        targetMinKB: 20,
        targetMaxKB: 50,
        minQuality: 0.55, // Preserves face clarity on ID cards
      });

      // 3. Save compressed Blob for direct storage upload & persistent preview
      setPhotoBlob(result.blob);
      setPhotoPreview(result.previewUrl);
      setPhotoDataUrl(result.dataUrl);
      setFormData(prev => ({ ...prev, profile_photo_url: result.dataUrl }));
      setPhotoStats({
        originalSize: formatFileSize(result.originalSizeKB),
        compressedSize: formatFileSize(result.compressedSizeKB),
        ratio: result.compressionRatio,
      });
    } catch (err: any) {
      console.error('Photo compression error:', err);
      setPhotoError(t('photoCompressError'));
    } finally {
      setIsCompressingPhoto(false);
      // Reset input value so selecting the same file again triggers change event
      e.target.value = '';
    }
  };

  const removePhoto = () => {
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoBlob(null);
    setPhotoPreview(null);
    setPhotoDataUrl(null);
    setPhotoStats(null);
    setPhotoError(null);
    setFormData(prev => ({ ...prev, profile_photo_url: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      let finalSubmissionData = { ...formData };

      // Upload photo blob directly to Supabase storage before submitting record
      if (photoBlob && isSupabaseConfigured) {
        setIsUploadingPhoto(true);
        const uploadRes = await uploadMemberPhoto(photoBlob, `member_${Date.now()}.jpg`);
        setIsUploadingPhoto(false);

        if (uploadRes.path) {
          finalSubmissionData.profile_photo_url = uploadRes.path;
        } else if (photoDataUrl) {
          // Resilient fallback: If storage bucket upload had an issue,
          // save the compressed 30KB image data directly so the member's photo is NEVER lost!
          console.warn('Storage upload notice, saving compressed photo directly to record:', uploadRes.error);
          finalSubmissionData.profile_photo_url = photoDataUrl;
        }
      } else if (photoDataUrl) {
        finalSubmissionData.profile_photo_url = photoDataUrl;
      }

      const newMember = await memberService.registerMember(finalSubmissionData, language);

      // Clear draft on successful submission
      try {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {}

      // Preserve persistent photoDataUrl (Base64 JPEG) so RegistrationSuccessPage displays photo immediately without revoked blob issues!
      const memberWithLocalPhoto: Member = {
        ...newMember,
        profile_photo_url: photoDataUrl || newMember.profile_photo_url
      };

      onSuccess(memberWithLocalPhoto);
    } catch (err: any) {
      console.error('Registration submission error:', err);
      if (err.message === 'DUPLICATE_MOBILE') {
        setErrorMessage(t('valDuplicateMobile'));
        setFieldErrors(prev => ({ ...prev, mobile_number: t('valDuplicateMobile') }));
      } else {
        setErrorMessage(
          language === 'ta' 
            ? 'பதிவு செய்யும் போது எதிர்பாராத பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.' 
            : 'An unexpected error occurred during registration. Please try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
      setIsUploadingPhoto(false);
    }
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      
      {/* Page Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-6 text-center">
        <div className="inline-block p-2 bg-white rounded-xl shadow-sm border border-slate-200 mb-3">
          <img 
            src="/logo.svg" 
            alt="WE the Leader" 
            className="h-14 sm:h-16 w-auto object-contain mx-auto"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('we-the-leader-logo.jpg')) {
                target.src = '/we-the-leader-logo.jpg';
              }
            }}
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20223E]">
          {t('regPageTitle')}
        </h1>
        <p className="text-xs sm:text-sm font-bold text-[#91BD32] tracking-wider uppercase mt-1">
          {t('tagline')} &bull; {t('location')}
        </p>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">
          {t('regPageSubtitle')}
        </p>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 animate-fadeIn">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
          <div className="text-sm font-semibold">{errorMessage}</div>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ----------------------------------------------------------------- */}
        {/* SECTION 1: MANDATORY INFORMATION                                  */}
        {/* ----------------------------------------------------------------- */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-[#91BD32]/40 p-5 sm:p-7">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-[#20223E] flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#91BD32]" />
              {t('mandatorySection')}
            </h2>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
              {t('required')}
            </span>
          </div>

          <div className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold text-[#20223E] mb-1.5">
                {t('fullNameLabel')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder={t('fullNamePlaceholder')}
                  className={`w-full pl-11 pr-4 py-3 text-base rounded-xl border bg-[#F5F7FA] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.full_name 
                      ? 'border-red-400 focus:ring-red-300' 
                      : 'border-slate-300 focus:ring-[#91BD32] focus:border-[#91BD32]'
                  }`}
                />
              </div>
              {fieldErrors.full_name && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.full_name}</p>
              )}
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-bold text-[#20223E] mb-1.5">
                {t('mobileLabel')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={formData.mobile_number}
                  onChange={(e) => handleInputChange('mobile_number', e.target.value.replace(/\D/g, ''))}
                  placeholder={t('mobilePlaceholder')}
                  className={`w-full pl-11 pr-4 py-3 text-base font-medium rounded-xl border bg-[#F5F7FA] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.mobile_number 
                      ? 'border-red-400 focus:ring-red-300' 
                      : 'border-slate-300 focus:ring-[#91BD32] focus:border-[#91BD32]'
                  }`}
                />
              </div>
              {fieldErrors.mobile_number && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.mobile_number}</p>
              )}
              <p className="mt-1 text-[11px] text-slate-500">
                {language === 'ta' ? 'எ.கா. 98421XXXXX (10 இலக்கங்கள்)' : 'e.g. 98421XXXXX (10 digits)'}
              </p>
            </div>

            {/* Date of Birth (Mandatory for secure ID download and verification) */}
            <div>
              <label className="block text-sm font-bold text-[#20223E] mb-1.5">
                {t('dobLabel')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <input
                  type="date"
                  required
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 text-base font-medium rounded-xl border bg-[#F5F7FA] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.date_of_birth 
                      ? 'border-red-400 focus:ring-red-300' 
                      : 'border-slate-300 focus:ring-[#91BD32] focus:border-[#91BD32]'
                  }`}
                />
              </div>
              {fieldErrors.date_of_birth && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.date_of_birth}</p>
              )}
              <p className="mt-1 text-[11px] text-slate-500">
                {language === 'ta' 
                  ? 'அடையாள அட்டை பாதுகாப்பு மற்றும் பதிவிறக்க சரிபார்ப்பிற்கு தேவை.' 
                  : 'Required for secure membership verification and ID card download.'}
              </p>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* SECTION 2: PERSONAL INFORMATION                                   */}
        {/* ----------------------------------------------------------------- */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-7 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-[#20223E] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2878B9]" />
              {t('personalInfoSection')}
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {t('optional')}
            </span>
          </div>

          {/* Profile Photo Upload with Automatic Compression */}
          <div>
            <label className="block text-sm font-semibold text-[#20223E] mb-2">
              {t('photoLabel')}
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative flex-shrink-0">
                {isCompressingPhoto ? (
                  <div className="flex flex-col items-center justify-center p-2 text-center animate-pulse">
                    <Loader2 className="w-6 h-6 text-[#91BD32] animate-spin" />
                  </div>
                ) : photoPreview ? (
                  <img src={photoPreview} alt="Profile Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Single Upload Photo Button (Device Gallery / Files) */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressingPhoto || isUploadingPhoto || isSubmitting}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                      isCompressingPhoto 
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-[#20223E] hover:bg-[#2878B9] active:bg-[#1a1b32] text-white'
                    }`}
                  >
                    {isCompressingPhoto ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-[#91BD32]" />
                    )}
                    <span>
                      {isCompressingPhoto 
                        ? t('photoCompressing') 
                        : photoPreview 
                          ? (language === 'ta' ? 'மாற்று' : 'Change Photo') 
                          : t('photoUploadBtn')}
                    </span>
                  </button>

                  {/* Device File Input (Gallery on mobile, file picker on desktop) */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isCompressingPhoto || isUploadingPhoto || isSubmitting}
                    className="hidden"
                  />

                  {photoPreview && !isCompressingPhoto && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="text-xs font-semibold text-red-600 hover:underline px-2 py-1 cursor-pointer"
                    >
                      {t('photoRemoveBtn')}
                    </button>
                  )}
                </div>

                {/* Compressed Size Badge (Showing size before upload) */}
                {photoStats && !isCompressingPhoto && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 animate-fadeIn">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{t('photoCompressedBadge', { size: photoStats.compressedSize })}</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      ({t('photoOriginalBadge', { size: photoStats.originalSize })} &bull; {t('photoSavedBadge', { ratio: photoStats.ratio })})
                    </span>
                  </div>
                )}

                {/* Validation / Compression Error */}
                {photoError && (
                  <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 pt-0.5 animate-fadeIn">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{photoError}</span>
                  </p>
                )}

                <p className="text-[11px] text-slate-500">
                  {t('photoUploadHint')} &bull; Auto-optimized to 20–50 KB for instant loading & clear ID cards.
                </p>
              </div>
            </div>
          </div>

          {/* Gender (MANDATORY FIELD) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('genderLabel')} <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                fieldErrors.gender ? 'border-red-400 bg-red-50/40' : 'border-slate-300 bg-[#F5F7FA]'
              } focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#91BD32]`}
            >
              <option value="">-- {t('genderSelect')} --</option>
              <option value="Male">{t('genderMale')}</option>
              <option value="Female">{t('genderFemale')}</option>
              <option value="Other">{t('genderOther')}</option>
            </select>
            {fieldErrors.gender && (
              <p className="mt-1 text-xs text-red-600 font-semibold flex items-center gap-1 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{fieldErrors.gender}</span>
              </p>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* SECTION 3: ADDRESS INFORMATION                                    */}
        {/* ----------------------------------------------------------------- */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-7 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-[#20223E] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E98A32]" />
              {t('addressSection')}
            </h2>
          </div>

          {/* Village Name & Street Name Grid (Village and Street are MANDATORY) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Village Name (MANDATORY FIELD) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('villageLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.village_name}
                onChange={(e) => handleInputChange('village_name', e.target.value)}
                placeholder={t('villagePlaceholder')}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                  fieldErrors.village_name ? 'border-red-400 bg-red-50/40' : 'border-slate-300 bg-[#F5F7FA]'
                } focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#91BD32]`}
              />
              {fieldErrors.village_name && (
                <p className="mt-1 text-xs text-red-600 font-semibold flex items-center gap-1 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.village_name}</span>
                </p>
              )}
              <p className="mt-1 text-[10px] text-slate-400">
                {language === 'ta' ? 'தமிழ் அல்லது ஆங்கிலத்தில் எழுதலாம்' : 'Supports Tamil and English input'}
              </p>
            </div>

            {/* Street Name (MANDATORY FIELD) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('streetLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.street_name}
                onChange={(e) => handleInputChange('street_name', e.target.value)}
                placeholder={t('streetPlaceholder')}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                  fieldErrors.street_name ? 'border-red-400 bg-red-50/40' : 'border-slate-300 bg-[#F5F7FA]'
                } focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#91BD32]`}
              />
              {fieldErrors.street_name && (
                <p className="mt-1 text-xs text-red-600 font-semibold flex items-center gap-1 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.street_name}</span>
                </p>
              )}
              <p className="mt-1 text-[10px] text-slate-400">
                {language === 'ta' ? 'தெரு அல்லது பகுதி பெயர்' : 'Separate street / locality field'}
              </p>
            </div>
          </div>

          {/* Ward Number & District Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ward Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('wardLabel')}
              </label>
              <input
                type="text"
                value={formData.ward_number}
                onChange={(e) => handleInputChange('ward_number', e.target.value)}
                placeholder={t('wardPlaceholder')}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-[#F5F7FA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#91BD32]"
              />
            </div>

            {/* District (fixed to Coimbatore) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('districtLabel')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={t('defaultDistrict')}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-100 text-slate-600 font-semibold cursor-not-allowed"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
                  (Fixed)
                </div>
              </div>
            </div>
          </div>

          {/* Residential Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('addressLabel')}
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder={t('addressPlaceholder')}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-[#F5F7FA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#91BD32]"
            />
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* SECTION 4: ADDITIONAL INFORMATION                                 */}
        {/* ----------------------------------------------------------------- */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-7 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-[#20223E] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#91BD32]" />
              {t('additionalInfoSection')}
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {t('optional')}
            </span>
          </div>

          {/* Blood Group & Occupation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Blood Group Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('bloodGroupLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-red-500">
                  <Droplet className="w-4 h-4" />
                </div>
                <select
                  value={formData.blood_group}
                  onChange={(e) => handleInputChange('blood_group', e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-[#F5F7FA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#91BD32]"
                >
                  <option value="">-- {t('bloodGroupSelect')} --</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg === 'Unknown' ? t('bloodGroupUnknown') : bg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Occupation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('occupationLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  placeholder={t('occupationPlaceholder')}
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-[#F5F7FA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#91BD32]"
                />
              </div>
            </div>
          </div>

          {/* Voter ID & Aadhaar (Protected Optional Fields) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <Lock className="w-3.5 h-3.5 text-[#2878B9]" />
              <span>{language === 'ta' ? 'பாதுகாக்கப்பட்ட அடையாள ஆவணங்கள் (விருப்பத்தேர்வு)' : 'Protected Identification (Optional)'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Voter ID */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {t('voterIdLabel')}
                </label>
                <input
                  type="text"
                  value={formData.voter_id_number}
                  onChange={(e) => handleInputChange('voter_id_number', e.target.value.toUpperCase())}
                  placeholder={t('voterIdPlaceholder')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#91BD32]"
                />
              </div>

              {/* Aadhaar */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {t('aadhaarLabel')}
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={formData.aadhaar_number}
                  onChange={(e) => handleInputChange('aadhaar_number', e.target.value.replace(/\D/g, ''))}
                  placeholder={t('aadhaarPlaceholder')}
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-white focus:outline-none focus:ring-2 ${
                    fieldErrors.aadhaar_number ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:ring-[#91BD32]'
                  }`}
                />
                {fieldErrors.aadhaar_number && (
                  <p className="mt-1 text-[10px] text-red-600 font-medium">{fieldErrors.aadhaar_number}</p>
                )}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              {language === 'ta' 
                ? 'ஆதார் மற்றும் வாக்காளர் அட்டை எண்கள் விருப்பத்தேர்வுக்குரியவை, பாதுகாப்பாக வைக்கப்படும் மற்றும் பொது சுயவிவரங்களில் வெளியிடப்படாது.' 
                : 'Aadhaar and Voter ID numbers are strictly optional, securely encrypted, and never exposed publicly.'}
            </p>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* SECTION 5: VOLUNTEER PARTICIPATION & COMMUNITY ENGAGEMENT         */}
        {/* ----------------------------------------------------------------- */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-7 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-[#20223E] flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-[#91BD32]" />
              {t('volunteerSectionTitle')}
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {t('optional')}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            {t('volunteerSectionSubtitle')}
          </p>

          <div className="space-y-5">
            {/* Question 1: Volunteer Participation */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-2">
                {t('volunteerWillingnessLabel')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { value: 'Yes, I am interested.', label: t('volunteerOptYes'), color: 'hover:border-[#91BD32]' },
                  { value: 'Maybe, depending on the activity.', label: t('volunteerOptMaybe'), color: 'hover:border-blue-400' },
                  { value: 'No, not currently.', label: t('volunteerOptNo'), color: 'hover:border-slate-400' },
                ].map((opt) => {
                  const isSelected = formData.volunteer_willingness === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-[#91BD32] bg-[#91BD32]/10 font-bold text-[#20223E] shadow-xs' 
                          : `border-slate-200 bg-[#F5F7FA] text-slate-700 ${opt.color}`
                      }`}
                    >
                      <input
                        type="radio"
                        name="volunteer_willingness"
                        value={opt.value}
                        checked={isSelected}
                        onChange={() => handleInputChange('volunteer_willingness', opt.value)}
                        className="mt-0.5 text-[#91BD32] focus:ring-[#91BD32]"
                      />
                      <span className="text-xs leading-snug">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Question 2: Blood Donation Willingness */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{t('bloodDonationLabel')}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { value: 'Yes, I am willing.', label: t('bloodDonationOptYes'), color: 'hover:border-red-400' },
                  { value: 'Maybe in the future.', label: t('bloodDonationOptMaybe'), color: 'hover:border-amber-400' },
                  { value: 'No.', label: t('bloodDonationOptNo'), color: 'hover:border-slate-400' },
                ].map((opt) => {
                  const isSelected = formData.blood_donation_willingness === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-red-400 bg-red-50 font-bold text-[#20223E] shadow-xs' 
                          : `border-slate-200 bg-[#F5F7FA] text-slate-700 ${opt.color}`
                      }`}
                    >
                      <input
                        type="radio"
                        name="blood_donation_willingness"
                        value={opt.value}
                        checked={isSelected}
                        onChange={() => handleInputChange('blood_donation_willingness', opt.value)}
                        className="mt-0.5 text-red-500 focus:ring-red-400"
                      />
                      <span className="text-xs leading-snug">{opt.label}</span>
                    </label>
                  );
                })}
              </div>

              {/* Medical Eligibility Disclaimer */}
              <div className="mt-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
                {t('bloodDonationDisclaimer')}
              </div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* SECTION 6: SKILLS & HOBBIES                                       */}
        {/* ----------------------------------------------------------------- */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-7 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-[#20223E] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#2878B9]" />
                {t('skillsSectionTitle')}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {t('skillsSectionSubtitle')}
              </p>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {t('optional')}
            </span>
          </div>

          {/* Categorized Checkbox Grid */}
          <div className="space-y-5">
            {SKILL_CATEGORIES.map((category) => (
              <div key={category.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#20223E] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#91BD32]" />
                  {t(category.categoryKey)}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {category.skills.map((skill) => {
                    const isChecked = formData.skills.includes(skill.id);
                    return (
                      <label
                        key={skill.id}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked 
                            ? 'bg-[#91BD32]/15 border-[#91BD32] text-[#20223E] font-semibold' 
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSkill(skill.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[#91BD32] focus:ring-[#91BD32] accent-[#91BD32] cursor-pointer"
                        />
                        <span className="flex-1 select-none">{t(skill.labelKey)}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-[#91BD32] flex-shrink-0" />}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Other Skills Free-text Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t('otherSkillsLabel')}
            </label>
            <input
              type="text"
              value={formData.other_skills}
              onChange={(e) => handleInputChange('other_skills', e.target.value)}
              placeholder={t('otherSkillsPlaceholder')}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-[#F5F7FA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#91BD32]"
            />
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* SECTION 7: CONSENT CHECKBOX                                       */}
        {/* ----------------------------------------------------------------- */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.consent_given}
              onChange={(e) => handleInputChange('consent_given', e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-slate-300 text-[#91BD32] focus:ring-[#91BD32] accent-[#91BD32] cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-slate-700 leading-snug">
              {t('consentText')}
            </span>
          </label>
          {fieldErrors.consent && (
            <p className="mt-2 text-xs text-red-600 font-semibold">{fieldErrors.consent}</p>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || isCompressingPhoto || isUploadingPhoto}
            className="w-full py-4 rounded-xl bg-[#91BD32] hover:bg-[#80a82b] disabled:bg-slate-300 text-[#20223E] font-black text-lg tracking-wide shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed"
          >
            {isUploadingPhoto ? (
              <>
                <div className="w-6 h-6 border-3 border-[#20223E] border-t-transparent rounded-full animate-spin" />
                <span>{t('photoUploading')}</span>
              </>
            ) : isSubmitting ? (
              <>
                <div className="w-6 h-6 border-3 border-[#20223E] border-t-transparent rounded-full animate-spin" />
                <span>{t('submittingBtn')}</span>
              </>
            ) : isCompressingPhoto ? (
              <>
                <div className="w-6 h-6 border-3 border-[#20223E] border-t-transparent rounded-full animate-spin" />
                <span>{t('photoCompressing')}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-6 h-6" />
                <span>{t('submitBtn')}</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
