import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  adminUser: AdminUser | null;
  isAdminLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_STORAGE_KEY = 'wtl_admin_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check initial auth state
    const initAuth = async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setAdminUser({
              id: session.user.id,
              email: session.user.email || 'admin@wetheleader.org',
              name: 'WE the Leader Admin'
            });
            setIsLoading(false);
            return;
          }
        }

        // Check local storage session
        const local = localStorage.getItem(ADMIN_STORAGE_KEY);
        if (local) {
          setAdminUser(JSON.parse(local));
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Try Supabase Auth if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: pass
        });

        if (!error && data.user) {
          const user: AdminUser = {
            id: data.user.id,
            email: data.user.email || trimmedEmail,
            name: 'WE the Leader Admin'
          };
          setAdminUser(user);
          localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(user));
          return { success: true };
        }
      } catch (err) {
        console.warn('Supabase Auth error, checking local fallback:', err);
      }
    }

    // 2. Local Fallback Admin Authentication (admin@wetheleader.org / admin123)
    if (
      (trimmedEmail === 'admin@wetheleader.org' || trimmedEmail === 'admin') && 
      (pass === 'admin123' || pass === 'wetheleader2026')
    ) {
      const user: AdminUser = {
        id: 'wtl-admin-01',
        email: 'admin@wetheleader.org',
        name: 'WE the Leader Admin'
      };
      setAdminUser(user);
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(user));
      return { success: true };
    }

    return { 
      success: false, 
      error: 'Invalid credentials. Please use admin@wetheleader.org / admin123 or your Supabase credentials.' 
    };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    setAdminUser(null);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ adminUser, isAdminLoggedIn: !!adminUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
