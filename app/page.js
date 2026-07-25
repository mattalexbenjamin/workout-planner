'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { ATHLETIC_WORKOUTS, getExerciseGuideUrl } from '@/lib/workouts-catalog';
import { getRecommendation, formatDateKey } from '@/lib/recommender';
import { createGoogleCalendarEvent, getSavedCalendarId } from '@/lib/gcalendar';
import { 
  Sparkles, Calendar as CalendarIcon, Activity, PlusCircle, CheckCircle, 
  Flame, Dumbbell, Trash2, Check, Target, Zap, ChevronDown, ChevronUp
} from 'lucide-react';

const DEFAULT_HABITS = [
  { id: 'hydration', name: '💧 Hydration (3L+)' },
  { id: 'sleep', name: '😴 8h Quality Sleep' },
  { id: 'deep_work', name: '🧠 Deep Work Session' },
  { id: 'nutrition', name: '🥗 Clean Nutrition & Protein' },
  { id: 'mobility', name: '🧘 Mobility & Stretching' },
];

export default function TodayPage() {
  const { user, session, profile } = useAuth();
  const [supabase] = useState(() => createClient());

  const [currentDateStr] = useState(() => formatDateKey(new Date()));
  const [soreness, setSoreness] = useState({ legs: 1, shoulders: 1, core: 1, fatigue: 1 });
  const [showSliders, setShowSliders] = useState(false);
  const [workouts, setWorkouts] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  // Daily Focus Directive
  const [dailyFocus, setDailyFocus] = useState('');
  const [isFocusSaved, setIsFocusSaved] = useState(false);

  // Habits & Matrix State
  const [habits, setHabits] = useState(DEFAULT_HABITS);
  const [newHabitName, setNewHabitName] = useState('');
  const [habitLogs, setHabitLogs] = useState({}); // { `${habitId}_${dateStr}`: true/false }

  // Custom log form state
  const [customLog, setCustomLog] = useState({
    title: '',
    category: 'weightlifting',
    duration: 45,
    notes: ''
  });

  const todayColRef = useRef(null);

  // Generate 7-day date range centered around Today
  const datesWindow = React.useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateKey = formatDateKey(d);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const numLabel = d.getDate();
      const isToday = dateKey === currentDateStr;
      list.push({ dateKey, dayLabel, numLabel, isToday });
    }
    return list;
  }, [currentDateStr]);

  useEffect(() => {
    fetchUserData();
  }, [user]);

  // Center scroll onto Today's column on mount
  useEffect(() => {
    if (todayColRef.current) {
      todayColRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [datesWindow]);

  async function fetchUserData() {
    // 1. Fetch Soreness
    if (user) {
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

      // 2. Fetch Workouts
      const { data: wData } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (wData) setWorkouts(wData);

      // 3. Fetch Habits & Habit Logs
      const localCustomHabits = localStorage.getItem(`nexus_custom_habits_${user.id}`);
      if (localCustomHabits) {
        try { setHabits(JSON.parse(localCustomHabits)); } catch (e) {}
      }

      const localLogs = localStorage.getItem(`nexus_habit_logs_${user.id}`);
      if (localLogs) {
        try { setHabitLogs(JSON.parse(localLogs)); } catch (e) {}
      }

      const localFocus = localStorage.getItem(`nexus_daily_focus_${user.id}_${currentDateStr}`);
      if (localFocus) setDailyFocus(localFocus);

    } else {
      // LocalStorage fallbacks
      const localSoreness = localStorage.getItem('nexus_today_soreness');
      if (localSoreness) setSoreness(JSON.parse(localSoreness));

      const localWorkouts = localStorage.getItem('nexus_logged_workouts');
      if (localWorkouts) setWorkouts(JSON.parse(localWorkouts));

      const localHabits = localStorage.getItem('nexus_custom_habits_guest');
      if (localHabits) {
        try { setHabits(JSON.parse(localHabits)); } catch (e) {}
      }

      const localLogs = localStorage.getItem('nexus_habit_logs_guest');
      if (localLogs) {
        try { setHabitLogs(JSON.parse(localLogs)); } catch (e) {}
      }

      const localFocus = localStorage.getItem(`nexus_daily_focus_guest_${currentDateStr}`);
      if (localFocus) setDailyFocus(localFocus);
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
      localStorage.setItem('nexus_today_soreness', JSON.stringify(updated));
    }
  }

  // Habits Management
  function handleAddHabit(e) {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newHabit = {
      id: `custom_${Date.now()}`,
      name: newHabitName.trim()
    };

    const updated = [...habits, newHabit];
    setHabits(updated);
    setNewHabitName('');

    const storageKey = user ? `nexus_custom_habits_${user.id}` : 'nexus_custom_habits_guest';
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }

  function handleDeleteHabit(habitId) {
    const updated = habits.filter(h => h.id !== habitId);
    setHabits(updated);

    const storageKey = user ? `nexus_custom_habits_${user.id}` : 'nexus_custom_habits_guest';
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }

  function toggleHabitCheck(habitId, dateKey) {
    const key = `${habitId}_${dateKey}`;
    const nextLogs = { ...habitLogs, [key]: !habitLogs[key] };
    setHabitLogs(nextLogs);

    const storageKey = user ? `nexus_habit_logs_${user.id}` : 'nexus_habit_logs_guest';
    localStorage.setItem(storageKey, JSON.stringify(nextLogs));
  }

  function handleSaveDailyFocus() {
    const storageKey = user ? `nexus_daily_focus_${user.id}_${currentDateStr}` : `nexus_daily_focus_guest_${currentDateStr}`;
    localStorage.setItem(storageKey, dailyFocus);
    setIsFocusSaved(true);
    setTimeout(() => setIsFocusSaved(false), 2000);
  }

  // Calculate Streak & Stats per habit
  function getHabitStats(habitId) {
    let streak = 0;
    let totalCompleted = 0;

    // Calculate total completed in all logged dates
    Object.keys(habitLogs).forEach(key => {
      if (key.startsWith(`${habitId}_`) && habitLogs[key]) {
        totalCompleted++;
      }
    });

    // Calculate streak counting back from today
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = formatDateKey(d);
      if (habitLogs[`${habitId}_${dateKey}`]) {
        streak++;
      } else if (i > 0) {
        break; // Streak broken
      }
    }

    const completionRate = Math.min(100, Math.round((totalCompleted / 7) * 100));
    return { streak, totalCompleted, completionRate };
  }

  // Calculate Readiness Score (0-100%)
  const readinessScore = React.useMemo(() => {
    const totalSoreness = soreness.fatigue + soreness.legs + soreness.shoulders + soreness.core;
    const physicalScore = Math.max(0, 100 - (totalSoreness - 4) * 6);

    // Habits score for today
    const todayCompletedCount = habits.filter(h => habitLogs[`${h.id}_${currentDateStr}`]).length;
    const habitScore = habits.length > 0 ? (todayCompletedCount / habits.length) * 100 : 100;

    return Math.round((physicalScore * 0.6) + (habitScore * 0.4));
  }, [soreness, habits, habitLogs, currentDateStr]);

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
      localStorage.setItem('nexus_logged_workouts', JSON.stringify(updated));
    }

    if (session?.provider_token && (profile?.auto_sync_gcal !== false)) {
      const targetCalId = getSavedCalendarId(profile);
      await createGoogleCalendarEvent(session.provider_token, targetCalId, newLog);
    }

    setShowLogModal(false);
    fetchUserData();
  }

  return (
    <div>
      {/* 1. NEXUS Readiness & Energy Score Banner */}
      <div className="nexus-banner">
        <div className="nexus-banner-glow"></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#00F0FF', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              NEXUS COMMAND CENTER • {currentDateStr}
            </span>
            <h2 style={{ fontSize: '1.5rem', marginTop: 4, color: '#FFFFFF' }}>Daily Life Directive</h2>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: 2 }}>
              {readinessScore >= 80 ? '🔥 High Readiness — Optimal day for heavy loading & peak performance.' :
               readinessScore >= 60 ? '⚡ Moderate Readiness — Steady output & focused task execution.' :
               '🛡️ Recovery Mode — Prioritize mobility, sleep, and active rest.'}
            </p>
          </div>

          <div className="readiness-ring-container">
            <div className="readiness-score-box" style={{ '--score-pct': readinessScore }}>
              <div className="readiness-score-inner">
                <span className="readiness-val">{readinessScore}%</span>
                <span className="readiness-lbl">READINESS</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Daily Focus & Priority Directive Card */}
      <div className="dashboard-card" style={{ marginBottom: 20 }}>
        <div className="card-header" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={18} color="var(--color-accent)" />
            <h3 style={{ fontSize: '1rem' }}>#1 Priority Directive For Today</h3>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Complete leg session, 3L water, & finish deep work project..."
            value={dailyFocus}
            onChange={(e) => setDailyFocus(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleSaveDailyFocus} style={{ whiteSpace: 'nowrap' }}>
            {isFocusSaved ? 'Saved! ✓' : 'Set Directive'}
          </button>
        </div>
      </div>

      {/* 3. Horizontal Matrix Habit & Routine Tracker */}
      <div className="habit-matrix-card">
        <div className="card-header" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>Habit & Routine Matrix</h3>
            <span className="card-description">Track daily routines horizontally across dates with live streak metrics.</span>
          </div>
          <Link href="/analytics#habit-matrix" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '4px 10px', whiteSpace: 'nowrap' }}>
            View Detailed Analytics ↗
          </Link>
        </div>

        {/* Matrix Scrollable Container */}
        <div className="habit-matrix-wrapper">
          <table className="habit-table">
            <thead>
              <tr>
                <th className="sticky-col-left" style={{ minWidth: 200 }}>Habit / Routine</th>
                {datesWindow.map(d => (
                  <th
                    key={d.dateKey}
                    ref={d.isToday ? todayColRef : null}
                    className={`date-col-header ${d.isToday ? 'is-today' : ''}`}
                  >
                    <div>{d.dayLabel}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 900 }}>{d.numLabel}</div>
                  </th>
                ))}
                <th className="sticky-col-right" style={{ minWidth: 140, textAlign: 'center' }}>Stats & Streaks</th>
              </tr>
            </thead>
            <tbody>
              {habits.map(habit => {
                const stats = getHabitStats(habit.id);
                return (
                  <tr key={habit.id} className="habit-row">
                    <td className="sticky-col-left">
                      <div className="habit-name-box">
                        <button
                          className="btn-delete-habit"
                          title="Delete Habit"
                          onClick={() => handleDeleteHabit(habit.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                        <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{habit.name}</span>
                      </div>
                    </td>
                    {datesWindow.map(d => {
                      const isChecked = Boolean(habitLogs[`${habit.id}_${d.dateKey}`]);
                      return (
                        <td key={d.dateKey} className="habit-cell-check">
                          <button
                            className={`habit-check-btn ${isChecked ? 'checked' : ''}`}
                            onClick={() => toggleHabitCheck(habit.id, d.dateKey)}
                            title={`${habit.name} on ${d.dateKey}`}
                          >
                            <Check size={16} strokeWidth={3} />
                          </button>
                        </td>
                      );
                    })}
                    <td className="sticky-col-right" style={{ textAlign: 'center' }}>
                      <Link href="/analytics#habit-matrix" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span className="streak-badge" title="Current Active Streak (Click to view full analytics)">
                          🔥 {stats.streak}d
                        </span>
                        <span className="completion-rate" title="Total Times Logged (Click to view full analytics)">
                          📈 {stats.totalCompleted}
                        </span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add New Habit Form */}
        <form onSubmit={handleAddHabit} style={{ marginTop: 14, display: 'flex', gap: 10 }}>
          <input
            type="text"
            className="form-input"
            placeholder="+ Type a new custom habit or routine..."
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
            <PlusCircle size={16} style={{ marginRight: 4 }} />
            Add Habit
          </button>
        </form>
      </div>

      {/* 4. NEXUS Recommended Session Card */}
      {recommendation && (
        <div className="dashboard-card highlighted">
          <div className="card-header">
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <Zap size={14} style={{ display: 'inline', marginRight: 4 }} />
              NEXUS Adaptive Recommended Session
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
                  Complete Prescribed Session
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Physical Soreness & Readiness Sliders (Collapsible) */}
      <div className="dashboard-card">
        <div 
          className="card-header" 
          onClick={() => setShowSliders(!showSliders)}
          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div>
            <h3>Physical Readiness & Muscle Soreness</h3>
            <span className="card-description">Fine-tune body part soreness sliders to adapt training load.</span>
          </div>
          <button className="btn-secondary" style={{ padding: '6px 10px', borderRadius: '50%' }}>
            {showSliders ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {showSliders && (
          <div style={{ marginTop: 16 }}>
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
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button className="btn btn-secondary btn-block" onClick={() => setShowLogModal(true)}>
          <PlusCircle size={18} />
          Log Custom Activity / Sport
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
