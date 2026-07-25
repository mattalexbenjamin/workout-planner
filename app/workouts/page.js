'use client';

import React, { useState } from 'react';
import { ATHLETIC_WORKOUTS, getExerciseGuideUrl } from '@/lib/workouts-catalog';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { createGoogleCalendarEvent } from '@/lib/gcalendar';
import { Dumbbell, Clock, Flame, CheckCircle, ExternalLink } from 'lucide-react';

export default function WorkoutsPage() {
  const { user, session, profile } = useAuth();
  const [supabase] = useState(() => createClient());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeModalWorkout, setActiveModalWorkout] = useState(null);
  const [logSuccess, setLogSuccess] = useState(null);

  const categories = [
    { id: 'all', label: 'All (20)' },
    { id: 'weightlifting', label: 'Weightlifting' },
    { id: 'running', label: 'Running' },
    { id: 'volleyball', label: 'Volleyball' },
    { id: 'flag_football', label: 'Flag Football' },
    { id: 'recovery', label: 'Recovery' },
  ];

  const filteredWorkouts = selectedCategory === 'all'
    ? ATHLETIC_WORKOUTS
    : ATHLETIC_WORKOUTS.filter(w => w.category === selectedCategory);

  async function handleLogWorkout(workout) {
    const currentDateStr = new Date().toISOString().split('T')[0];
    const newLog = {
      user_id: user?.id,
      date: currentDateStr,
      workout_name: workout.name,
      category: workout.category,
      duration: workout.duration,
      volume_load: 0,
      exercises: workout.exercises,
      notes: workout.description
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

    setLogSuccess(workout.name);
    setTimeout(() => setLogSuccess(null), 3000);
    setActiveModalWorkout(null);
  }

  return (
    <div>
      <div className="card-header" style={{ marginBottom: 20 }}>
        <h2>Curated Athletic Catalog</h2>
        <span className="card-description">20 elite programmed workouts tailored for multi-sport performance.</span>
      </div>

      {logSuccess && (
        <div style={{ backgroundColor: 'var(--color-success-dim)', border: '1px solid var(--color-success)', color: 'var(--color-success)', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', marginBottom: 16, fontSize: '0.9rem' }}>
          ✓ Successfully logged <strong>{logSuccess}</strong> to your profile!
        </div>
      )}

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 20 }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Workout Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredWorkouts.map(workout => (
          <div key={workout.id} className="dashboard-card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3>{workout.name}</h3>
                <span className="badge-tag gold" style={{ fontSize: '0.65rem' }}>{workout.category}</span>
              </div>
              <div style={{ display: 'flex', gap: 14, color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginTop: 4 }}>
                <span><Clock size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {workout.duration} Mins</span>
                <span><Flame size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Intensity {workout.intensity}/10</span>
              </div>
            </div>
            <p className="card-description">{workout.description}</p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-secondary btn-block"
                onClick={() => setActiveModalWorkout(workout)}
              >
                View Exercises ({workout.exercises.length})
              </button>
              <button
                className="btn btn-primary btn-block"
                onClick={() => handleLogWorkout(workout)}
              >
                Log Session
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Workout Detail Modal */}
      {activeModalWorkout && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{activeModalWorkout.name}</h3>
              <button className="btn-close" onClick={() => setActiveModalWorkout(null)}>×</button>
            </div>
            <p className="card-description">{activeModalWorkout.description}</p>

            <h5 style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--color-text-secondary)' }}>Exercise Routine:</h5>
            <ul className="exercise-list" style={{ marginBottom: 20 }}>
              {activeModalWorkout.exercises.map((ex, idx) => (
                <li key={idx} className="exercise-item">
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
                    Guide <ExternalLink size={12} style={{ display: 'inline' }} />
                  </a>
                </li>
              ))}
            </ul>

            <button
              className="btn btn-primary btn-block"
              onClick={() => handleLogWorkout(activeModalWorkout)}
            >
              <CheckCircle size={18} />
              Complete & Log Workout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
