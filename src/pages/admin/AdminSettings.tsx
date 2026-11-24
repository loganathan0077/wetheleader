import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Terminal, 
  ShieldCheck,
  Server
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { t, language } = useLanguage();
  const [copiedSchema, setCopiedSchema] = useState(false);

  const sqlSchemaScript = `-- ==============================================================================
-- WE THE LEADER - COMPLETE MEMBERSHIP REGISTRATION APPLICATION
-- Run this in your Supabase SQL Editor:
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.membership_counters (
    year INT PRIMARY KEY,
    last_sequence INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    address TEXT,
    district TEXT NOT NULL DEFAULT 'Coimbatore',
    village_name TEXT,
    ward_number TEXT,
    occupation TEXT,
    voter_id_number TEXT,
    aadhaar_number TEXT,
    profile_photo_url TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    consent_given BOOLEAN NOT NULL DEFAULT true,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_members_mobile ON public.members (mobile_number);
CREATE INDEX IF NOT EXISTS idx_members_membership_number ON public.members (membership_number);
CREATE INDEX IF NOT EXISTS idx_members_village ON public.members (village_name);
CREATE INDEX IF NOT EXISTS idx_members_ward ON public.members (ward_number);
CREATE INDEX IF NOT EXISTS idx_members_reg_date ON public.members (registration_date DESC);

CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT 'WE the Leader Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE OR REPLACE FUNCTION public.generate_next_membership_number()
RETURNS TEXT AS $$
DECLARE
    current_yr INT;
    next_seq INT;
    result_id TEXT;
BEGIN
    current_yr := EXTRACT(YEAR FROM CURRENT_DATE);

    INSERT INTO public.membership_counters (year, last_sequence, updated_at)
    VALUES (current_yr, 1, timezone('utc'::text, now()))
    ON CONFLICT (year)
    DO UPDATE SET 
        last_sequence = public.membership_counters.last_sequence + 1,
        updated_at = timezone('utc'::text, now())
    RETURNING last_sequence INTO next_seq;

    result_id := 'WTL-' || current_yr::TEXT || '-' || LPAD(next_seq::TEXT, 5, '0');
    RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public anonymous insert members"
ON public.members FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admin full access members"
ON public.members FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Public select member by id"
ON public.members FOR SELECT
TO anon
USING (true);

CREATE POLICY "Public run counter via RPC"
ON public.membership_counters FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

GRANT EXECUTE ON FUNCTION public.generate_next_membership_number() TO anon, authenticated;
`;

  const handleCopySchema = () => {
    navigator.clipboard.writeText(sqlSchemaScript);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h1 className="text-2xl font-black text-[#20223E]">{t('settingsTitle')}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {t('settingsSubtitle')}
        </p>
      </div>

      {/* Supabase Connection Status Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isSupabaseConfigured ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#20223E]">{t('supabaseStatus')}</h2>
              <p className="text-xs text-slate-500">
                {isSupabaseConfigured ? t('connected') : t('localMode')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              isSupabaseConfigured ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-green-500' : 'bg-amber-500'}`} />
              {isSupabaseConfigured ? 'Live Supabase' : 'Active / Persistent'}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {t('supabaseConfigHelp')}
        </p>
      </div>

      {/* SQL Migration Script Box */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#2878B9]" />
            <h2 className="text-base font-bold text-[#20223E]">PostgreSQL Database Schema & RPC</h2>
          </div>

          <button
            onClick={handleCopySchema}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#20223E] hover:bg-[#2c2f54] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            {copiedSchema ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#91BD32]" />
                <span className="text-[#91BD32]">{t('sqlSchemaCopied')}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{t('sqlSchemaCopyBtn')}</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-60 border border-slate-800">
          <pre>{sqlSchemaScript}</pre>
        </div>
      </div>

      {/* Organization Info Box */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-3">
        <h2 className="text-base font-bold text-[#20223E] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#91BD32]" />
          <span>WE the Leader &bull; Official Organization Profile</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 font-bold block">Organization</span>
            <span className="font-bold text-[#20223E]">WE the Leader</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 font-bold block">Tagline</span>
            <span className="font-bold text-[#91BD32]">LEAD THE CHANGE</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 font-bold block">Constituency & District</span>
            <span className="font-bold text-[#20223E]">Kinathukadavu, Coimbatore</span>
          </div>
        </div>
      </div>

    </div>
  );
};
