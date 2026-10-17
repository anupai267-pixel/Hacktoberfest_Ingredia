import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface AuthContextType {
  user: { id: string; email?: string } | null;
  session: Session | null;
  loading: boolean;
  isDemoMode: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchToDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_KEY = 'ingredia_demo_auth_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsDemoMode(false);
        setLoading(false);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsDemoMode(false);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      // Demo Mode Initializer
      const savedDemoUser = localStorage.getItem(DEMO_USER_KEY);
      if (savedDemoUser) {
        try {
          setUser(JSON.parse(savedDemoUser));
        } catch {
          setUser({ id: 'demo-user-1', email: 'demo@ingredia.app' });
        }
      } else {
        const defaultUser = { id: 'demo-user-1', email: 'demo@ingredia.app' };
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(defaultUser));
        setUser(defaultUser);
      }
      setIsDemoMode(true);
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && supabase && password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      setUser(data.user);
      setIsDemoMode(false);
      return { success: true };
    }

    // Local Demo Login
    const demoUser = { id: `demo-${Date.now()}`, email };
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
    setIsDemoMode(true);
    return { success: true };
  };

  const signup = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && supabase && password) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { success: false, error: error.message };
      setUser(data.user);
      setIsDemoMode(false);
      return { success: true };
    }

    // Local Demo Signup
    const demoUser = { id: `demo-${Date.now()}`, email };
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
    setIsDemoMode(true);
    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(DEMO_USER_KEY);
    setUser(null);
    setSession(null);
  };

  const switchToDemoMode = () => {
    const demoUser = { id: 'demo-user-1', email: 'demo@ingredia.app' };
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
    setIsDemoMode(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isDemoMode,
        login,
        signup,
        logout,
        switchToDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
