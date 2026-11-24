import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MemberFormData, Member } from '../types';
import { memberService } from '../services/memberService';
import { 
  User, 
  Phone, 
  Calendar, 
  MapPin, 
  Briefcase, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface RegistrationPageProps {
  onSuccess: (member: Member) => void;
  onCancel: () => void;
}

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ onSuccess, onCancel }) => {
  const { t, language } = useLanguage();

  const [formData, setFormData] = useState<MemberFormData>({
    full_name: '',
    mobile_number: '',
    date_of_birth: '',
    gender: '',
    address: '',
    district: 'Coimbatore',
    village_name: '',
    ward_number: '',
    occupation: '',
    voter_id_number: '',
    aadhaar_number: '',
    profile_photo_url: '',
    consent_given: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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

    // 3. Aadhaar Number (if provided, must be 12 digits)
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
    setFormData(prev => ({ ...prev, [field]: value }));
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

  // Profile Photo Upload handling
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage(language === 'ta' ? 'படத்தின் அளவு 5MB க்கும் குறைவாக இருக்க வேண்டும்.' : 'Photo size must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoPreview(base64);
        setFormData(prev => ({ ...prev, profile_photo_url: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setFormData(prev => ({ ...prev, profile_photo_url: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) {
      // Scroll to top of error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const newMember = await memberService.registerMember(formData, language);
      onSuccess(newMember);
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
        
        {/* SECTION 1: MANDATORY FIELDS */}
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
          </div>
        </div>

        {/* SECTION 2: OPTIONAL FIELDS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-7 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-[#20223E] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2878B9]" />
              {t('optionalSection')}
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {t('optional')}
            </span>
          </div>

          {/* Profile Photo Upload */}
          <div>
            <label className="block text-sm font-semibold text-[#20223E] mb-2">
              {t('photoLabel')}
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#20223E] text-xs font-bold cursor-pointer transition-colors">
                  <Camera className="w-4 h-4 text-[#2878B9]" />
                  <span>{photoPreview ? (language === 'ta' ? 'மாற்று' : 'Change Photo') : t('photoUploadBtn')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="ml-2 text-xs font-semibold text-red-600 hover:underline"
                  >
                    {t('photoRemoveBtn')}
                  </button>
                )}
                <p className="text-[11px] text-slate-500">
                  {t('photoUploadHint')}
                </p>
              </div>
            </div>
          </div>

          {/* Date of Birth & Gender Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('dobLabel')}
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-[#F5F7FA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#91BD32]"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('genderLabel')}
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-[#F5F7FA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#91BD32]"
              >
                <option value="">-- {t('genderSelect')} --</option>
                <option value="Male">{t('genderMale')}</option>
                <option value="Female">{t('genderFemale')}</option>
                <option value="Other">{t('genderOther')}</option>
                <option value="Prefer not to say">{t('genderPreferNot')}</option>
              </select>
            </div>
          </div>

          {/* Village Name & Ward Number Grid (Direct Free Text as requested!) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Village Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('villageLabel')}
              </label>
              <input
                type="text"
                value={formData.village_name}
                onChange={(e) => handleInputChange('village_name', e.target.value)}
                placeholder={t('villagePlaceholder')}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-[#F5F7FA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#91BD32]"
              />
              <p className="mt-1 text-[10px] text-slate-400">
                {language === 'ta' ? 'தமிழ் அல்லது ஆங்கிலத்தில் எழுதலாம்' : 'Enter village name in English or Tamil'}
              </p>
            </div>

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
          </div>

          {/* District (Defaulted to Coimbatore, displayed as Coimbatore) */}
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
                ? 'ஆதார் மற்றும் வாக்காளர் அட்டை எண்கள் விருப்பத்தேர்வுக்குரியவை மற்றும் பாதுகாப்பாக வைக்கப்படும்.' 
                : 'Aadhaar and Voter ID numbers are strictly optional, protected, and will never be shared publicly.'}
            </p>
          </div>

        </div>

        {/* SECTION 3: CONSENT CHECKBOX */}
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
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl bg-[#91BD32] hover:bg-[#80a82b] disabled:bg-slate-300 text-[#20223E] font-black text-lg tracking-wide shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-6 h-6 border-3 border-[#20223E] border-t-transparent rounded-full animate-spin" />
                <span>{t('submittingBtn')}</span>
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
