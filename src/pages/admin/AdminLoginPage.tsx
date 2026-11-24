import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';

interface AdminLoginPageProps {
  onBackToHome: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onBackToHome, onLoginSuccess }) => {
  const { t, language } = useLanguage();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        onLoginSuccess();
      } else {
        setErrorMsg(res.error || t('adminInvalidCreds'));
      }
    } catch {
      setErrorMsg(t('adminInvalidCreds'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        
        {/* Back Link */}
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#20223E] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('btnBackHome')}</span>
        </button>

        {/* Card Box */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-[#20223E] text-white p-6 text-center border-b-4 border-[#91BD32]">
            <div className="bg-white p-2 rounded-xl inline-block shadow mb-3">
              <img 
                src="/logo.svg" 
                alt="WE the Leader Logo" 
                className="h-12 w-auto object-contain mx-auto"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('we-the-leader-logo.jpg')) {
                    target.src = '/we-the-leader-logo.jpg';
                  }
                }}
              />
            </div>
            <h1 className="text-xl font-black text-white">{t('adminLoginTitle')}</h1>
            <p className="text-xs font-bold text-[#91BD32] uppercase tracking-wider mt-0.5">
              {t('tagline')}
            </p>
            <p className="text-[11px] text-slate-300 mt-1">
              {t('adminLoginSubtitle')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs font-semibold animate-fadeIn">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('adminEmailLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('adminEmailPlaceholder')}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-[#F5F7FA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#91BD32] focus:border-[#91BD32]"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('adminPasswordLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('adminPasswordPlaceholder')}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-[#F5F7FA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#91BD32] focus:border-[#91BD32]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#91BD32] hover:bg-[#80a82b] disabled:bg-slate-300 text-[#20223E] font-black text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#20223E] border-t-transparent rounded-full animate-spin" />
                  <span>{t('adminLoggingIn')}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>{t('adminLoginBtn')}</span>
                </>
              )}
            </button>

            {/* Helper Credentials Hint for convenience */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-[11px] text-slate-500 space-y-0.5">
              <span className="font-bold text-slate-700 block">Single Admin Access</span>
              <span>Default: <code className="bg-slate-200 px-1 py-0.5 rounded text-[#20223E] font-mono">admin@wetheleader.org</code> / <code className="bg-slate-200 px-1 py-0.5 rounded text-[#20223E] font-mono">admin123</code></span>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
};
