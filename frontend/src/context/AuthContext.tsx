import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { getSession, signOut as authSignOut, EmployeeUser } from '../services/authService';
import { Profile } from '../types';

interface AuthContextType {
  session: any | null;
  user: EmployeeUser | null;
  profile: Profile | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<EmployeeUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Init Session - Check Once, Trust It
  const initSession = async () => {
    try {
      console.log('[AuthContext] initSession started');
      const sessionData = await getSession(); // This gets session + checks employees table (if we keep logic there)
      // Wait, we removed logic from signIn, but getSession might still have it?
      // Let's check getSession implementation in authService...
      // verified: getSession implementation still queries employees table. We should probably keep that for session hydration validation.

      if (sessionData) {
        setSession(sessionData);
        setUser(sessionData.user);
        setProfile(sessionData.user);
      } else {
        console.log('[AuthContext] No valid session found via getSession.');
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    } catch (e) {
      console.error('[AuthContext] Failed to init session (network or other)', e);
      // DO NOT force sign out here. Just assume no session for now.
      setSession(null);
      setUser(null);
      setProfile(null);
    } finally {
      console.log('[AuthContext] Setting loading false');
      setLoading(false);
    }
  };

  useEffect(() => {
    initSession();

    // Safety timeout: force loading to false after 3 seconds if still true
    const timeoutId = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn('[AuthContext] Safety timeout triggered - forcing loading false');
          return false;
        }
        return prev;
      });
    }, 3000);

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthContext] Auth State Change: ${event}`);

      if (event === 'SIGNED_IN') {
        // Only set loading true for initial sign in to prevent flash
        // But for "Auth First", maybe we don't even need to block?
        // Let's keep it safe.
        // setLoading(true); // User wants NO spinners on nav.
        await initSession();
      } else if (event === 'TOKEN_REFRESHED') {
        // SILENT UPDATE - NO SPINNER
        console.log('[AuthContext] Token refreshed silently.');
        // We can optionally update session state if needed, but usually supa handle it
        // await initSession(); // Optional, but if we do, make sure initSession doesn't set loading(true)
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        localStorage.clear();
      } else if ((event as string) === 'TOKEN_REFRESH_FAILED') {
        console.error('[AuthContext] Token refresh failed.');
        // If refresh fails, we might eventually need to logout, but let's be lenient
      }
    });

    return () => {
      clearTimeout(timeoutId);
      authListener.subscription.unsubscribe();
    };
  }, []);



  const signOut = async () => {
    await authSignOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const value = {
    session,
    user,
    profile,
    role: profile?.role || null,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
