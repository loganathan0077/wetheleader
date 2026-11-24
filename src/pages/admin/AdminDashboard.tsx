import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { DashboardStats, Member } from '../../types';
import { memberService } from '../../services/memberService';
import { 
  Users, 
  UserPlus, 
  CalendarDays, 
  Home, 
  MapPin, 
  ArrowRight, 
  Phone, 
  Clock, 
  ShieldCheck,
  Building
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
  onViewMember: (member: Member) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, onViewMember }) => {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    todayRegistrations: 0,
    thisMonthRegistrations: 0,
    uniqueVillages: 0,
    uniqueWards: 0
  });
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, allMembers] = await Promise.all([
        memberService.getDashboardStats(),
        memberService.getAllMembers()
      ]);
      setStats(statsData);
      setRecentMembers(allMembers.slice(0, 5));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const statCards = [
    {
      title: t('statTotalMembers'),
      value: stats.totalMembers,
      icon: Users,
      color: 'bg-[#20223E] text-white',
      accent: 'text-[#91BD32]'
    },
    {
      title: t('statTodayRegistrations'),
      value: stats.todayRegistrations,
      icon: CalendarDays,
      color: 'bg-white text-[#20223E]',
      accent: 'text-[#91BD32]'
    },
    {
      title: t('statThisMonth'),
      value: stats.thisMonthRegistrations,
      icon: Clock,
      color: 'bg-white text-[#20223E]',
      accent: 'text-[#2878B9]'
    },
    {
      title: t('statUniqueVillages'),
      value: stats.uniqueVillages,
      icon: Home,
      color: 'bg-white text-[#20223E]',
      accent: 'text-[#E98A32]'
    },
    {
      title: t('statUniqueWards'),
      value: stats.uniqueWards,
      icon: Building,
      color: 'bg-white text-[#20223E]',
      accent: 'text-[#2878B9]'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Dashboard Top Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#20223E]">{t('dashTitle')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('dashSubtitle')} &bull; <span className="font-semibold text-[#91BD32]">Kinathukadavu, Coimbatore</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('add-member')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#91BD32] hover:bg-[#80a82b] text-[#20223E] text-xs font-bold shadow transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('menuAddMember')}</span>
          </button>
        </div>
      </div>

      {/* 5 Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl shadow-sm border border-slate-200 transition-transform hover:-translate-y-1 ${card.color}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl bg-slate-100 ${card.accent}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black font-mono">
                {loading ? '...' : card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Registrations Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#2878B9]" />
            <h2 className="text-lg font-bold text-[#20223E]">
              {t('recentRegistrationsTitle')}
            </h2>
          </div>
          <button
            onClick={() => onNavigate('all-members')}
            className="text-xs font-bold text-[#2878B9] hover:underline flex items-center gap-1"
          >
            <span>{t('viewAllMembersBtn')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* List of Recent Members */}
        {recentMembers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            {t('noMembersFound')}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentMembers.map((member) => (
              <div 
                key={member.id} 
                className="p-4 sm:p-5 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors cursor-pointer"
                onClick={() => onViewMember(member)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#20223E] text-white flex items-center justify-center font-bold text-sm">
                    {member.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#20223E] flex items-center gap-2">
                      <span>{member.full_name}</span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-[#2878B9]">
                        {member.membership_number}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {member.mobile_number}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {member.village_name || 'Kinathukadavu'} {member.ward_number ? `(${member.ward_number})` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400">
                    {member.registration_date 
                      ? new Date(member.registration_date).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN')
                      : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
