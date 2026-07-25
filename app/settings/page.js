'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { fetchUserCalendars } from '@/lib/gcalendar';
import { Settings, Key, User, Calendar, Cloud, CheckCircle, LogOut, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const { user, session, profile, signInWithGoogle, signOut, refreshProfile } = useAuth();
  const [supabase] = useState(() => createClient());

  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [provider, setProvider] = useState('gemini');

  // Google Calendar Integration states
  const [userCalendars, setUserCalendars] = useState([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState('primary');
  const [autoSyncGcal, setAutoSyncGcal] = useState(true);
  const [loadingCalendars, setLoadingCalendars] = useState(false);

  const [goals, setGoals] = useState({
    startWeight: 195,
    targetWeight: 180,
    currentWeight: 193,
    calories: 2200,
    protein: 180,
    frequency: 3
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setGeminiApiKey(profile.gemini_api_key || '');
      setOpenaiApiKey(profile.openai_api_key || '');
      setProvider(profile.ai_provider || 'gemini');
      setSelectedCalendarId(profile.selected_calendar_id || 'primary');
      setAutoSyncGcal(profile.auto_sync_gcal !== undefined ? profile.auto_sync_gcal : true);

      setGoals({
        startWeight: profile.start_weight || 195,
        targetWeight: profile.target_weight || 180,
        currentWeight: profile.current_weight || 193,
        calories: profile.calories || 2200,
        protein: profile.protein || 180,
        frequency: profile.frequency || 3
      });
    } else {
      const localKey = localStorage.getItem('apex_gemini_api_key');
      if (localKey) setGeminiApiKey(localKey);

      const localCalId = localStorage.getItem('apex_selected_calendar_id');
      if (localCalId) setSelectedCalendarId(localCalId);

      const localAutoSync = localStorage.getItem('apex_auto_sync_gcal');
      if (localAutoSync !== null) setAutoSyncGcal(localAutoSync === 'true');
    }
  }, [profile]);

  useEffect(() => {
    if (session?.provider_token) {
      loadCalendars(session.provider_token);
    }
  }, [session]);

  async function loadCalendars(token) {
    setLoadingCalendars(true);
    const cals = await fetchUserCalendars(token);
    setUserCalendars(cals);
    setLoadingCalendars(false);
  }

  async function handleSaveSettings() {
    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        gemini_api_key: geminiApiKey,
        openai_api_key: openaiApiKey,
        ai_provider: provider,
        selected_calendar_id: selectedCalendarId,
        auto_sync_gcal: autoSyncGcal,
        start_weight: Number(goals.startWeight),
        target_weight: Number(goals.targetWeight),
        current_weight: Number(goals.currentWeight),
        calories: Number(goals.calories),
        protein: Number(goals.protein),
        frequency: Number(goals.frequency),
        updated_at: new Date().toISOString()
      });
      await refreshProfile();
    } else {
      localStorage.setItem('apex_gemini_api_key', geminiApiKey);
      localStorage.setItem('apex_selected_calendar_id', selectedCalendarId);
      localStorage.setItem('apex_auto_sync_gcal', String(autoSyncGcal));
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  return (
    <div>
      <div className="card-header" style={{ marginBottom: 20 }}>
        <h2><Settings size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} /> Settings & Account</h2>
        <span className="card-description">Manage Supabase Cloud Auth, Google Calendar Sync, AI Coach API Keys, and Athletic Goals.</span>
      </div>

      {saveSuccess && (
        <div style={{ backgroundColor: 'var(--color-success-dim)', border: '1px solid var(--color-success)', color: 'var(--color-success)', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', marginBottom: 20, fontSize: '0.9rem' }}>
          ✓ Settings saved to cloud profile successfully!
        </div>
      )}

      {/* Cloud Account Card */}
      <div className="dashboard-card">
        <div className="card-header">
          <h3><Cloud size={18} style={{ display: 'inline', marginRight: 6 }} /> Supabase Cloud Auth</h3>
        </div>

        {user ? (
          <div>
            <p className="card-description">Logged in as <strong>{user.email}</strong></p>
            <button className="btn btn-danger btn-block" onClick={signOut}>
              <LogOut size={16} /> Sign Out of APEX
            </button>
          </div>
        ) : (
          <div>
            <p className="card-description">Sign in with your Google account to sync workout logs, soreness data, and your Google Calendar events across all devices.</p>
            <button className="btn btn-primary btn-block" onClick={signInWithGoogle}>
              Sign In with Google
            </button>
          </div>
        )}
      </div>

      {/* Google Calendar Sync Settings */}
      <div className="dashboard-card">
        <div className="card-header">
          <h3><Calendar size={18} style={{ display: 'inline', marginRight: 6 }} /> Google Calendar Sync</h3>
          <span className="card-description">Select which Google Calendar to sync workouts to and fetch events from.</span>
        </div>

        {user ? (
          <div>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Target Google Calendar</label>
                {session?.provider_token && (
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                    onClick={() => loadCalendars(session.provider_token)}
                    disabled={loadingCalendars}
                  >
                    <RefreshCw size={12} style={{ marginRight: 4, display: 'inline' }} />
                    {loadingCalendars ? 'Loading...' : 'Refresh Calendars'}
                  </button>
                )}
              </div>

              <select
                className="form-select"
                value={selectedCalendarId}
                onChange={(e) => setSelectedCalendarId(e.target.value)}
              >
                <option value="primary">Primary Google Calendar</option>
                {userCalendars.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.summary} {cal.primary ? '(Primary)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Auto-Sync Logged Workouts</label>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  Automatically post events to Google Calendar when logging or scheduling workouts.
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoSyncGcal}
                onChange={(e) => setAutoSyncGcal(e.target.checked)}
                style={{ width: 20, height: 20, cursor: 'pointer', accentColor: 'var(--color-accent)' }}
              />
            </div>

            <button className="btn btn-primary btn-block" onClick={handleSaveSettings} style={{ marginTop: 12 }}>
              <CheckCircle size={16} /> Save Calendar Settings
            </button>
          </div>
        ) : (
          <div>
            <p className="card-description" style={{ color: 'var(--color-warning)' }}>
              ⚠️ You must be signed in with Google to enable calendar syncing.
            </p>
            <button className="btn btn-primary btn-block" onClick={signInWithGoogle}>
              Sign In with Google to Connect Calendar
            </button>
          </div>
        )}
      </div>

      {/* AI API Key Setup */}
      <div className="dashboard-card">
        <div className="card-header">
          <h3><Key size={18} style={{ display: 'inline', marginRight: 6 }} /> AI Coach API Key</h3>
          <span className="card-description">API keys are securely passed to Vercel Serverless proxy functions.</span>
        </div>

        <div className="form-group">
          <label className="form-label">Default AI Provider</label>
          <select
            className="form-select"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            <option value="gemini">Google Gemini AI</option>
            <option value="openai">OpenAI (GPT-4o-mini)</option>
          </select>
        </div>

        {provider === 'gemini' ? (
          <div className="form-group">
            <label className="form-label">Gemini API Key</label>
            <input
              type="password"
              className="form-input"
              placeholder="AIzaSy..."
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
            />
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">OpenAI API Key</label>
            <input
              type="password"
              className="form-input"
              placeholder="sk-..."
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
            />
          </div>
        )}

        <button className="btn btn-primary btn-block" onClick={handleSaveSettings}>
          <CheckCircle size={16} /> Save API Key Settings
        </button>
      </div>

      {/* Athletic Goals Setup */}
      <div className="dashboard-card">
        <div className="card-header">
          <h3><User size={18} style={{ display: 'inline', marginRight: 6 }} /> Body & Training Goals</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Current Weight (lbs)</label>
            <input
              type="number"
              className="form-input"
              value={goals.currentWeight}
              onChange={(e) => setGoals({ ...goals, currentWeight: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Weight (lbs)</label>
            <input
              type="number"
              className="form-input"
              value={goals.targetWeight}
              onChange={(e) => setGoals({ ...goals, targetWeight: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Target Lift Frequency (Days/Week)</label>
          <input
            type="number"
            className="form-input"
            value={goals.frequency}
            onChange={(e) => setGoals({ ...goals, frequency: e.target.value })}
          />
        </div>

        <button className="btn btn-secondary btn-block" onClick={handleSaveSettings}>
          Update Goals Profile
        </button>
      </div>
    </div>
  );
}
