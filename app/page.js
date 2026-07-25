'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { ATHLETIC_WORKOUTS, getExerciseGuideUrl } from '@/lib/workouts-catalog';
import { getRecommendation, formatDateKey, calculateSoreness } from '@/lib/recommender';
import { createGoogleCalendarEvent } from '@/lib/gcalendar';
import { Sparkles, Calendar as CalendarIcon, Activity, PlusCircle, CheckCircle, Flame, Dumbbell } from 'lucide-react';

export default function TodayPage() {
  const { user, session, profile } = useAuth();
  const [supabase] = useState(() => createClient());

  const [currentDateStr] = useState(() => formatDateKey(new Date()));
  const [soreness, setSoreness] = useState({ legs: 1, shoulders: 1, core: 1, fatigue: 1 });
  const [workouts, setWorkouts] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  // Custom log form state
  const [customLog, setCustomLog] = useState({
    title: '',
    category: 'weightlifting',
    duration: 45,
    notes: ''
  });

  useEffect(() => {
    fetchUserData();
  }, [user]);

  async function fetchUserData() {
    if (user) {
      // Fetch today's soreness log
      const { data: sData } = await supabase
        .from('soreness_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', currentDateStr)
        .single();

      if (sData) {
        setSoreness({
          legs: sData.legs || 1,
          shoulders: sData.shoulders || 1,
          core: sData.core || 1,
          fatigue: sData.overall_fatigue || 1
        });
      }

      // Fetch logged workouts
      const { data: wData } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (wData) setWorkouts(wData);
    } else {
      // LocalStorage fallback
      const localSoreness = localStorage.getItem('apex_today_soreness');
      if (localSoreness) setSoreness(JSON.parse(localSoreness));

      const localWorkouts = localStorage.getItem('apex_logged_workouts');
      if (localWorkouts) setWorkouts(JSON.parse(localWorkouts));
    }
  }

  useEffect(() => {
    const rec = getRecommendation(currentDateStr, workouts, [], profile || { frequency: 3 });
    setRecommendation(rec);

    const recWorkout = ATHLETIC_WORKOUTS.find(w => w.id === rec.workoutId) || ATHLETIC_WORKOUTS[0];
    setSelectedWorkout(recWorkout);
  }, [currentDateStr, workouts, profile]);

  async function handleSorenessChange(field, val) {
    const updated = { ...soreness, [field]: Number(val) };
    setSoreness(updated);

    if (user) {
      await supabase
        .from('soreness_logs')
        .upsert({
          user_id: user.id,
          date: currentDateStr,
          overall_fatigue: updated.fatigue,
          legs: updated.legs,
          shoulders: updated.shoulders,
          core: updated.core
        }, { onConflict: 'user_id, date' });
    } else {
      localStorage.setItem('apex_today_soreness', JSON.stringify(updated));
    }
  }

  async function handleSaveWorkoutLog(workoutToSave) {
    const newLog = {
      user_id: user?.id,
      date: currentDateStr,
      workout_name: workoutToSave?.name || customLog.title || 'Custom Activity',
      category: workoutToSave?.category || customLog.category,
      duration: Number(workoutToSave?.duration || customLog.duration),
      volume_load: 0,
      exercises: workoutToSave?.exercises || [],
      notes: customLog.notes,
      soreness_snapshot: soreness
    };

    if (user) {
      await supabase.from('workout_logs').insert([newLog]);
    } else {
      const updated = [newLog, ...workouts];
      setWorkouts(updated);
      localStorage.setItem('apex_logged_workouts', JSON.stringify(updated));
    }

    if (session?.provider_token && (profile?.auto_sync_gcal !== false)) {
      await createGoogleCalendarEvent(session.provider_token, profile?.selected_calendar_id || 'primary', newLog);
    }

    setShowLogModal(false);
    fetchUserData();
  }

  return (
    <div>
      {/* Soreness Sliders Card */}
      <div className="dashboard-card">
        <div className="card-header">
          <h3>Daily Soreness & Readiness</h3>
          <span className="card-description">Adjust sliders to calculate optimal daily recommendations.</span>
        </div>

        <div className="slider-group">
          <div className="slider-header">
            <span>Overall Fatigue</span>
            <span className="text-orange">{soreness.fatigue}/5</span>
          </div>
          <input
            type="range" min="1" max="5" step="1"
            className="slider-input"
            value={soreness.fatigue}
            onChange={(e) => handleSorenessChange('fatigue', e.target.value)}
          />
        </div>

        <div className="slider-group">
          <div className="slider-header">
            <span>Legs & Lower Body</span>
            <span className="text-orange">{soreness.legs}/5</span>
          </div>
          <input
            type="range" min="1" max="5" step="1"
            className="slider-input"
            value={soreness.legs}
            onChange={(e) => handleSorenessChange('legs', e.target.value)}
          />
        </div>

        <div className="slider-group">
          <div className="slider-header">
            <span>Shoulders & Arms</span>
            <span className="text-orange">{soreness.shoulders}/5</span>
          </div>
          <input
            type="range" min="1" max="5" step="1"
            className="slider-input"
            value={soreness.shoulders}
            onChange={(e) => handleSorenessChange('shoulders', e.target.value)}
          />
        </div>

        <div className="slider-group">
          <div className="slider-header">
            <span>Core & Back</span>
            <span className="text-orange">{soreness.core}/5</span>
          </div>
          <input
            type="range" min="1" max="5" step="1"
            className="slider-input"
            value={soreness.core}
            onChange={(e) => handleSorenessChange('core', e.target.value)}
          />
        </div>
      </div>

      {/* Recommended Workout Card */}
      {recommendation && (
        <div className="dashboard-card highlighted">
          <div className="card-header">
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <Sparkles size={14} style={{ display: 'inline', marginRight: 4 }} />
              APEX Recommended Session
            </span>
            <h3>{recommendation.name}</h3>
          </div>
          <p className="card-description">{recommendation.reason}</p>

          {selectedWorkout && (
            <div style={{ marginTop: 14 }}>
              <h5 style={{ fontSize: '0.9rem', marginBottom: 8, color: 'var(--color-text-secondary)' }}>Prescribed Exercises:</h5>
              <ul className="exercise-list">
                {selectedWorkout.exercises?.map((ex, idx) => (
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
                      Guide ↗
                    </a>
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-primary btn-block"
                  onClick={() => handleSaveWorkoutLog(selectedWorkout)}
                >
                  <CheckCircle size={18} />
                  Complete Recommended Workout
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button className="btn btn-secondary btn-block" onClick={() => setShowLogModal(true)}>
          <PlusCircle size={18} />
          Log Custom Sport / Lift
        </button>
      </div>

      {/* Custom Log Modal */}
      {showLogModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Log Custom Activity</h3>
              <button className="btn-close" onClick={() => setShowLogModal(false)}>×</button>
            </div>

            <div className="form-group">
              <label className="form-label">Activity Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Beach Volleyball Scrimmage"
                value={customLog.title}
                onChange={(e) => setCustomLog({ ...customLog, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={customLog.category}
                onChange={(e) => setCustomLog({ ...customLog, category: e.target.value })}
              >
                <option value="weightlifting">Weightlifting</option>
                <option value="volleyball">Volleyball</option>
                <option value="flag_football">Flag Football</option>
                <option value="running">Running</option>
                <option value="recovery">Recovery / Mobility</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Duration (Minutes)</label>
              <input
                type="number"
                className="form-input"
                value={customLog.duration}
                onChange={(e) => setCustomLog({ ...customLog, duration: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                placeholder="Session notes or performance details..."
                value={customLog.notes}
                onChange={(e) => setCustomLog({ ...customLog, notes: e.target.value })}
              />
            </div>

            <button className="btn btn-primary btn-block" onClick={() => handleSaveWorkoutLog(null)}>
              Save Activity to Cloud
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
