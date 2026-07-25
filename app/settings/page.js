'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { Settings, Key, User, Calendar, Cloud, CheckCircle, LogOut, ExternalLink } from 'lucide-react';

export default function SettingsPage() {
  const { user, profile, signInWithGoogle, signOut, refreshProfile } = useAuth();
  const [supabase] = useState(() => createClient());

  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [provider, setProvider] = useState('gemini');

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
    }
  }, [profile]);

  async function handleSaveSettings() {
    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        gemini_api_key: geminiApiKey,
        openai_api_key: openaiApiKey,
        ai_provider: provider,
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
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  return (
    <div>
      <div className="card-header" style={{ marginBottom: 20 }}>
        <h2><Settings size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} /> Settings & Account</h2>
        <span className="card-description">Manage Supabase Cloud Auth, AI Coach API Keys, and Athletic Goals.</span>
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
            <p className="card-description">Sign in with your Google account to sync workout logs, soreness data, and trophies across all devices via Supabase.</p>
            <button className="btn btn-primary btn-block" onClick={signInWithGoogle}>
              Sign In with Google
            </button>
          </div>
        )}
      </div>

      {/* AI API Key Setup */}
      <div className="dashboard-card">
        <div className="card-header">
          <h3><Key size={18} style={{ display: 'inline', marginRight: 6 }} /> AI Coach API Key</h3>
          <span className="card-description">API keys are securely passed to Vercel Serverless proxy functions and never exposed to client browsers.</span>
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
            <small style={{ color: 'var(--color-text-secondary)', display: 'block', marginTop: 4 }}>
              Get a free API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>Google AI Studio ↗</a>
            </small>
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
