import React, { useState, useEffect } from 'react';
import { useLanguage } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { RegistrationPage } from './pages/RegistrationPage';
import { RegistrationSuccessPage } from './pages/RegistrationSuccessPage';
import { DownloadIdCardPage } from './pages/DownloadIdCardPage';
import { AboutUsPage } from './pages/AboutUsPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { MemberManagement } from './pages/admin/MemberManagement';
import { VolunteerDirectory } from './pages/admin/VolunteerDirectory';
import { ReportsExportPage } from './pages/admin/ReportsExportPage';
import { AdminSettings } from './pages/admin/AdminSettings';
import { Member } from './types';
import { memberService } from './services/memberService';
import { isAdminHost, getPublicSiteUrl, getAdminPortalUrl } from './utils/subdomain';
import { ShieldCheck, CheckCircle2, X, AlertCircle, MapPin, Calendar, User } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { currentView, setCurrentView, recentCreatedMember, setRecentCreatedMember } = useAppState();
  const { isAdminLoggedIn } = useAuth();
  const { language } = useLanguage();
  const [adminTab, setAdminTab] = useState('dashboard');
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState<Member | null>(null);

  // Check if current host is the admin subdomain (admin.wetheleader.online)
  const isAdminDomain = isAdminHost();

  // Redirect public production visits to /admin to the dedicated admin subdomain
  useEffect(() => {
    if (!isAdminDomain && typeof window !== 'undefined') {
      const pathname = window.location.pathname.toLowerCase();
      const isProd = window.location.hostname.includes('wetheleader.online');
      if (isProd && (pathname === '/admin' || pathname.startsWith('/admin/'))) {
        window.location.href = getAdminPortalUrl();
      }
    }
  }, [isAdminDomain]);

  // Sync tab with URL hash or pathname for admin subdomain persistence on page refresh
  useEffect(() => {
    if (isAdminDomain && typeof window !== 'undefined') {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      const validTabs = ['dashboard', 'all-members', 'volunteers', 'add-member', 'reports', 'excel-export', 'settings'];
      if (hash && validTabs.includes(hash)) {
        setAdminTab(hash);
      }
    }
  }, [isAdminDomain]);

  const handleAdminTabChange = (tab: string) => {
    setAdminTab(tab);
    if (isAdminDomain && typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/#${tab}`);
    }
  };

  // Verification modal state for QR code scan
  const [verifiedMember, setVerifiedMember] = useState<Member | null>(null);
  const [invalidVerifyId, setInvalidVerifyId] = useState<string | null>(null);

  // Check URL query params for ?verify=WTL-2026-XXXXX or ?action=download-id
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyId = params.get('verify');
    if (verifyId) {
      memberService.getMemberById(verifyId).then(m => {
        if (m) {
          setVerifiedMember(m);
        } else {
          setInvalidVerifyId(verifyId);
        }
      });
    }
    const action = params.get('action');
    if (action === 'download-id') {
      setCurrentView('download-id');
    }
    const view = params.get('view');
    if (view === 'about') {
      setCurrentView('about');
    }
    if (window.location.hash === '#about-us') {
      setCurrentView('about');
    }
  }, []);

  const closeVerificationModal = () => {
    setVerifiedMember(null);
    setInvalidVerifyId(null);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  // Handle successful registration
  const handleRegistrationSuccess = (newMember: Member) => {
    setRecentCreatedMember(newMember);
    setCurrentView('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // View member detail directly from dashboard
  const handleViewMemberFromDashboard = (member: Member) => {
    setSelectedMemberForDetail(member);
    handleAdminTabChange('all-members');
  };

  // =========================================================================
  // SCENARIO 1: ADMIN SUBDOMAIN (admin.wetheleader.online)
  // Dedicated, isolated admin portal environment
  // =========================================================================
  if (isAdminDomain) {
    // If not authenticated, require admin login
    if (!isAdminLoggedIn) {
      return (
        <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
          <main className="flex-1">
            <AdminLoginPage 
              onBackToHome={() => {
                window.location.href = getPublicSiteUrl();
              }} 
              onLoginSuccess={() => {
                setAdminTab('dashboard');
              }} 
            />
          </main>
        </div>
      );
    }

    // Authenticated admin portal view
    return (
      <AdminLayout activeTab={adminTab} onTabChange={handleAdminTabChange}>
        {adminTab === 'dashboard' && (
          <AdminDashboard 
            onNavigate={(tab) => handleAdminTabChange(tab)} 
            onViewMember={handleViewMemberFromDashboard} 
          />
        )}
        {adminTab === 'all-members' && (
          <MemberManagement 
            selectedMemberForDetail={selectedMemberForDetail}
            onClearDetail={() => setSelectedMemberForDetail(null)}
          />
        )}
        {adminTab === 'volunteers' && (
          <VolunteerDirectory />
        )}
        {adminTab === 'add-member' && (
          <MemberManagement />
        )}
        {adminTab === 'reports' && (
          <ReportsExportPage />
        )}
        {adminTab === 'excel-export' && (
          <ReportsExportPage />
        )}
        {adminTab === 'settings' && (
          <AdminSettings />
        )}
      </AdminLayout>
    );
  }

  // =========================================================================
  // SCENARIO 2: PUBLIC WEBSITE (www.wetheleader.online / wetheleader.online)
  // Clean public experience without Admin Portal header button
  // =========================================================================
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA] text-[#20223E]">
      <Header 
        currentView={currentView} 
        onNavigate={(view) => setCurrentView(view)} 
        isAdminLoggedIn={isAdminLoggedIn} 
      />

      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage 
            onRegisterClick={() => {
              setCurrentView('register');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onDownloadIdClick={() => {
              setCurrentView('download-id');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'download-id' && (
          <DownloadIdCardPage 
            onBackToHome={() => {
              setCurrentView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'about' && (
          <AboutUsPage 
            onBackToHome={() => {
              setCurrentView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onRegisterClick={() => {
              setCurrentView('register');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'register' && (
          <RegistrationPage 
            onSuccess={handleRegistrationSuccess}
            onCancel={() => setCurrentView('home')}
          />
        )}

        {currentView === 'success' && recentCreatedMember && (
          <RegistrationSuccessPage 
            member={recentCreatedMember}
            onHomeClick={() => {
              setCurrentView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      <Footer onNavigate={(view) => setCurrentView(view)} />

      {/* =========================================================================
          QR CODE VERIFICATION RESULT MODAL
         ========================================================================= */}
      {(verifiedMember || invalidVerifyId) && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center animate-fadeIn">
            
            {verifiedMember ? (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 text-[#91BD32] flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <ShieldCheck className="w-10 h-10 text-[#91BD32]" />
                </div>

                <span className="text-[10px] font-black tracking-widest text-[#91BD32] uppercase block">
                  OFFICIAL VERIFIED MEMBER
                </span>
                <h3 className="text-lg font-black text-[#20223E] mt-0.5">
                  {verifiedMember.full_name}
                </h3>

                <div className="my-3 p-2 bg-[#F5F7FA] rounded-xl border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">MEMBERSHIP NUMBER</span>
                  <span className="font-mono text-sm font-black text-[#20223E] tracking-wider">
                    {verifiedMember.membership_number}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 text-left bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#E98A32] flex-shrink-0" />
                    <span>{verifiedMember.village_name || 'Kinathukadavu'} {verifiedMember.ward_number ? `(${verifiedMember.ward_number})` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#2878B9] flex-shrink-0" />
                    <span>Registered: {verifiedMember.registration_date ? new Date(verifiedMember.registration_date).toLocaleDateString() : '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#91BD32] flex-shrink-0" />
                    <span className="font-bold text-green-700">Status: Active Registered Member</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 mb-4">
                  WE the Leader &bull; Kinathukadavu, Coimbatore
                </p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-[#20223E]">Record Not Found</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  No registered membership found for: <code className="font-mono">{invalidVerifyId}</code>
                </p>
              </>
            )}

            <button
              onClick={closeVerificationModal}
              className="w-full py-2.5 rounded-xl bg-[#20223E] hover:bg-[#2c2f54] text-white text-xs font-bold transition-all cursor-pointer"
            >
              OK / Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

// Simple app navigation state hook
function useAppState() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [recentCreatedMember, setRecentCreatedMember] = useState<Member | null>(null);

  return {
    currentView,
    setCurrentView,
    recentCreatedMember,
    setRecentCreatedMember
  };
}
