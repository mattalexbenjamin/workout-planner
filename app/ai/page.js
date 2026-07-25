'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { getExerciseGuideUrl } from '@/lib/workouts-catalog';
import { createGoogleCalendarEvent } from '@/lib/gcalendar';
import { Bot, Sparkles, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function AICoachPage() {
  const { user, session, profile } = useAuth();
  const [supabase] = useState(() => createClient());

  const [prompt, setPrompt] = useState('');
  const [equipment, setEquipment] = useState('Full Gym');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [aiWorkout, setAiWorkout] = useState(null);
  const [rerollingIndex, setRerollingIndex] = useState(null);
  const [rerollReason, setRerollReason] = useState('');
  const [logSuccess, setLogSuccess] = useState(false);

  async function handleGenerateWorkout() {
    setLoading(true);
    setError('');
    setLogSuccess(false);

    const apiKey = profile?.gemini_api_key || profile?.openai_api_key || localStorage.getItem('apex_gemini_api_key');
    const provider = profile?.ai_provider || 'gemini';

    if (!apiKey) {
      setError('Please add your Gemini or OpenAI API key in the Settings tab to use the AI Coach.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          provider,
          prompt,
          equipment,
          userWeight: profile?.current_weight || 190
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate workout');

      setAiWorkout(data.workout);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRerollExercise(index) {
    const apiKey = profile?.gemini_api_key || profile?.openai_api_key || localStorage.getItem('apex_gemini_api_key');
    const provider = profile?.ai_provider || 'gemini';

    if (!apiKey || !aiWorkout) return;

    setRerollingIndex(index);

    try {
      const targetEx = aiWorkout.exercises[index];
      const res = await fetch('/api/ai/reroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          provider,
          exerciseName: targetEx.name,
          reason: rerollReason
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to re-roll exercise');

      const updatedExercises = [...aiWorkout.exercises];
      updatedExercises[index] = data.exercise;

      setAiWorkout({ ...aiWorkout, exercises: updatedExercises });
      setRerollReason('');
    } catch (err) {
      setError(err.message);
    } finally {
      setRerollingIndex(null);
    }
  }

  async function handleLogAIWorkout() {
    if (!aiWorkout) return;

    const currentDateStr = new Date().toISOString().split('T')[0];
    const newLog = {
      user_id: user?.id,
      date: currentDateStr,
      workout_name: aiWorkout.name,
      category: aiWorkout.category || 'weightlifting',
      duration: aiWorkout.duration || 45,
      volume_load: 0,
      exercises: aiWorkout.exercises,
      notes: aiWorkout.description
    };

    if (user) {
      await supabase.from('workout_logs').insert([newLog]);
    } else {
      const existing = JSON.parse(localStorage.getItem('apex_logged_workouts') || '[]');
      localStorage.setItem('apex_logged_workouts', JSON.stringify([newLog, ...existing]));
    }

    if (session?.provider_token && (profile?.auto_sync_gcal !== false)) {
      await createGoogleCalendarEvent(session.provider_token, profile?.selected_calendar_id || 'primary', newLog);
    }

    setLogSuccess(true);
    setTimeout(() => setLogSuccess(false), 3000);
  }

  return (
    <div>
      <div className="card-header" style={{ marginBottom: 20 }}>
        <h2><Bot size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} /> Gemini AI Athletic Coach</h2>
        <span className="card-description">Generate tailored workouts on-the-fly and re-roll individual exercises based on your equipment.</span>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--color-danger-dim)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', marginBottom: 20, fontSize: '0.85rem' }}>
          <AlertCircle size={16} style={{ display: 'inline', marginRight: 6 }} />
          {error}
        </div>
      )}

      {/* AI Generator Form */}
      <div className="dashboard-card">
        <div className="form-group">
          <label className="form-label">Training Focus or Goals</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. 20-min explosive leg plyos, minimal equipment..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Available Equipment</label>
          <select
            className="form-select"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
          >
            <option value="Full Gym">Full Commercial Gym (Barbells, Cables, Dumbbells)</option>
            <option value="Dumbbells Only">Dumbbells & Bench</option>
            <option value="Bodyweight">Bodyweight / Park Only</option>
            <option value="Bands">Resistance Bands Only</option>
          </select>
        </div>

        <button
          className="btn btn-primary btn-block"
          onClick={handleGenerateWorkout}
          disabled={loading}
        >
          {loading ? (
            <span>Generating Session...</span>
          ) : (
            <>
              <Sparkles size={18} />
              Generate Custom AI Workout
            </>
          )}
        </button>
      </div>

      {/* Generated Workout Display */}
      {aiWorkout && (
        <div className="dashboard-card highlighted">
          <div className="card-header">
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase' }}>
              Custom AI Session
            </span>
            <h3>{aiWorkout.name}</h3>
          </div>
          <p className="card-description">{aiWorkout.description}</p>

          <h5 style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--color-text-secondary)' }}>Generated Routine:</h5>
          <ul className="exercise-list" style={{ marginBottom: 20 }}>
            {aiWorkout.exercises.map((ex, idx) => (
              <li key={idx} className="exercise-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="exercise-info">
                    <h5>{ex.name}</h5>
                    <p>{ex.sets} sets x {ex.reps} {ex.notes && `• ${ex.notes}`}</p>
                  </div>
                  <a
                    href={getExerciseGuideUrl(ex.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="exercise-guide-link"
                  >
                    Guide ↗
                  </a>
                </div>

                {/* Re-roll Control */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Reroll reason (e.g. no cables)..."
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    value={rerollingIndex === idx ? rerollReason : ''}
                    onChange={(e) => setRerollReason(e.target.value)}
                  />
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                    onClick={() => handleRerollExercise(idx)}
                    disabled={rerollingIndex === idx}
                  >
                    <RefreshCw size={12} className={rerollingIndex === idx ? 'animate-spin' : ''} />
                    Re-roll
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {logSuccess ? (
            <div style={{ backgroundColor: 'var(--color-success-dim)', color: 'var(--color-success)', padding: 12, borderRadius: 'var(--border-radius-sm)', textAlign: 'center', fontWeight: 600 }}>
              ✓ AI Workout Logged to Cloud!
            </div>
          ) : (
            <button className="btn btn-primary btn-block" onClick={handleLogAIWorkout}>
              <CheckCircle size={18} />
              Save AI Workout to Cloud
            </button>
          )}
        </div>
      )}
    </div>
  );
}
