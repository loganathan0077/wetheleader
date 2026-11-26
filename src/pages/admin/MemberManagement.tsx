import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Member, MemberFormData } from '../../types';
import { memberService } from '../../services/memberService';
import { CR80MembershipCard } from '../../components/CR80MembershipCard';
import { exportCardPdf } from '../../utils/idCardExport';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  UserPlus, 
  Eye, 
  Edit, 
  Trash2, 
  Phone, 
  MapPin, 
  X, 
  Check, 
  Lock, 
  AlertTriangle,
  User,
  Calendar,
  Briefcase,
  Printer,
  FileText,
  CreditCard,
  Sparkles,
  Download,
  Info
} from 'lucide-react';

interface MemberManagementProps {
  selectedMemberForDetail?: Member | null;
  onClearDetail?: () => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({ selectedMemberForDetail, onClearDetail }) => {
  const { t, language } = useLanguage();
  const isTamil = language === 'ta';
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedStreet, setSelectedStreet] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals state
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Print ID Card Modal State
  const [printingMember, setPrintingMember] = useState<Member | null>(null);
  const [printCardSide, setPrintCardSide] = useState<'both' | 'front' | 'back'>('both');
  const [printQrCodeUrl, setPrintQrCodeUrl] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);

  // Edit / Add Form State
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
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await memberService.getAllMembers();
      setMembers(data);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (selectedMemberForDetail) {
      setViewingMember(selectedMemberForDetail);
    }
  }, [selectedMemberForDetail]);

  // Generate functional verification QR code whenever a member is selected for printing
  useEffect(() => {
    if (printingMember) {
      const verifyUrl = `${window.location.origin}/?verify=${encodeURIComponent(printingMember.membership_number)}`;
      QRCode.toDataURL(verifyUrl, {
        width: 300,
        margin: 1,
        color: {
          dark: '#20223E',
          light: '#FFFFFF'
        }
      }).then(url => {
        setPrintQrCodeUrl(url);
      }).catch(err => {
        console.error('QR code generation error:', err);
      });
    } else {
      setPrintQrCodeUrl('');
      setPrintCardSide('both');
    }
  }, [printingMember]);

  // Extract distinct dynamic options for village directly from member records
  const distinctVillages = useMemo(() => {
    const set = new Set<string>();
    members.forEach(m => {
      if (m.village_name && m.village_name.trim()) set.add(m.village_name.trim());
    });
    return Array.from(set).sort();
  }, [members]);

  // Extract distinct dynamic options for street, filtered by selectedVillage when one is picked
  const availableStreets = useMemo(() => {
    const set = new Set<string>();
    members.forEach(m => {
      if (selectedVillage && m.village_name?.trim() !== selectedVillage) return;
      if (m.street_name && m.street_name.trim()) set.add(m.street_name.trim());
    });
    return Array.from(set).sort();
  }, [members, selectedVillage]);

  // Handle Village change with cascading Street reset
  const handleVillageChange = (val: string) => {
    setSelectedVillage(val);
    if (val && selectedStreet) {
      const stillValid = members.some(m => m.village_name?.trim() === val && m.street_name?.trim() === selectedStreet);
      if (!stillValid) {
        setSelectedStreet('');
      }
    }
  };

  const distinctWards = useMemo(() => {
    const set = new Set<string>();
    members.forEach(m => {
      if (m.ward_number && m.ward_number.trim()) set.add(m.ward_number.trim());
    });
    return Array.from(set).sort();
  }, [members]);

  const distinctYears = useMemo(() => {
    const set = new Set<string>();
    members.forEach(m => {
      if (m.registration_date) {
        const yr = new Date(m.registration_date).getFullYear().toString();
        set.add(yr);
      }
    });
    return Array.from(set).sort().reverse();
  }, [members]);

  // Filtered members calculation supporting Full Name, Mobile, ID, Village, Street Name, and filters
  const filteredMembers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return members.filter(m => {
      // 1. Global search (supports Full Name, Mobile, ID, Village, and Street Name in Tamil/English)
      if (query) {
        const matchName = m.full_name?.toLowerCase().includes(query);
        const matchMobile = m.mobile_number?.includes(query);
        const matchId = m.membership_number?.toLowerCase().includes(query);
        const matchVillage = m.village_name?.toLowerCase().includes(query);
        const matchStreet = m.street_name?.toLowerCase().includes(query);
        if (!matchName && !matchMobile && !matchId && !matchVillage && !matchStreet) return false;
      }

      // 2. Village filter
      if (selectedVillage && m.village_name?.trim() !== selectedVillage) return false;

      // 3. Street filter
      if (selectedStreet && m.street_name?.trim() !== selectedStreet) return false;

      // 4. Ward filter
      if (selectedWard && m.ward_number?.trim() !== selectedWard) return false;

      // 5. District filter
      if (selectedDistrict && m.district !== selectedDistrict) return false;

      // 6. Year filter
      if (selectedYear) {
        const regYear = new Date(m.registration_date).getFullYear().toString();
        if (regYear !== selectedYear) return false;
      }

      // 7. Date range filter
      if (dateFrom) {
        const regDateStr = m.registration_date ? m.registration_date.split('T')[0] : '';
        if (regDateStr < dateFrom) return false;
      }
      if (dateTo) {
        const regDateStr = m.registration_date ? m.registration_date.split('T')[0] : '';
        if (regDateStr > dateTo) return false;
      }

      return true;
    });
  }, [
    members, 
    searchTerm, 
    selectedVillage, 
    selectedStreet, 
    selectedWard, 
    selectedDistrict, 
    selectedYear, 
    dateFrom, 
    dateTo
  ]);

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedVillage('');
    setSelectedStreet('');
    setSelectedWard('');
    setSelectedDistrict('');
    setSelectedYear('');
    setDateFrom('');
    setDateTo('');
  };

  // Open Edit Modal
  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setFormData({
      full_name: m.full_name || '',
      mobile_number: m.mobile_number || '',
      date_of_birth: m.date_of_birth ? m.date_of_birth.split('T')[0] : '',
      gender: m.gender || '',
      address: m.address || '',
      district: m.district || 'Coimbatore',
      village_name: m.village_name || '',
      street_name: m.street_name || '',
      ward_number: m.ward_number || '',
      occupation: m.occupation || '',
      blood_group: m.blood_group || '',
      volunteer_willingness: m.volunteer_willingness || '',
      blood_donation_willingness: m.blood_donation_willingness || '',
      skills: Array.isArray(m.skills) ? [...m.skills] : [],
      other_skills: m.other_skills || '',
      voter_id_number: m.voter_id_number || '',
      aadhaar_number: m.aadhaar_number || '',
      profile_photo_url: m.profile_photo_url || '',
      consent_given: m.consent_given ?? true,
    });
    setFormError(null);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setIsAddModalOpen(true);
    setFormData({
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
    setFormError(null);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setFormSaving(true);
    setFormError(null);

    try {
      // Validate mobile duplicate excluding current
      const exists = await memberService.checkMobileExists(formData.mobile_number, editingMember.id);
      if (exists) {
        setFormError(t('valDuplicateMobile'));
        setFormSaving(false);
        return;
      }

      await memberService.updateMember(editingMember.id, {
        full_name: formData.full_name.trim(),
        mobile_number: formData.mobile_number.trim(),
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        address: formData.address.trim() || null,
        village_name: formData.village_name.trim() || null,
        street_name: formData.street_name.trim() || null,
        ward_number: formData.ward_number.trim() || null,
        occupation: formData.occupation.trim() || null,
        blood_group: formData.blood_group || null,
        volunteer_willingness: formData.volunteer_willingness || null,
        blood_donation_willingness: formData.blood_donation_willingness || null,
        skills: formData.skills || [],
        other_skills: formData.other_skills.trim() || null,
        voter_id_number: formData.voter_id_number.trim() || null,
        aadhaar_number: formData.aadhaar_number.trim() || null,
      });

      setEditingMember(null);
      await fetchMembers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update member');
    } finally {
      setFormSaving(false);
    }
  };

  // Save Add
  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSaving(true);
    setFormError(null);

    try {
      if (!formData.full_name.trim()) {
        setFormError(t('valNameRequired'));
        setFormSaving(false);
        return;
      }
      const cleanMobile = formData.mobile_number.replace(/\D/g, '');
      if (cleanMobile.length !== 10) {
        setFormError(t('valMobileInvalid'));
        setFormSaving(false);
        return;
      }

      await memberService.registerMember(formData, language);
      setIsAddModalOpen(false);
      await fetchMembers();
    } catch (err: any) {
      if (err.message === 'DUPLICATE_MOBILE') {
        setFormError(t('valDuplicateMobile'));
      } else {
        setFormError(err.message || 'Failed to add member');
      }
    } finally {
      setFormSaving(false);
    }
  };

  // Delete Member
  const handleConfirmDelete = async () => {
    if (!deletingMember) return;
    try {
      await memberService.deleteMember(deletingMember.id);
      setDeletingMember(null);
      await fetchMembers();
    } catch (err: any) {
      console.error('Delete member error:', err);
    }
  };

  // Print ID Card Action (triggers browser print dialog)
  const handlePrintCard = () => {
    window.print();
  };

  // Generate exact CR80 PDF from modal (using shared high-res font & image pipeline)
  const handleDownloadPdfFromModal = async () => {
    if (!frontCardRef.current || !printingMember) return;
    setIsGeneratingPdf(true);

    try {
      await exportCardPdf(
        frontCardRef.current,
        backCardRef.current,
        printingMember,
        printCardSide
      );
    } catch (err) {
      console.error('Error generating CR80 PDF from print modal:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Add Member Button */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#20223E]">{t('manageMembersTitle')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{t('manageMembersSubtitle')}</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#91BD32] hover:bg-[#80a82b] text-[#20223E] font-bold text-xs shadow-sm transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t('menuAddMember')}</span>
        </button>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
        
        {/* Global Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'ta' ? 'பெயர், கைபேசி எண், உறுப்பினர் எண், கிராமம் அல்லது தெரு பெயர் மூலம் தேடுக...' : 'Search by Name, Mobile, Membership ID, Village or Street Name...'}
            className="w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-slate-300 bg-[#F5F7FA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#91BD32]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid (Village, Street, Ward, Year, Reset Button) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          
          {/* Village Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('village')}</label>
            <select
              value={selectedVillage}
              onChange={(e) => handleVillageChange(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-[#91BD32]"
            >
              <option value="">{t('allVillages')}</option>
              {distinctVillages.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Street Filter (Dynamically populated based on selected village) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('streetLabel')}</label>
            <select
              value={selectedStreet}
              onChange={(e) => setSelectedStreet(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-[#91BD32]"
            >
              <option value="">{t('allStreets')}</option>
              {availableStreets.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Ward Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('ward')}</label>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-[#91BD32]"
            >
              <option value="">{t('allWards')}</option>
              {distinctWards.map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('filterYear')}</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-[#91BD32]"
            >
              <option value="">{t('allYears')}</option>
              {distinctYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Reset Button */}
          <div className="flex items-end col-span-2 sm:col-span-1">
            <button
              onClick={resetFilters}
              className="w-full py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('reset')}</span>
            </button>
          </div>

        </div>

        {/* Showing count indicator */}
        <div className="text-xs text-slate-500 font-semibold pt-1 border-t border-slate-100 flex items-center justify-between">
          <span>{t('showingCount', { count: filteredMembers.length })}</span>
          {selectedVillage && (
            <span className="text-[11px] text-slate-400">
              {language === 'ta' ? 'தேர்ந்தெடுக்கப்பட்ட கிராமம்: ' : 'Filtered Village: '} 
              <strong className="text-slate-700">{selectedVillage}</strong>
              {selectedStreet ? ` • ${selectedStreet}` : ''}
            </span>
          )}
        </div>

      </div>

      {/* MEMBER LIST */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-semibold">{t('loading')}</div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
          {t('noMembersFound')}
        </div>
      ) : (
        <>
          {/* MOBILE CARDS VIEW (Clean responsive cards for phones) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredMembers.map((m) => (
              <div 
                key={m.id} 
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-[#2878B9]">
                      {m.membership_number}
                    </span>
                    <h3 className="text-base font-bold text-[#20223E] mt-1">{m.full_name}</h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {m.registration_date ? new Date(m.registration_date).toLocaleDateString() : ''}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{m.mobile_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {m.village_name || 'Kinathukadavu'} &bull; {m.street_name || t('notProvided')} &bull; {m.ward_number || '-'} &bull; {m.district}
                    </span>
                  </div>
                </div>

                {/* Actions: View, Edit, Print ID Card, Delete */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setViewingMember(m)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#20223E] cursor-pointer"
                    title={t('view')}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(m)}
                    className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#2878B9] cursor-pointer"
                    title={t('edit')}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPrintingMember(m)}
                    className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                    title={t('printIdCard')}
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingMember(m)}
                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                    title={t('delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-[#20223E] text-white text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">{t('colMemberId')}</th>
                    <th className="py-3.5 px-4">{t('colName')}</th>
                    <th className="py-3.5 px-4">{t('colMobile')}</th>
                    <th className="py-3.5 px-4">{t('colVillage')}</th>
                    <th className="py-3.5 px-4">{t('streetLabel')}</th>
                    <th className="py-3.5 px-4">{t('colWard')}</th>
                    <th className="py-3.5 px-4">{t('colDistrict')}</th>
                    <th className="py-3.5 px-4">{t('colRegDate')}</th>
                    <th className="py-3.5 px-4 text-right">{t('colActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#20223E] text-xs">
                        {m.membership_number}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#20223E]">
                        {m.full_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        {m.mobile_number}
                      </td>
                      <td className="py-3.5 px-4">
                        {m.village_name || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {m.street_name && m.street_name.trim() ? (
                          <span className="font-semibold text-slate-800">{m.street_name}</span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">{t('notProvided')}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {m.ward_number || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        {m.district}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {m.registration_date ? new Date(m.registration_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View */}
                          <button
                            onClick={() => setViewingMember(m)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-[#20223E] cursor-pointer"
                            title={t('view')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-600 hover:text-[#2878B9] cursor-pointer"
                            title={t('edit')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Print ID Card (Dedicated button) */}
                          <button
                            onClick={() => setPrintingMember(m)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                            title={t('printIdCard')}
                          >
                            <Printer className="w-4 h-4 text-emerald-700" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeletingMember(m)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-600 hover:text-red-600 cursor-pointer"
                            title={t('delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          PRINT ID CARD PREVIEW & PRINT MODAL DIALOG
         ========================================================================= */}
      {printingMember && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl animate-fadeIn overflow-hidden my-auto flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="bg-[#20223E] text-white p-5 flex items-center justify-between border-b-2 border-[#91BD32] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 text-[#91BD32]">
                  <Printer className="w-5 h-5 text-[#91BD32]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{t('printPreviewTitle')}</span>
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                    <span className="font-bold text-white">{printingMember.full_name}</span>
                    <span>&bull;</span>
                    <span className="font-mono text-[#91BD32]">{printingMember.membership_number}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setPrintingMember(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body with vertical scroll if screen is compact */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Duplex Printing Instructions Notice */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold block text-emerald-900 mb-0.5">
                    {isTamil ? 'அச்சு அமைப்புகள் வழிகாட்டுதல் (Duplex Printing)' : 'Physical CR80 Card Printing Guide:'}
                  </span>
                  <span>{t('duplexPrintHelp')}</span>
                </div>
              </div>

              {/* Side Selector Tabs */}
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintCardSide('both')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    printCardSide === 'both'
                      ? 'bg-[#20223E] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isTamil ? 'இருபுறமும்' : 'Both Sides'}
                </button>
                <button
                  type="button"
                  onClick={() => setPrintCardSide('front')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    printCardSide === 'front'
                      ? 'bg-[#20223E] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isTamil ? 'முன்பக்கம் மட்டும்' : 'Front Only'}
                </button>
                <button
                  type="button"
                  onClick={() => setPrintCardSide('back')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    printCardSide === 'back'
                      ? 'bg-[#20223E] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isTamil ? 'பின்பக்கம் மட்டும்' : 'Back Only'}
                </button>
              </div>

              {/* EXACT CR80 CARD CONTAINER (Responsive: Side-by-Side on Desktop, Stacked on Mobile) */}
              <div 
                id="printable-cr80-container"
                className="flex flex-col md:flex-row items-center justify-center gap-6 py-3"
              >
                {/* Front Side Card */}
                <div className={`flex flex-col items-center flex-shrink-0 ${printCardSide === 'back' ? 'hidden' : 'flex'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-[#91BD32]" />
                    <span>{isTamil ? 'முன்பக்கம்' : 'Front Side (53.98 × 85.60 mm)'}</span>
                  </span>
                  <CR80MembershipCard
                    ref={frontCardRef}
                    member={printingMember}
                    side="front"
                  />
                </div>

                {/* Back Side Card */}
                <div className={`flex flex-col items-center flex-shrink-0 ${printCardSide === 'front' ? 'hidden' : 'flex'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#2878B9]" />
                    <span>{isTamil ? 'பின்பக்கம்' : 'Back Side (Verification QR)'}</span>
                  </span>
                  <CR80MembershipCard
                    ref={backCardRef}
                    member={printingMember}
                    side="back"
                    qrCodeUrl={printQrCodeUrl}
                  />
                </div>
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Standard CR80 ATM Card Size: <strong>53.98 mm × 85.60 mm</strong>
              </span>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setPrintingMember(null)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {t('cancel')}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdfFromModal}
                  disabled={isGeneratingPdf}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Download CR80 PDF"
                >
                  <Download className="w-4 h-4 text-[#2878B9]" />
                  <span>{isGeneratingPdf ? t('loading') : 'PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintCard}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#20223E] hover:bg-[#2c2f54] text-white text-xs font-bold flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#91BD32]" />
                  <span>{t('printIdCard')}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* VIEW MEMBER MODAL */}
      {viewingMember && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            
            {/* Header */}
            <div className="bg-[#20223E] text-white p-5 rounded-t-3xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-[#91BD32] uppercase">{viewingMember.membership_number}</span>
                <h2 className="text-lg font-bold text-white">{viewingMember.full_name}</h2>
              </div>
              <button
                onClick={() => {
                  setViewingMember(null);
                  if (onClearDetail) onClearDetail();
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="p-6 space-y-4 text-sm">
              
              {/* Photo Preview if available */}
              {viewingMember.profile_photo_url && (
                <div className="text-center pb-2">
                  <img 
                    src={viewingMember.profile_photo_url} 
                    alt={viewingMember.full_name}
                    className="w-24 h-24 rounded-2xl object-cover mx-auto border-2 border-[#91BD32] shadow"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{t('colMobile')}</span>
                  <p className="font-mono font-bold text-slate-800">{viewingMember.mobile_number}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{t('gender')}</span>
                  <p className="font-semibold text-slate-800">{viewingMember.gender || '-'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{t('dob')}</span>
                  <p className="font-semibold text-slate-800">{viewingMember.date_of_birth || '-'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{t('bloodGroupLabel')}</span>
                  <p className="font-bold text-red-600">{viewingMember.blood_group || '-'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{t('village')}</span>
                  <p className="font-semibold text-slate-800">{viewingMember.village_name || '-'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{t('streetLabel')}</span>
                  <p className="font-semibold text-slate-800">{viewingMember.street_name || t('notProvided')}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{t('ward')}</span>
                  <p className="font-semibold text-slate-800">{viewingMember.ward_number || '-'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{t('occupation')}</span>
                  <p className="font-semibold text-slate-800">{viewingMember.occupation || '-'}</p>
                </div>
              </div>

              {/* Volunteer & Community Info */}
              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200/80 space-y-2">
                <span className="text-xs font-bold text-emerald-800 block">{t('volunteerParticipationHeading')}</span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">{t('colVolunteerStatus')}:</span>
                    <span className="font-semibold text-slate-800">{viewingMember.volunteer_willingness || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{t('colBloodDonation')}:</span>
                    <span className="font-semibold text-slate-800">{viewingMember.blood_donation_willingness || '-'}</span>
                  </div>
                </div>

                {/* Skills tags */}
                {viewingMember.skills && viewingMember.skills.length > 0 && (
                  <div className="pt-2 border-t border-emerald-100">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">{t('colSkills')}:</span>
                    <div className="flex flex-wrap gap-1">
                      {viewingMember.skills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-white border border-emerald-300 text-emerald-900 rounded-md text-[10px] font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {viewingMember.other_skills && (
                  <div className="pt-1 text-[11px] text-slate-700">
                    <span className="font-bold text-slate-500">{t('otherSkillsLabel')}: </span>
                    <span>{viewingMember.other_skills}</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">{t('address')}</span>
                <p className="font-semibold text-slate-800">{viewingMember.address || '-'}</p>
              </div>

              {/* Protected Info Section */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t('protectedInfoHeading')}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">{t('voterIdProtected')}:</span>
                    <span className="font-mono font-bold text-slate-800">{viewingMember.voter_id_number || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{t('maskedAadhaar')}:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {viewingMember.aadhaar_number 
                        ? `XXXX-XXXX-${viewingMember.aadhaar_number.slice(-4)}`
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            <div className="p-4 bg-slate-50 rounded-b-3xl border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  const m = viewingMember;
                  setViewingMember(null);
                  if (onClearDetail) onClearDetail();
                  setPrintingMember(m);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t('printIdCard')}</span>
              </button>

              <button
                onClick={() => {
                  setViewingMember(null);
                  if (onClearDetail) onClearDetail();
                }}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-xs text-slate-700 cursor-pointer"
              >
                {t('close')}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EDIT / ADD MODAL */}
      {(editingMember || isAddModalOpen) && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            
            <div className="bg-[#20223E] text-white p-5 rounded-t-3xl flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingMember ? t('editMemberModalTitle') : t('addMemberModalTitle')}
              </h2>
              <button
                onClick={() => {
                  setEditingMember(null);
                  setIsAddModalOpen(false);
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingMember ? handleSaveEdit : handleSaveAdd} className="p-6 space-y-4">
              
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('fullNameLabel')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('mobileLabel')} *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={formData.mobile_number}
                  onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value.replace(/\D/g, '') })}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 font-mono"
                />
              </div>

              {/* Village, Street & Ward Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('villageLabel')}</label>
                  <input
                    type="text"
                    value={formData.village_name}
                    onChange={(e) => setFormData({ ...formData, village_name: e.target.value })}
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('streetLabel')}</label>
                  <input
                    type="text"
                    value={formData.street_name}
                    onChange={(e) => setFormData({ ...formData, street_name: e.target.value })}
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('wardLabel')}</label>
                  <input
                    type="text"
                    value={formData.ward_number}
                    onChange={(e) => setFormData({ ...formData, ward_number: e.target.value })}
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Gender & DOB */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('genderLabel')}</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="">-- {t('genderSelect')} --</option>
                    <option value="Male">{t('genderMale')}</option>
                    <option value="Female">{t('genderFemale')}</option>
                    <option value="Other">{t('genderOther')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('dobLabel')}</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Blood Group & Occupation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('bloodGroupLabel')}</label>
                  <select
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="">-- {t('bloodGroupSelect')} --</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('occupationLabel')}</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Volunteer & Blood Donation Willingness */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('colVolunteerStatus')}</label>
                  <select
                    value={formData.volunteer_willingness}
                    onChange={(e) => setFormData({ ...formData, volunteer_willingness: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="">-- Select --</option>
                    <option value="Yes, I am interested.">{t('volunteerOptYes')}</option>
                    <option value="Maybe, depending on the activity.">{t('volunteerOptMaybe')}</option>
                    <option value="No, not currently.">{t('volunteerOptNo')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('colBloodDonation')}</label>
                  <select
                    value={formData.blood_donation_willingness}
                    onChange={(e) => setFormData({ ...formData, blood_donation_willingness: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="">-- Select --</option>
                    <option value="Yes, I am willing.">{t('bloodDonationOptYes')}</option>
                    <option value="Maybe in the future.">{t('bloodDonationOptMaybe')}</option>
                    <option value="No.">{t('bloodDonationOptNo')}</option>
                  </select>
                </div>
              </div>

              {/* Other Skills */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('otherSkillsLabel')}</label>
                <input
                  type="text"
                  value={formData.other_skills}
                  onChange={(e) => setFormData({ ...formData, other_skills: e.target.value })}
                  placeholder={t('otherSkillsPlaceholder')}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('addressLabel')}</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingMember(null);
                    setIsAddModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="px-6 py-2 rounded-xl bg-[#91BD32] hover:bg-[#80a82b] text-[#20223E] font-bold text-xs shadow cursor-pointer disabled:opacity-50"
                >
                  {formSaving ? t('loading') : (editingMember ? t('saveChangesBtn') : t('addMemberBtn'))}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-[#20223E]">
                {t('deleteMemberConfirmTitle')}
              </h3>
              <p className="text-xs text-slate-600 mt-2">
                {t('deleteMemberConfirmMsg', { name: deletingMember.full_name, id: deletingMember.membership_number })}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setDeletingMember(null)}
                className="py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow cursor-pointer"
              >
                {t('deleteBtnConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
