import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  FileSpreadsheet, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck,
  ChevronRight,
  HeartHandshake,
  ExternalLink,
  Globe
} from 'lucide-react';
import { getPublicSiteUrl } from '../utils/subdomain';

interface AdminLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ activeTab, onTabChange, children }) => {
  const { t, language } = useLanguage();
  const { adminUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Exact 7 items as required in specification
  const menuItems = [
    { id: 'dashboard', label: t('menuDashboard'), icon: LayoutDashboard },
    { id: 'all-members', label: t('menuAllMembers'), icon: Users },
    { id: 'volunteers', label: t('menuVolunteers'), icon: HeartHandshake },
    { id: 'add-member', label: t('menuAddMember'), icon: UserPlus },
    { id: 'reports', label: t('menuReports'), icon: FileText },
    { id: 'excel-export', label: t('menuExcelExport'), icon: FileSpreadsheet },
    { id: 'settings', label: t('menuSettings'), icon: Settings },
  ];

  const handleSelectTab = (tabId: string) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col md:flex-row">
      
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-[#20223E] text-white p-4 flex items-center justify-between shadow-md sticky top-0 z-40 border-b border-[#91BD32]">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded">
            <img 
              src="/logo.svg" 
              alt="WE the Leader" 
              className="h-7 w-auto object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('we-the-leader-logo.jpg')) {
                  target.src = '/we-the-leader-logo.jpg';
                }
              }}
            />
          </div>
          <div>
            <div className="text-xs font-black tracking-tight">{t('orgName')}</div>
            <div className="text-[9px] font-bold text-[#91BD32] uppercase">{t('tagline')}</div>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar for Desktop & Mobile Drawer */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#20223E] text-white flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header with Official Logo */}
        <div className="p-5 border-b border-slate-700/80">
          <div className="bg-white p-2 rounded-xl mb-3 shadow">
            <img 
              src="/logo.svg" 
              alt="WE the Leader Logo" 
              className="h-10 w-auto object-contain mx-auto"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('we-the-leader-logo.jpg')) {
                  target.src = '/we-the-leader-logo.jpg';
                }
              }}
            />
          </div>
          <div className="text-sm font-black tracking-tight text-white">
            {t('orgName')}
          </div>
          <div className="text-[11px] font-black text-[#91BD32] tracking-wider uppercase">
            {t('tagline')}
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            {t('location')}
          </div>
        </div>

        {/* Admin Badge */}
        <div className="px-5 py-3 bg-[#17192e] flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#E98A32]" />
            <span className="text-xs font-bold text-slate-300">Authorized Admin</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#91BD32] animate-pulse" />
        </div>

        {/* Navigation Items (The 6 main tabs + Logout) */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-[#91BD32] text-[#20223E] shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#20223E]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </button>
            );
          })}
        </nav>

        {/* Public Website & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-1">
          <a
            href={getPublicSiteUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Open Public Website"
          >
            <span className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-[#91BD32]" />
              <span>Public Website</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>{t('adminLogoutBtn')}</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for Mobile */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      {/* Main Admin Content Body */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
};
