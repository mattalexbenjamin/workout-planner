'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

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
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      setSession(activeSession);
      setUser(activeSession?.user || null);

      if (activeSession?.user) {
        await fetchProfile(activeSession.user.id);
      }
      setLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);
        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    }

    initAuth();
  }, [supabase]);

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'https://www.googleapis.com/auth/calendar.readonly'
      }
    });
    if (error) console.error('OAuth sign in error:', error);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
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
