import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  adminUser: AdminUser | null;
  isAdminLoggedIn: boolean;
  isLoading: boolean;
  login: (emailOrUser: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_STORAGE_KEY = 'wtl_admin_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const client = supabase;
    // 1. If Supabase is configured, use cryptographically verified Supabase Auth sessions
    if (isSupabaseConfigured && client) {
      const checkSession = async () => {
        try {
          const { data: { session }, error } = await client.auth.getSession();
          if (!error && session?.user) {
            setAdminUser({
              id: session.user.id,
              email: session.user.email || 'Admin',
              name: 'WE the Leader Admin'
            });
          } else {
            // Untrusted client storage must be cleared if no valid Supabase session exists
            setAdminUser(null);
            localStorage.removeItem(ADMIN_STORAGE_KEY);
          }
        } catch (err) {
          console.error('Supabase Auth verification error:', err);
          setAdminUser(null);
          localStorage.removeItem(ADMIN_STORAGE_KEY);
        } finally {
          setIsLoading(false);
        }
      };

      checkSession();

      // Listen for token refresh or logout events from Supabase Auth
      const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          setAdminUser({
            id: session.user.id,
            email: session.user.email || 'Admin',
            name: 'WE the Leader Admin'
          });
        } else {
          setAdminUser(null);
          localStorage.removeItem(ADMIN_STORAGE_KEY);
        }
        setIsLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    }

    // 2. Offline / Local Development fallback (strictly when Supabase is not configured)
    try {
      if (import.meta.env.DEV) {
        const local = localStorage.getItem(ADMIN_STORAGE_KEY);
        if (local) {
          setAdminUser(JSON.parse(local));
        }
      }
    } catch (err) {
      console.warn('Local session read error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (emailOrUser: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const rawInput = (emailOrUser || '').trim();
    if (!rawInput || !pass) {
      return { success: false, error: 'Please enter both username/email and password.' };
    }

    // Standardize input: if user enters shorthand like 'kkd', format as email
    const fullEmail = rawInput.includes('@') ? rawInput.toLowerCase() : `${rawInput.toLowerCase()}@wetheleader.com`;

    // 1. PRIMARY: Authenticate via Supabase Auth (server-side bcrypt / argon2 encryption)
    const client = supabase;
    if (isSupabaseConfigured && client) {
      try {
        const { data, error } = await client.auth.signInWithPassword({
          email: fullEmail,
          password: pass
        });

        if (error) {
          console.error('Supabase authentication failed:', error.message);
          return { 
            success: false, 
            error: error.message || 'Invalid username or password.' 
          };
        }

        if (data.user) {
          const user: AdminUser = {
            id: data.user.id,
            email: data.user.email || fullEmail,
            name: 'WE the Leader Admin'
          };
          setAdminUser(user);
          localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(user));
          return { success: true };
        }
      } catch (err: any) {
        console.error('Supabase auth network error:', err);
        return { 
          success: false, 
          error: `Authentication server error: ${err.message || 'Please check your connection.'}` 
        };
      }
    }

    // 2. OFFLINE DEVELOPMENT MODE ONLY
    // Strictly allowed in local development (import.meta.env.DEV) when Supabase is not configured
    if (import.meta.env.DEV && !isSupabaseConfigured) {
      // Local dev testing credentials
      const validDevUser = fullEmail === 'kkd@wetheleader.com' || fullEmail === 'admin@wetheleader.org';
      const validDevPass = pass === 'KKD@wetheleader2026' || pass === 'admin123';

      if (validDevUser && validDevPass) {
        const user: AdminUser = {
          id: 'dev-admin-local',
          email: fullEmail,
          name: 'WE the Leader Admin (Local Dev Mode)'
        };
        setAdminUser(user);
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(user));
        return { success: true };
      }

      return { 
        success: false, 
        error: 'Invalid dev credentials. Please check your username and password.' 
      };
    }

    // Production environment without Supabase configuration is strictly blocked
    return { 
      success: false, 
      error: 'Authentication service is unavailable. Please configure Supabase in your environment.' 
    };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Error signing out of Supabase:', err);
      }
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
