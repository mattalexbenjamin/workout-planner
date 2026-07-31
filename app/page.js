'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { ATHLETIC_WORKOUTS, getExerciseGuideUrl } from '@/lib/workouts-catalog';
import { getRecommendation, formatDateKey } from '@/lib/recommender';
import { createGoogleCalendarEvent, fetchCalendarEvents, getSavedCalendarId } from '@/lib/gcalendar';
import { 
  Sparkles, Calendar as CalendarIcon, Activity, PlusCircle, CheckCircle, 
  Flame, Dumbbell, Trash2, Check, Target, Zap, ChevronDown, ChevronUp,
  Bot, Wand2, Sliders
} from 'lucide-react';
import MetricTooltip from '@/components/MetricTooltip';
import { DEFAULT_HABITS, fetchUserHabitsAndLogs, saveHabitToAdd, saveHabitToDelete, saveHabitCheckToggle } from '@/lib/habits-sync';

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

  // AI Workout Generator State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiDuration, setAiDuration] = useState(45);
  const [aiEquipment, setAiEquipment] = useState('Full Gym');
  const [aiFocusPrompt, setAiFocusPrompt] = useState('');
  const [aiError, setAiError] = useState(null);

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

      const localFocus = localStorage.getItem(`nexus_daily_focus_${user.id}_${currentDateStr}`);
      if (localFocus) setDailyFocus(localFocus);

    } else {
      // LocalStorage fallbacks
      const localSoreness = localStorage.getItem('nexus_today_soreness');
      if (localSoreness) setSoreness(JSON.parse(localSoreness));

      const localWorkouts = localStorage.getItem('nexus_logged_workouts');
      if (localWorkouts) setWorkouts(JSON.parse(localWorkouts));

      const localFocus = localStorage.getItem(`nexus_daily_focus_guest_${currentDateStr}`);
      if (localFocus) setDailyFocus(localFocus);
    }

    // 3. Fetch Habits & Habit Logs (Supabase Cloud + Local Storage auto-sync)
    const { habits: fetchedHabits, habitLogs: fetchedLogs } = await fetchUserHabitsAndLogs(supabase, user);
    setHabits(fetchedHabits);
    setHabitLogs(fetchedLogs);
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

  // Habits Management (Cloud & Local Sync)
  async function handleAddHabit(e) {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newHabit = {
      id: `custom_${Date.now()}`,
      name: newHabitName.trim()
    };

    setNewHabitName('');
    const updatedHabits = await saveHabitToAdd(supabase, user, newHabit, habits);
    setHabits(updatedHabits);
  }

  async function handleDeleteHabit(habitId) {
    const updatedHabits = await saveHabitToDelete(supabase, user, habitId, habits);
    setHabits(updatedHabits);
  }

  async function toggleHabitCheck(habitId, dateKey) {
    const nextLogs = await saveHabitCheckToggle(supabase, user, habitId, dateKey, habitLogs);
    setHabitLogs(nextLogs);
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

  async function handleGenerateAiWorkout(e) {
    if (e) e.preventDefault();
    setAiGenerating(true);
    setAiError(null);

    try {
      // 1. Gather Google Calendar context for today & tomorrow
      let calendarScheduleText = '';
      const activeToken = session?.provider_token || (typeof window !== 'undefined' ? localStorage.getItem('nexus_provider_token') : null);

      if (activeToken) {
        const targetCalId = getSavedCalendarId(profile);
        const todayStr = new Date().toISOString();
        const tmr = new Date();
        tmr.setDate(tmr.getDate() + 2);
        const tmrStr = tmr.toISOString();

        const events = await fetchCalendarEvents(activeToken, targetCalId, todayStr, tmrStr);
        if (events && events.length > 0) {
          calendarScheduleText = events.map(ev => `- Event: "${ev.summary}" on ${ev.date} (Duration: ${ev.duration || 45} mins)`).join('\n');
        }
      }

      // 2. Gather recent workout history text
      const recentLogsText = workouts.slice(0, 5).map(w => `- ${w.date}: ${w.workout_name || w.summary} (${w.duration || 45} mins)`).join('\n');

      // 3. Gather habit compliance status
      const completedHabitsCount = habits.filter(h => habitLogs[`${h.id}_${currentDateStr}`]).length;
      const habitStatusText = `Daily Habits: ${completedHabitsCount}/${habits.length} completed today.`;

      // 4. Call API route with context payload
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiFocusPrompt || 'Generate an optimal athletic session matching my schedule and fatigue context',
          soreness,
          userWeight: profile?.weight || 190,
          equipment: aiEquipment,
          duration: Number(aiDuration),
          provider: 'gemini',
          calendarSchedule: calendarScheduleText,
          recentLogs: recentLogsText,
          habitStatus: habitStatusText
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate AI workout');

      if (data.workout) {
        setSelectedWorkout(data.workout);
        setRecommendation({
          id: 'ai_generated',
          name: data.workout.name,
          reason: data.workout.description || 'AI session generated using your soreness metrics, Google Calendar schedule, and training history.'
        });
        setShowAiModal(false);
      }
    } catch (err) {
      console.error('AI Generator Error:', err);
      setAiError(err.message || 'Error generating AI session. Please check your Gemini API key in Settings.');
    } finally {
      setAiGenerating(false);
    }
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
                <span className="readiness-lbl" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  READINESS
                  <MetricTooltip
                    title="NEXUS Readiness Score"
                    description="Measures your daily physical capacity and lifestyle consistency to guide training intensity."
                    formula="60% Physical Soreness Index + 40% Daily Habit Compliance"
                    tiers={[
                      { range: '80 - 100%', label: 'High Readiness', color: '#10B981', text: 'Optimal for heavy strength loading & high-intensity sessions.' },
                      { range: '60 - 79%', label: 'Moderate Readiness', color: '#F59E0B', text: 'Good capacity for steady work. Keep volume controlled.' },
                      { range: '0 - 59%', label: 'Recovery Mode', color: '#EF4444', text: 'Prioritize sleep, hydration, mobility, and active rest.' }
                    ]}
                    position="left"
                    iconSize={13}
                    style={{ marginLeft: 4 }}
                  />
                </span>
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
            <h3 style={{ fontSize: '1rem', display: 'inline-flex', alignItems: 'center' }}>
              #1 Priority Directive For Today
              <MetricTooltip
                title="#1 Priority Directive"
                description="Your single most vital objective for today. Setting a clear daily directive focuses your cognitive energy on high-impact actions."
                position="top"
              />
            </h3>
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
            <h3 style={{ display: 'inline-flex', alignItems: 'center' }}>
              Habit & Routine Matrix
              <MetricTooltip
                title="Habit & Routine Matrix"
                description="Tracks daily lifestyle behaviors (hydration, sleep, deep work, nutrition). Completing daily habits contributes 40% directly toward your Readiness Score."
                formula="Habit Score = (Habits Completed Today ÷ Total Active Habits) × 100%"
                position="top"
              />
            </h3>
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
                <th className="sticky-col-left" style={{ minWidth: 140 }}>Habit / Routine</th>
                {datesWindow.map(d => (
                  <th
                    key={d.dateKey}
                    ref={d.isToday ? todayColRef : null}
                    className={`date-col-header ${d.isToday ? 'is-today' : ''}`}
                  >
                    <div>{d.dayLabel}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 900 }}>{d.numLabel}</div>
                  </th>
                ))}
                <th className="sticky-col-right" style={{ minWidth: 120, textAlign: 'center' }}>
                  Stats & Streaks
                  <MetricTooltip
                    title="Habit Streaks & Compliance"
                    description="🔥 Streak shows consecutive active days completed counting back from today. 📈 Stats reflect total completed instances."
                    position="left"
                    iconSize={13}
                  />
                </th>
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
                          <Trash2 size={13} />
                        </button>
                        <span className="habit-name-text" title={habit.name}>{habit.name}</span>
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
                            <Check size={14} strokeWidth={3} />
                          </button>
                        </td>
                      );
                    })}
                    <td className="sticky-col-right" style={{ textAlign: 'center' }}>
                      <Link href="/analytics#habit-matrix" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
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
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-flex', alignItems: 'center' }}>
                <Zap size={14} style={{ display: 'inline', marginRight: 4 }} />
                NEXUS Adaptive Recommended Session
                <MetricTooltip
                  title="Adaptive Recommendation Engine"
                  description="Analyzes your current readiness score, muscle soreness snapshots, and target training frequency to auto-select or generate the safest and most efficient workout."
                  position="top"
                  iconSize={13}
                />
              </span>
              <h3>{recommendation.name}</h3>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setShowAiModal(true)}
              style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, color: '#00F0FF', borderColor: 'rgba(0, 240, 255, 0.4)' }}
            >
              <Wand2 size={15} /> Generate AI Session
            </button>
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
            <h3 style={{ display: 'inline-flex', alignItems: 'center' }}>
              Physical Readiness & Muscle Soreness
              <MetricTooltip
                title="Muscle Soreness & Fatigue Index"
                description="Rate muscle soreness on a 1 (Fresh) to 5 (Extremely Sore) scale across core muscle groups. Physical soreness dictates 60% of your Readiness Score."
                formula="Physical Score = Max(0, 100 - (Sum of Soreness Sliders - 4) × 6)"
                position="top"
              />
            </h3>
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

      {/* AI WORKOUT GENERATOR MODAL */}
      {showAiModal && (
        <div className="modal-overlay" onClick={() => setShowAiModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div>
                <span className="badge-tag blue" style={{ fontSize: '0.7rem' }}>
                  POWERED BY AI & LIFE CONTEXT
                </span>
                <h3 className="modal-title" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Wand2 size={20} color="var(--color-accent)" /> Context-Aware AI Session Generator
                </h3>
              </div>
              <button className="btn-close" onClick={() => setShowAiModal(false)}>×</button>
            </div>

            {/* Context Summary Cards */}
            <div style={{ backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '12px 14px', marginBottom: 16 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                🧠 Auto-Detected Context
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8, fontSize: '0.78rem' }}>
                <div>
                  <strong>Soreness:</strong> Legs ({soreness.legs}/5), Core ({soreness.core}/5)
                </div>
                <div>
                  <strong>Readiness:</strong> {readinessScore}% Score
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <strong>Calendar & History:</strong> Auto-analyzing Google Calendar schedule & recent workout volume
                </div>
              </div>
            </div>

            {/* Target Duration Selector */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Target Session Duration</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[15, 30, 45, 60, 90, 120, 180, 240].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    className={`filter-pill ${aiDuration === mins ? 'active' : ''}`}
                    onClick={() => setAiDuration(mins)}
                  >
                    ⏱️ {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                  </button>
                ))}
              </div>
            </div>

            {/* Available Equipment Selector */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Available Equipment</label>
              <select
                className="form-select"
                value={aiEquipment}
                onChange={(e) => setAiEquipment(e.target.value)}
              >
                <option value="Full Gym">Full Gym (Barbell, Dumbbells, Cables, Machines)</option>
                <option value="Dumbbells Only">Dumbbells & Bench Only</option>
                <option value="Bodyweight & Mat">Bodyweight, Bands & Mat</option>
                <option value="Sand & Outdoor">Sand / Beach / Outdoor Court</option>
              </select>
            </div>

            {/* Custom Focus Prompt Input */}
            <div className="form-group" style={{ marginBottom: 18 }}>
              <label className="form-label">Specific Focus or Request (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Explosive vertical jump, chest hypertrophy, or recovery"
                value={aiFocusPrompt}
                onChange={(e) => setAiFocusPrompt(e.target.value)}
              />
            </div>

            {aiError && (
              <div style={{ padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', borderRadius: 'var(--border-radius-sm)', color: 'var(--color-danger)', fontSize: '0.8rem', marginBottom: 14 }}>
                {aiError}
              </div>
            )}

            <button
              className="btn btn-primary btn-block"
              onClick={handleGenerateAiWorkout}
              disabled={aiGenerating}
              style={{ padding: '12px 18px', fontSize: '0.95rem' }}
            >
              {aiGenerating ? '⚡ Generating AI Workout...' : '🤖 Generate AI Session (Context-Aware)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
