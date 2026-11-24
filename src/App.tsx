import React, { useState } from 'react';
import { useLanguage } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { RegistrationPage } from './pages/RegistrationPage';
import { RegistrationSuccessPage } from './pages/RegistrationSuccessPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { MemberManagement } from './pages/admin/MemberManagement';
import { ReportsExportPage } from './pages/admin/ReportsExportPage';
import { AdminSettings } from './pages/admin/AdminSettings';
import { Member } from './types';

export const AppContent: React.FC = () => {
  const { currentView, setCurrentView, recentCreatedMember, setRecentCreatedMember } = useAppState();
  const { isAdminLoggedIn } = useAuth();
  const [adminTab, setAdminTab] = useState('dashboard');
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState<Member | null>(null);

  // Handle successful registration
  const handleRegistrationSuccess = (newMember: Member) => {
    setRecentCreatedMember(newMember);
    setCurrentView('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // View member detail directly from dashboard
  const handleViewMemberFromDashboard = (member: Member) => {
    setSelectedMemberForDetail(member);
    setAdminTab('all-members');
  };

  // If viewing admin screens and logged in
  if (currentView.startsWith('admin') && isAdminLoggedIn) {
    return (
      <AdminLayout activeTab={adminTab} onTabChange={setAdminTab}>
        {adminTab === 'dashboard' && (
          <AdminDashboard 
            onNavigate={(tab) => setAdminTab(tab)} 
            onViewMember={handleViewMemberFromDashboard} 
          />
        )}
        {adminTab === 'all-members' && (
          <MemberManagement 
            selectedMemberForDetail={selectedMemberForDetail}
            onClearDetail={() => setSelectedMemberForDetail(null)}
          />
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

  // Admin login screen
  if (currentView === 'admin-login') {
    return (
      <div className="flex flex-col min-h-screen">
        <Header 
          currentView={currentView} 
          onNavigate={(view) => setCurrentView(view)} 
          isAdminLoggedIn={isAdminLoggedIn} 
        />
        <main className="flex-1">
          <AdminLoginPage 
            onBackToHome={() => setCurrentView('home')} 
            onLoginSuccess={() => setCurrentView('admin-dashboard')} 
          />
        </main>
        <Footer onNavigate={(view) => setCurrentView(view)} />
      </div>
    );
  }

  // Public Screens (Home, Register, Success)
  return (
    <div className="flex flex-col min-h-screen">
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
            onAdminClick={() => setCurrentView('admin-login')}
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
