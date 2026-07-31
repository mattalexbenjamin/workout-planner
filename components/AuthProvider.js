'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { refreshGoogleToken } from '@/lib/gcalendar';

const AuthContext = createContext({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {}
});

export function AuthProvider({ children }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [providerToken, setProviderToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('nexus_provider_token');
      if (cached) setProviderToken(cached);
    }

    async function initAuth() {
      const { data: { session: activeSession } } = await supabase.auth.getSession();

      if (activeSession) {
        setSession(activeSession);
        setUser(activeSession.user || null);
        await syncSessionTokens(activeSession);
        const fetchedProfile = await fetchProfile(activeSession.user.id);

        // Auto-refresh Google access token if current access token missing/expired but refresh token exists
        const currentToken = activeSession.provider_token || (typeof window !== 'undefined' ? localStorage.getItem('nexus_provider_token') : null);
        const refreshToken = activeSession.provider_refresh_token || (typeof window !== 'undefined' ? localStorage.getItem('nexus_provider_refresh_token') : null) || fetchedProfile?.gcal_refresh_token;

        if (refreshToken && !currentToken) {
          const newToken = await refreshGoogleToken(refreshToken);
          if (newToken) setProviderToken(newToken);
        }
      }

      setLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);

        if (newSession) {
          await syncSessionTokens(newSession);
          if (newSession.user) {
            await fetchProfile(newSession.user.id);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    }

    initAuth();
  }, [supabase]);

  async function syncSessionTokens(sess) {
    if (!sess) return;
    if (sess.provider_token) {
      setProviderToken(sess.provider_token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('nexus_provider_token', sess.provider_token);
      }
    }
    if (sess.provider_refresh_token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('nexus_provider_refresh_token', sess.provider_refresh_token);
      }
      if (sess.user) {
        await supabase
          .from('profiles')
          .update({ gcal_refresh_token: sess.provider_refresh_token })
          .eq('id', sess.user.id);
      }
    }
  }

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data);
        return data;
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
    return null;
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    if (error) console.error('OAuth sign in error:', error);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProviderToken(null);
    setProfile(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nexus_provider_token');
      localStorage.removeItem('nexus_provider_refresh_token');
    }
  }

  const effectiveSession = session
    ? {
        ...session,
        provider_token: session.provider_token || providerToken,
      }
    : providerToken
    ? { provider_token: providerToken }
    : null;

  return (
    <AuthContext.Provider value={{
      user,
      session: effectiveSession,
      profile,
      loading,
      signInWithGoogle,
      signOut,
      refreshProfile: () => user && fetchProfile(user.id)
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
