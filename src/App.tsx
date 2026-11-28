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
import { SEOHead } from './components/SEOHead';
import { getOrganizationSchema, getWebSiteSchema, getPersonSchema } from './utils/seo';

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

  const navigateToView = (view: string, pushHistory = true) => {
    setCurrentView(view);
    if (pushHistory && typeof window !== 'undefined') {
      const urlPath = view === 'home' ? '/' : `/${view}`;
      window.history.pushState({ view }, '', urlPath);
    }
  };

  // Check URL query params, hash and clean pathname on mount & popstate
  useEffect(() => {
    const handleLocationChange = () => {
      if (typeof window === 'undefined') return;
      const pathname = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
      const hash = window.location.hash.toLowerCase();
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
      const view = params.get('view');

      if (pathname === '/about' || view === 'about' || hash === '#about' || hash === '#about-us') {
        setCurrentView('about');
      } else if (pathname === '/register' || view === 'register' || hash === '#register') {
        setCurrentView('register');
      } else if (pathname === '/download-id' || action === 'download-id' || hash === '#download-id') {
        setCurrentView('download-id');
      } else if (pathname === '/' || pathname === '') {
        setCurrentView('home');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
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
      {/* Dynamic SEO Head Management */}
      {currentView === 'home' && (
        <SEOHead 
          title="We The Leader Kinathukadavu | Youth Leadership & Social Service"
          description="We The Leader is a youth leadership and social service organisation in Kinathukadavu, Coimbatore, Tamil Nadu, focused on community development and positive social change."
          keywords={[
            'We The Leader',
            'We The Leader Kinathukadavu',
            'APA Manikandakumar',
            'We The Leader Coimbatore',
            'We The Leader Pollachi',
            'Social service organisation in Kinathukadavu',
            'Youth leadership organisation in Coimbatore',
            'Community service in Kinathukadavu',
            'Youth development in Pollachi',
            'Social activities in Coimbatore',
            'நாம் தி லீடர் கிணத்துக்கடவு',
            'கிணத்துக்கடவு சமூக சேவை அமைப்பு',
            'கிணத்துக்கடவு இளைஞர் அமைப்பு',
            'கோயம்புத்தூர் சமூக சேவை',
            'இளைஞர் தலைமைத்துவ அமைப்பு'
          ]}
          canonicalUrl="https://wetheleader.online/"
          ogType="website"
          schemas={[getOrganizationSchema(), getWebSiteSchema()]}
        />
      )}

      {currentView === 'about' && (
        <SEOHead 
          title="APA Manikandakumar | We The Leader Kinathukadavu"
          description="Learn about APA Manikandakumar and We The Leader, a youth leadership and social service organisation working in Kinathukadavu, Coimbatore district, Tamil Nadu."
          keywords={[
            'APA Manikandakumar',
            'APA Manikandakumar Kinathukadavu',
            'We The Leader',
            'We The Leader Kinathukadavu',
            'Youth leadership organisation in Coimbatore',
            'Community service in Kinathukadavu',
            'Youth development in Pollachi',
            'திரு APA மணிகண்டகுமார்',
            'நாம் தி லீடர் கிணத்துக்கடவு'
          ]}
          canonicalUrl="https://wetheleader.online/about"
          ogImage="https://wetheleader.online/apa-manikandakumar.jpg"
          ogType="profile"
          breadcrumbs={[
            { name: 'Home', url: '/' },
            { name: 'APA Manikandakumar (About)', url: '/about' }
          ]}
          schemas={[getPersonSchema(), getOrganizationSchema()]}
        />
      )}

      {currentView === 'register' && (
        <SEOHead 
          title="Member Registration | We The Leader Kinathukadavu"
          description="Join We The Leader Kinathukadavu as an active member or volunteer. 1-minute digital registration for youth leadership and community service in Coimbatore district."
          keywords={[
            'We The Leader registration',
            'volunteer registration Kinathukadavu',
            'youth membership Coimbatore',
            'social service volunteer Pollachi',
            'உறுப்பினர் பதிவு நாம் தி லீடர்'
          ]}
          canonicalUrl="https://wetheleader.online/register"
          breadcrumbs={[
            { name: 'Home', url: '/' },
            { name: 'Member Registration', url: '/register' }
          ]}
        />
      )}

      {currentView === 'download-id' && (
        <SEOHead 
          title="Download Membership ID Card | We The Leader Kinathukadavu"
          description="Download or print your official We The Leader digital membership ID card. Verified digital card for active members in Kinathukadavu and Coimbatore."
          canonicalUrl="https://wetheleader.online/download-id"
          noindex={true}
          breadcrumbs={[
            { name: 'Home', url: '/' },
            { name: 'Download ID Card', url: '/download-id' }
          ]}
        />
      )}

      {currentView === 'success' && (
        <SEOHead 
          title="Registration Successful | We The Leader Kinathukadavu"
          description="Welcome to We The Leader Kinathukadavu. Your official digital membership has been created."
          canonicalUrl="https://wetheleader.online/register"
          noindex={true}
        />
      )}

      <Header 
        currentView={currentView} 
        onNavigate={(view) => navigateToView(view)} 
        isAdminLoggedIn={isAdminLoggedIn} 
      />

      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage 
            onRegisterClick={() => {
              navigateToView('register');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onDownloadIdClick={() => {
              navigateToView('download-id');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'download-id' && (
          <DownloadIdCardPage 
            onBackToHome={() => {
              navigateToView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'about' && (
          <AboutUsPage 
            onBackToHome={() => {
              navigateToView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onRegisterClick={() => {
              navigateToView('register');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'register' && (
          <RegistrationPage 
            onSuccess={handleRegistrationSuccess}
            onCancel={() => {
              navigateToView('home');
            }}
          />
        )}

        {currentView === 'success' && recentCreatedMember && (
          <RegistrationSuccessPage 
            member={recentCreatedMember}
            onHomeClick={() => {
              navigateToView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      <Footer onNavigate={(view) => navigateToView(view)} />

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
