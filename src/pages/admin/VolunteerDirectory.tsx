import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Member } from '../../types';
import { memberService } from '../../services/memberService';
import { SKILL_CATEGORIES, BLOOD_GROUPS } from '../RegistrationPage';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  HeartHandshake, 
  Droplet, 
  Sparkles, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Briefcase, 
  Eye, 
  EyeOff, 
  Download, 
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const VolunteerDirectory: React.FC = () => {
  const { t, language } = useLanguage();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedStreet, setSelectedStreet] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [selectedVolunteerStatus, setSelectedVolunteerStatus] = useState('');
  const [selectedBloodDonation, setSelectedBloodDonation] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedOccupation, setSelectedOccupation] = useState('');

  // Privacy: Revealed contact numbers set by member id
  const [revealedContacts, setRevealedContacts] = useState<Set<string>>(new Set());
  const [selectedVolunteerDetail, setSelectedVolunteerDetail] = useState<Member | null>(null);

  useEffect(() => {
    const fetchVolunteers = async () => {
      setLoading(true);
      try {
        const data = await memberService.getAllMembers();
        setMembers(data);
      } catch (err) {
        console.error('Error fetching volunteer data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVolunteers();
  }, []);

  // Distinct filter options extracted dynamically
  const distinctVillages = useMemo(() => {
    const s = new Set<string>();
    members.forEach(m => {
      if (m.village_name?.trim()) s.add(m.village_name.trim());
    });
    return Array.from(s).sort();
  }, [members]);

  const distinctStreets = useMemo(() => {
    const s = new Set<string>();
    members.forEach(m => {
      if (m.street_name?.trim()) s.add(m.street_name.trim());
    });
    return Array.from(s).sort();
  }, [members]);

  const distinctWards = useMemo(() => {
    const s = new Set<string>();
    members.forEach(m => {
      if (m.ward_number?.trim()) s.add(m.ward_number.trim());
    });
    return Array.from(s).sort();
  }, [members]);

  // Flattened all available standard skills
  const allAvailableSkills = useMemo(() => {
    const list: { id: string; labelKey: any }[] = [];
    SKILL_CATEGORIES.forEach(cat => {
      cat.skills.forEach(s => list.push(s));
    });
    return list;
  }, []);

  // Filtered Volunteers
  const filteredVolunteers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return members.filter(m => {
      // Global Search
      if (q) {
        const matchName = m.full_name?.toLowerCase().includes(q);
        const matchId = m.membership_number?.toLowerCase().includes(q);
        const matchVillage = m.village_name?.toLowerCase().includes(q);
        const matchStreet = m.street_name?.toLowerCase().includes(q);
        const matchOcc = m.occupation?.toLowerCase().includes(q);
        const matchSkill = m.skills?.some(s => s.toLowerCase().includes(q));
        const matchOtherSkills = m.other_skills?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchVillage && !matchStreet && !matchOcc && !matchSkill && !matchOtherSkills) {
          return false;
        }
      }

      // Village Filter
      if (selectedVillage && m.village_name?.trim() !== selectedVillage) return false;

      // Street Filter
      if (selectedStreet && m.street_name?.trim() !== selectedStreet) return false;

      // Ward Filter
      if (selectedWard && m.ward_number?.trim() !== selectedWard) return false;

      // Volunteer Willingness Filter
      if (selectedVolunteerStatus) {
        if (selectedVolunteerStatus === 'interested') {
          if (!m.volunteer_willingness?.startsWith('Yes')) return false;
        } else if (selectedVolunteerStatus === 'maybe') {
          if (!m.volunteer_willingness?.startsWith('Maybe')) return false;
        } else if (selectedVolunteerStatus === 'no') {
          if (!m.volunteer_willingness?.startsWith('No')) return false;
        }
      }

      // Blood Donation Willingness Filter
      if (selectedBloodDonation) {
        if (selectedBloodDonation === 'willing') {
          if (!m.blood_donation_willingness?.startsWith('Yes')) return false;
        } else if (selectedBloodDonation === 'maybe') {
          if (!m.blood_donation_willingness?.startsWith('Maybe')) return false;
        } else if (selectedBloodDonation === 'no') {
          if (!m.blood_donation_willingness?.startsWith('No')) return false;
        }
      }

      // Blood Group Filter
      if (selectedBloodGroup && m.blood_group !== selectedBloodGroup) return false;

      // Skill Filter
      if (selectedSkill) {
        const hasSkill = m.skills?.includes(selectedSkill);
        const hasInOther = m.other_skills?.toLowerCase().includes(selectedSkill.toLowerCase());
        if (!hasSkill && !hasInOther) return false;
      }

      // Occupation Filter
      if (selectedOccupation) {
        if (!m.occupation?.toLowerCase().includes(selectedOccupation.toLowerCase())) return false;
      }

      return true;
    });
  }, [
    members,
    searchTerm,
    selectedVillage,
    selectedStreet,
    selectedWard,
    selectedVolunteerStatus,
    selectedBloodDonation,
    selectedBloodGroup,
    selectedSkill,
    selectedOccupation
  ]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedVillage('');
    setSelectedStreet('');
    setSelectedWard('');
    setSelectedVolunteerStatus('');
    setSelectedBloodDonation('');
    setSelectedBloodGroup('');
    setSelectedSkill('');
    setSelectedOccupation('');
  };

  // Toggle reveal contact
  const toggleRevealContact = (id: string) => {
    setRevealedContacts(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Export Filtered Volunteers to Excel (SheetJS)
  const handleExportVolunteers = () => {
    const exportData = filteredVolunteers.map(m => ({
      'Membership ID / உறுப்பினர் எண்': m.membership_number,
      'Member Name / முழு பெயர்': m.full_name,
      'Village / கிராமம்': m.village_name || '',
      'Street / தெரு': m.street_name || '',
      'Ward / வார்டு': m.ward_number || '',
      'District / மாவட்டம்': m.district || 'Coimbatore',
      'Occupation / தொழில்': m.occupation || '',
      'Blood Group / இரத்த வகை': m.blood_group || '',
      'Volunteer Willingness / தன்னார்வ விருப்பம்': m.volunteer_willingness || '',
      'Blood Donation Willingness / இரத்த தான விருப்பம்': m.blood_donation_willingness || '',
      'Skills / திறன்கள்': m.skills?.join(', ') || '',
      'Other Skills / பிற திறன்கள்': m.other_skills || '',
      'Registration Date / பதிவு தேதி': m.registration_date ? new Date(m.registration_date).toLocaleDateString() : ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Volunteers');
    XLSX.writeFile(wb, `WE_The_Leader_Volunteer_Directory_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Helper for Volunteer Status badge
  const renderVolunteerBadge = (status?: string | null) => {
    if (!status) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">-</span>;
    }
    if (status.startsWith('Yes')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          <span>{t('volunteerOptYes')}</span>
        </span>
      );
    }
    if (status.startsWith('Maybe')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
          <span>{t('volunteerOptMaybe')}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
        <span>{t('volunteerOptNo')}</span>
      </span>
    );
  };

  // Helper for Blood Donation badge
  const renderBloodBadge = (willingness?: string | null, bloodGroup?: string | null) => {
    return (
      <div className="flex items-center gap-1.5">
        {bloodGroup && (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-red-100 text-red-700 border border-red-200">
            {bloodGroup}
          </span>
        )}
        {willingness?.startsWith('Yes') && (
          <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5" title="Willing to donate blood">
            <Droplet className="w-3 h-3 fill-red-500 text-red-500" />
            <span>Donor Willing</span>
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#91BD32]/20 text-[#20223E]">
              <HeartHandshake className="w-6 h-6 text-[#20223E]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#20223E]">{t('volunteerDirTitle')}</h1>
              <p className="text-xs sm:text-sm text-slate-500">{t('volunteerDirSubtitle')}</p>
            </div>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleExportVolunteers}
          disabled={loading || filteredVolunteers.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#20223E] hover:bg-[#2c2f54] text-white text-xs font-bold shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4 text-[#91BD32]" />
          <span>{t('exportVolunteersBtn')}</span>
        </button>
      </div>

      {/* Sensitive Data Notice Banner */}
      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-start gap-3 text-xs text-blue-900 leading-relaxed shadow-xs">
        <ShieldCheck className="w-5 h-5 text-[#2878B9] flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">{t('contactAuthorizedNotice')}</span>
          <span className="text-blue-800/90">{t('volunteerNotice')}</span>
        </div>
      </div>

      {/* Search & Comprehensive Filters Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
        
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'ta' ? 'பெயர், உறுப்பினர் எண், தெரு, தொழில் அல்லது திறன் மூலம் தேடுக...' : 'Search by Name, Membership ID, Street, Occupation or Skill...'}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-[#F5F7FA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#91BD32]"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          
          {/* Village Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('filterVillage')}</label>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-[#91BD32]"
            >
              <option value="">{t('allVillages')}</option>
              {distinctVillages.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Street Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('filterStreet')}</label>
            <select
              value={selectedStreet}
              onChange={(e) => setSelectedStreet(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-[#91BD32]"
            >
              <option value="">{language === 'ta' ? 'அனைத்து தெருக்கள்' : 'All Streets'}</option>
              {distinctStreets.map(s => (
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

          {/* Volunteer Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('filterVolunteerStatus')}</label>
            <select
              value={selectedVolunteerStatus}
              onChange={(e) => setSelectedVolunteerStatus(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-[#91BD32]"
            >
              <option value="">{t('allVolunteers')}</option>
              <option value="interested">{t('volunteerOptYes')}</option>
              <option value="maybe">{t('volunteerOptMaybe')}</option>
              <option value="no">{t('volunteerOptNo')}</option>
            </select>
          </div>

          {/* Blood Donation Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('filterBloodDonation')}</label>
            <select
              value={selectedBloodDonation}
              onChange={(e) => setSelectedBloodDonation(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-[#91BD32]"
            >
              <option value="">-- {language === 'ta' ? 'அனைத்து விருப்பநிலை' : 'All Willingness'} --</option>
              <option value="willing">{t('bloodDonationOptYes')}</option>
              <option value="maybe">{t('bloodDonationOptMaybe')}</option>
              <option value="no">{t('bloodDonationOptNo')}</option>
            </select>
          </div>

          {/* Blood Group Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('filterBloodGroup')}</label>
            <select
              value={selectedBloodGroup}
              onChange={(e) => setSelectedBloodGroup(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-[#91BD32]"
            >
              <option value="">{t('allBloodGroups')}</option>
              {BLOOD_GROUPS.map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          {/* Skills Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('filterSkill')}</label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-[#91BD32]"
            >
              <option value="">{t('allSkills')}</option>
              {allAvailableSkills.map(s => (
                <option key={s.id} value={s.id}>{t(s.labelKey)}</option>
              ))}
            </select>
          </div>

          {/* Reset Button */}
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('reset')}</span>
            </button>
          </div>

        </div>

        {/* Count indicator */}
        <div className="pt-2 border-t border-slate-100 text-xs font-semibold text-slate-500 flex items-center justify-between">
          <span>{t('showingVolunteerCount', { count: filteredVolunteers.length })}</span>
        </div>

      </div>

      {/* VOLUNTEER LIST VIEW */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-semibold">{t('loading')}</div>
      ) : filteredVolunteers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
          {t('noVolunteersFound')}
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredVolunteers.map((m) => {
              const isContactRevealed = revealedContacts.has(m.id);
              return (
                <div key={m.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-[#2878B9]">
                        {m.membership_number}
                      </span>
                      <h3 className="text-base font-bold text-[#20223E] mt-1">{m.full_name}</h3>
                    </div>
                    {renderVolunteerBadge(m.volunteer_willingness)}
                  </div>

                  {/* Location & Blood Group */}
                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{m.village_name || '-'}{m.street_name ? ` • ${m.street_name}` : ''}{m.ward_number ? ` • ${m.ward_number}` : ''}</span>
                    </div>
                    {m.occupation && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span>{m.occupation}</span>
                      </div>
                    )}
                    {renderBloodBadge(m.blood_donation_willingness, m.blood_group)}
                  </div>

                  {/* Skills Chips */}
                  {m.skills && m.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {m.skills.map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-[#20223E] rounded-md text-[10px] font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Contact Access & Detail Button */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs font-mono font-bold">
                      {isContactRevealed ? (
                        <span className="text-emerald-700">{m.mobile_number}</span>
                      ) : (
                        <span className="text-slate-400">{m.mobile_number.slice(0, 5)} •••••</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleRevealContact(m.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {isContactRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{isContactRevealed ? t('hideContactBtn') : t('viewContactBtn')}</span>
                      </button>
                      <button
                        onClick={() => setSelectedVolunteerDetail(m)}
                        className="p-1.5 rounded-lg bg-blue-50 text-[#2878B9] hover:bg-blue-100 cursor-pointer"
                        title={t('view')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-[#20223E] text-white text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">{t('colMemberId')}</th>
                    <th className="py-3.5 px-4">{t('colName')}</th>
                    <th className="py-3.5 px-4">{t('colVillage')} & {t('colStreet')}</th>
                    <th className="py-3.5 px-4">{t('colVolunteerStatus')}</th>
                    <th className="py-3.5 px-4">{t('colBloodGroup')}</th>
                    <th className="py-3.5 px-4">{t('colSkills')}</th>
                    <th className="py-3.5 px-4">{t('colMobile')} (Authorised)</th>
                    <th className="py-3.5 px-4 text-right">{t('colActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVolunteers.map((m) => {
                    const isContactRevealed = revealedContacts.has(m.id);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#20223E] text-xs">
                          {m.membership_number}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#20223E]">{m.full_name}</div>
                          {m.occupation && <div className="text-[11px] text-slate-400">{m.occupation}</div>}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-semibold text-slate-800">{m.village_name || '-'}</div>
                          <div className="text-[11px] text-slate-500">{m.street_name || '-'}{m.ward_number ? `, ${m.ward_number}` : ''}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {renderVolunteerBadge(m.volunteer_willingness)}
                        </td>
                        <td className="py-3.5 px-4">
                          {renderBloodBadge(m.blood_donation_willingness, m.blood_group)}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {m.skills && m.skills.length > 0 ? (
                              m.skills.slice(0, 3).map((skill, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-[#20223E] rounded text-[10px]">
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                            {m.skills && m.skills.length > 3 && (
                              <span className="text-[10px] font-bold text-slate-500 self-center">
                                +{m.skills.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            {isContactRevealed ? (
                              <span className="font-bold text-emerald-700">{m.mobile_number}</span>
                            ) : (
                              <span className="text-slate-400">{m.mobile_number.slice(0, 5)} •••••</span>
                            )}
                            <button
                              onClick={() => toggleRevealContact(m.id)}
                              className="p-1 rounded hover:bg-slate-200 text-slate-500 cursor-pointer"
                              title={isContactRevealed ? t('hideContactBtn') : t('viewContactBtn')}
                            >
                              {isContactRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedVolunteerDetail(m)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-600 hover:text-[#2878B9] cursor-pointer"
                            title={t('view')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* FULL VOLUNTEER PROFILE MODAL */}
      {selectedVolunteerDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            
            <div className="bg-[#20223E] text-white p-5 rounded-t-3xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-[#91BD32] uppercase">{selectedVolunteerDetail.membership_number}</span>
                <h2 className="text-lg font-bold text-white">{selectedVolunteerDetail.full_name}</h2>
              </div>
              <button
                onClick={() => setSelectedVolunteerDetail(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              
              {/* Photo Preview if available */}
              {selectedVolunteerDetail.profile_photo_url && (
                <div className="text-center pb-2">
                  <img 
                    src={selectedVolunteerDetail.profile_photo_url} 
                    alt={selectedVolunteerDetail.full_name}
                    className="w-24 h-24 rounded-2xl object-cover mx-auto border-2 border-[#91BD32] shadow"
                  />
                </div>
              )}

              {/* Grid Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{t('colMobile')}</span>
                  <p className="font-mono font-bold text-emerald-800">{selectedVolunteerDetail.mobile_number}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{t('bloodGroupLabel')}</span>
                  <p className="font-bold text-red-600">{selectedVolunteerDetail.blood_group || '-'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{t('village')}</span>
                  <p className="font-semibold text-slate-800">{selectedVolunteerDetail.village_name || '-'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{t('streetLabel')}</span>
                  <p className="font-semibold text-slate-800">{selectedVolunteerDetail.street_name || '-'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{t('ward')}</span>
                  <p className="font-semibold text-slate-800">{selectedVolunteerDetail.ward_number || '-'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{t('occupation')}</span>
                  <p className="font-semibold text-slate-800">{selectedVolunteerDetail.occupation || '-'}</p>
                </div>
              </div>

              {/* Volunteer & Blood Willingness */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <span className="text-xs font-bold text-emerald-900 block">{t('volunteerParticipationHeading')}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">{t('colVolunteerStatus')}:</span>
                    <span className="font-bold text-slate-800">{selectedVolunteerDetail.volunteer_willingness || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{t('colBloodDonation')}:</span>
                    <span className="font-bold text-slate-800">{selectedVolunteerDetail.blood_donation_willingness || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">{t('skillsHeading')}</span>
                {selectedVolunteerDetail.skills && selectedVolunteerDetail.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedVolunteerDetail.skills.map((s, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-white border border-[#2878B9]/30 text-[#20223E] rounded-lg text-xs font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No skills listed</p>
                )}

                {selectedVolunteerDetail.other_skills && (
                  <div className="pt-2 text-xs text-slate-700">
                    <span className="font-bold text-slate-500">{t('otherSkillsLabel')}: </span>
                    <span>{selectedVolunteerDetail.other_skills}</span>
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">{t('address')}</span>
                <p className="font-semibold text-slate-800">{selectedVolunteerDetail.address || '-'}</p>
              </div>

            </div>

            <div className="p-4 bg-slate-50 rounded-b-3xl border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedVolunteerDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-xs text-slate-700 cursor-pointer"
              >
                {t('close')}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
