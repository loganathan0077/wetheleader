import React, { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Member } from '../../types';
import { memberService } from '../../services/memberService';
import { 
  FileSpreadsheet, 
  Download, 
  Table, 
  MapPin, 
  Building, 
  Calendar, 
  ShieldAlert, 
  CheckCircle2,
  HeartHandshake
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const ReportsExportPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await memberService.getAllMembers();
        setMembers(data);
      } catch (err) {
        console.error('Error fetching members for reports:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Aggregated Village-wise Breakdown
  const villageBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    members.forEach(m => {
      const v = m.village_name?.trim() || (language === 'ta' ? 'குறிப்பிடப்படவில்லை' : 'Not Specified');
      map[v] = (map[v] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [members, language]);

  // Aggregated Ward-wise Breakdown
  const wardBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    members.forEach(m => {
      const w = m.ward_number?.trim() || (language === 'ta' ? 'குறிப்பிடப்படவில்லை' : 'Not Specified');
      map[w] = (map[w] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [members, language]);

  // Aggregated Monthly Breakdown
  const monthlyBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    members.forEach(m => {
      if (m.registration_date) {
        const monthKey = m.registration_date.substring(0, 7); // YYYY-MM
        map[monthKey] = (map[monthKey] || 0) + 1;
      }
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [members]);

  // Helper: Export formatted Excel workbook
  const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Members') => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  // 1. Export All Members (Aadhaar strictly excluded!)
  const handleExportAll = () => {
    const exportData = members.map(m => ({
      'Membership ID / உறுப்பினர் எண்': m.membership_number,
      'Full Name / முழு பெயர்': m.full_name,
      'Mobile / கைபேசி எண்': m.mobile_number,
      'District / மாவட்டம்': m.district || 'Coimbatore',
      'Village / கிராமம்': m.village_name || '',
      'Street / தெரு': m.street_name || '',
      'Ward / வார்டு': m.ward_number || '',
      'Gender / பாலினம்': m.gender || '',
      'Date of Birth / பிறந்த தேதி': m.date_of_birth ? m.date_of_birth.split('T')[0] : '',
      'Occupation / தொழில்': m.occupation || '',
      'Registration Date / பதிவு தேதி': m.registration_date ? new Date(m.registration_date).toLocaleString() : ''
    }));
    exportToExcel(exportData, `WE_The_Leader_All_Members_${new Date().toISOString().split('T')[0]}`);
  };

  // 2. Export Volunteers & Skills Report
  const handleExportVolunteersReport = () => {
    const exportData = members.map(m => ({
      'Membership ID / உறுப்பினர் எண்': m.membership_number,
      'Full Name / முழு பெயர்': m.full_name,
      'Village / கிராமம்': m.village_name || '',
      'Street / தெரு': m.street_name || '',
      'Ward / வார்டு': m.ward_number || '',
      'Occupation / தொழில்': m.occupation || '',
      'Blood Group / இரத்த வகை': m.blood_group || '',
      'Volunteer Willingness / தன்னார்வ விருப்பம்': m.volunteer_willingness || '',
      'Blood Donation Willingness / இரத்த தான விருப்பம்': m.blood_donation_willingness || '',
      'Skills / திறன்கள்': m.skills?.join(', ') || '',
      'Other Skills / பிற திறன்கள்': m.other_skills || ''
    }));
    exportToExcel(exportData, `WE_The_Leader_Volunteers_Report_${new Date().toISOString().split('T')[0]}`, 'Volunteers');
  };

  // 3. Export Village Summary
  const handleExportVillageReport = () => {
    const exportData = villageBreakdown.map(([village, count]) => ({
      'Village Name / கிராமத்தின் பெயர்': village,
      'Total Registered Members / மொத்த உறுப்பினர்கள்': count
    }));
    exportToExcel(exportData, `WE_The_Leader_Village_Summary_${new Date().toISOString().split('T')[0]}`, 'Village Summary');
  };

  // 3. Export Ward Summary
  const handleExportWardReport = () => {
    const exportData = wardBreakdown.map(([ward, count]) => ({
      'Ward Number / வார்டு எண்': ward,
      'Total Registered Members / மொத்த உறுப்பினர்கள்': count
    }));
    exportToExcel(exportData, `WE_The_Leader_Ward_Summary_${new Date().toISOString().split('T')[0]}`, 'Ward Summary');
  };

  // 4. Export Monthly Registration Report
  const handleExportMonthlyReport = () => {
    const exportData = monthlyBreakdown.map(([month, count]) => ({
      'Month / மாதம் (YYYY-MM)': month,
      'Total Registrations / பதிவுகள்': count
    }));
    exportToExcel(exportData, `WE_The_Leader_Monthly_Report_${new Date().toISOString().split('T')[0]}`, 'Monthly Report');
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h1 className="text-2xl font-black text-[#20223E]">{t('exportTitle')}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {t('exportSubtitle')}
        </p>

        {/* Privacy notice banner */}
        <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2.5 text-xs text-blue-900 font-medium">
          <ShieldAlert className="w-4 h-4 text-[#2878B9] flex-shrink-0" />
          <span>{t('exportNotice')}</span>
        </div>
      </div>

      {/* Export Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* All Members Export */}
        <button
          onClick={handleExportAll}
          disabled={loading || members.length === 0}
          className="p-5 rounded-2xl bg-[#20223E] hover:bg-[#2c2f54] text-white shadow-md flex flex-col justify-between transition-transform hover:-translate-y-1 cursor-pointer text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#91BD32] uppercase tracking-wider">Excel Export</span>
            <FileSpreadsheet className="w-6 h-6 text-[#91BD32]" />
          </div>
          <div className="mt-4">
            <div className="text-base font-bold text-white leading-tight">
              {t('exportAllBtn')}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {members.length} {language === 'ta' ? 'உறுப்பினர்கள்' : 'Total Members'}
            </p>
          </div>
        </button>

        {/* Village Summary Export */}
        <button
          onClick={handleExportVillageReport}
          disabled={loading || villageBreakdown.length === 0}
          className="p-5 rounded-2xl bg-white hover:bg-slate-50 text-[#20223E] border border-slate-200 shadow-sm flex flex-col justify-between transition-transform hover:-translate-y-1 cursor-pointer text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Summary</span>
            <MapPin className="w-6 h-6 text-[#E98A32]" />
          </div>
          <div className="mt-4">
            <div className="text-base font-bold text-[#20223E] leading-tight">
              {t('exportVillageReportBtn')}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {villageBreakdown.length} {language === 'ta' ? 'கிராமங்கள்' : 'Unique Villages'}
            </p>
          </div>
        </button>

        {/* Ward Summary Export */}
        <button
          onClick={handleExportWardReport}
          disabled={loading || wardBreakdown.length === 0}
          className="p-5 rounded-2xl bg-white hover:bg-slate-50 text-[#20223E] border border-slate-200 shadow-sm flex flex-col justify-between transition-transform hover:-translate-y-1 cursor-pointer text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Summary</span>
            <Building className="w-6 h-6 text-[#2878B9]" />
          </div>
          <div className="mt-4">
            <div className="text-base font-bold text-[#20223E] leading-tight">
              {t('exportWardReportBtn')}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {wardBreakdown.length} {language === 'ta' ? 'வார்டுகள்' : 'Unique Wards'}
            </p>
          </div>
        </button>

        {/* Monthly Report Export */}
        <button
          onClick={handleExportMonthlyReport}
          disabled={loading || monthlyBreakdown.length === 0}
          className="p-5 rounded-2xl bg-white hover:bg-slate-50 text-[#20223E] border border-slate-200 shadow-sm flex flex-col justify-between transition-transform hover:-translate-y-1 cursor-pointer text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly</span>
            <Calendar className="w-6 h-6 text-[#91BD32]" />
          </div>
          <div className="mt-4">
            <div className="text-base font-bold text-[#20223E] leading-tight">
              {t('exportMonthlyReportBtn')}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {monthlyBreakdown.length} {language === 'ta' ? 'மாதங்கள்' : 'Active Months'}
            </p>
          </div>
        </button>

        {/* Volunteer & Skills Directory Export */}
        <button
          onClick={handleExportVolunteersReport}
          disabled={loading || members.length === 0}
          className="p-5 rounded-2xl bg-[#91BD32]/10 hover:bg-[#91BD32]/20 text-[#20223E] border border-[#91BD32]/50 shadow-sm flex flex-col justify-between transition-transform hover:-translate-y-1 cursor-pointer text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#20223E] uppercase tracking-wider">Volunteers</span>
            <HeartHandshake className="w-6 h-6 text-[#20223E]" />
          </div>
          <div className="mt-4">
            <div className="text-base font-bold text-[#20223E] leading-tight">
              {t('exportVolunteersBtn')}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {members.length} {language === 'ta' ? 'உறுப்பினர்கள்' : 'Registered Volunteers'}
            </p>
          </div>
        </button>

      </div>

      {/* Analytical Breakdown Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Village-wise Breakdown Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-base font-bold text-[#20223E] mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#E98A32]" />
            {t('villageBreakdownHeading')}
          </h2>

          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">{t('village')}</th>
                  <th className="py-2.5 px-3 text-right">{t('statTotalMembers')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {villageBreakdown.map(([village, count]) => (
                  <tr key={village} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{village}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#20223E]">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ward-wise Breakdown Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-base font-bold text-[#20223E] mb-4 flex items-center gap-2">
            <Building className="w-4 h-4 text-[#2878B9]" />
            {t('wardBreakdownHeading')}
          </h2>

          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">{t('ward')}</th>
                  <th className="py-2.5 px-3 text-right">{t('statTotalMembers')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wardBreakdown.map(([ward, count]) => (
                  <tr key={ward} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{ward}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#20223E]">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
