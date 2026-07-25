'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { ATHLETIC_WORKOUTS, getExerciseGuideUrl } from '@/lib/workouts-catalog';
import { fetchCalendarEvents, createGoogleCalendarEvent, getSavedCalendarId } from '@/lib/gcalendar';
import { Calendar as CalendarIcon, PlusCircle, CheckCircle, Clock, ExternalLink, CalendarDays, Dumbbell, ShieldAlert, Trash2, Flame, Sparkles, ChevronLeft, ChevronRight, RefreshCw, Activity, Moon } from 'lucide-react';

export default function CalendarFeedPage() {
  const { user, session, profile, signInWithGoogle } = useAuth();
  const [supabase] = useState(() => createClient());

  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'completed' | 'planned' | 'gcal'
  const [windowOffset, setWindowOffset] = useState(0); // 0 = current 10 days (-7 to +2), -1 = 10 days older, +1 = 10 days newer

  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [gcalEvents, setGcalEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [activeDetailEvent, setActiveDetailEvent] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCatalogId, setSelectedCatalogId] = useState(ATHLETIC_WORKOUTS[0].id);

  // Custom schedule form
  const [customWorkout, setCustomWorkout] = useState({
    title: '',
    category: 'weightlifting',
    duration: 45,
    notes: '',
  });

  useEffect(() => {
    if (user) {
      loadCalendarData();
    }
  }, [user, session, windowOffset]);

  async function loadCalendarData() {
    setLoading(true);

    // 1. Fetch APEX Workout logs from Supabase
    const { data: logs, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (!error && logs) {
      setWorkoutLogs(logs);
    } else {
      const localLogs = JSON.parse(localStorage.getItem('apex_logged_workouts') || '[]');
      setWorkoutLogs(localLogs);
    }

    // 2. Fetch Google Calendar events if session has provider_token
    if (session?.provider_token) {
      const windowDates = get10DayWindowDates(windowOffset);
      const timeMin = new Date(`${windowDates[0]}T00:00:00Z`).toISOString();
      const timeMax = new Date(`${windowDates[9]}T23:59:59Z`).toISOString();

      const targetCalId = getSavedCalendarId(profile);

      const events = await fetchCalendarEvents(
        session.provider_token,
        targetCalId,
        timeMin,
        timeMax
      );
      setGcalEvents(events);
    }

    setLoading(false);
  }

  // Calculate array of 10 contiguous YYYY-MM-DD date strings for the current windowOffset
  function get10DayWindowDates(offset) {
    const dates = [];
    const today = new Date();

    // Base start date: 7 days before today + (offset * 10 days)
    const startDate = new Date();
    startDate.setDate(today.getDate() - 7 + offset * 10);

    for (let i = 0; i < 10; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }

  // Format date range label (e.g. "Jul 18 – Jul 27, 2026")
  function getDateRangeLabel(dates) {
    if (!dates || dates.length === 0) return '';
    const d1 = new Date(`${dates[0]}T00:00:00`);
    const d2 = new Date(`${dates[dates.length - 1]}T00:00:00`);

    const f1 = d1.toLocaleDateString('default', { month: 'short', day: 'numeric' });
    const f2 = d2.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${f1} – ${f2}`;
  }

  // Handle scheduling a new workout for a future/chosen date
  async function handleScheduleSubmit(e) {
    e.preventDefault();
    const catalogItem = ATHLETIC_WORKOUTS.find((w) => w.id === selectedCatalogId);

    const newPlanned = {
      user_id: user?.id,
      date: scheduleDate,
      workout_name: catalogItem ? catalogItem.name : customWorkout.title || 'Scheduled Workout',
      category: catalogItem ? catalogItem.category : customWorkout.category,
      duration: catalogItem ? catalogItem.duration : Number(customWorkout.duration),
      volume_load: 0,
      exercises: catalogItem ? catalogItem.exercises : [],
      notes: catalogItem ? catalogItem.description : customWorkout.notes,
      status: 'planned',
    };

    if (user) {
      await supabase.from('workout_logs').insert([newPlanned]);
    } else {
      const updated = [newPlanned, ...workoutLogs];
      setWorkoutLogs(updated);
      localStorage.setItem('apex_logged_workouts', JSON.stringify(updated));
    }

    // Auto-sync to Google Calendar if enabled
    if (session?.provider_token && (profile?.auto_sync_gcal !== false)) {
      const targetCalId = getSavedCalendarId(profile);
      await createGoogleCalendarEvent(session.provider_token, targetCalId, newPlanned);
    }

    setShowScheduleModal(false);
    loadCalendarData();
  }

  // Handle marking a planned workout as completed
  async function handleMarkCompleted(event) {
    if (user && event.id && !event.isGcal) {
      await supabase
        .from('workout_logs')
        .update({ status: 'completed' })
        .eq('id', event.id);
    } else if (event.isGcal) {
      const newLog = {
        user_id: user?.id,
        date: event.date,
        workout_name: event.workout_name,
        category: event.category,
        duration: event.duration,
        exercises: event.exercises,
        notes: event.notes,
        status: 'completed',
      };
      if (user) await supabase.from('workout_logs').insert([newLog]);
    }

    setActiveDetailEvent(null);
    loadCalendarData();
  }

  // Handle deleting a workout log/plan
  async function handleDeleteWorkout(eventId) {
    if (user && eventId) {
      await supabase.from('workout_logs').delete().eq('id', eventId);
    }
    setActiveDetailEvent(null);
    loadCalendarData();
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const activeWindowDates = get10DayWindowDates(windowOffset);
  const rangeLabel = getDateRangeLabel(activeWindowDates);

  // Get workout events for a specific date filtered by selectedFilter
  function getEventsForDate(dateStr) {
    const internal = workoutLogs.filter((w) => w.date === dateStr);
    const gcal = gcalEvents.filter((g) => g.date === dateStr);

    let combined = [...internal, ...gcal];

    if (selectedFilter === 'completed') {
      combined = combined.filter((e) => e.status !== 'planned' && !e.isGcal);
    } else if (selectedFilter === 'planned') {
      combined = combined.filter((e) => e.status === 'planned');
    } else if (selectedFilter === 'gcal') {
      combined = combined.filter((e) => e.isGcal);
    }

    // Deduplicate by ID
    const seen = new Set();
    return combined.filter((item) => {
      const uid = item.id || `${item.date}_${item.workout_name}`;
      if (seen.has(uid)) return false;
      seen.add(uid);
      return true;
    });
  }

  // If user is not logged in with Google, render mandatory Sign In screen
  if (!user) {
    return (
      <div>
        <div className="card-header" style={{ marginBottom: 20 }}>
          <h2><CalendarIcon size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} /> Timeline Feed</h2>
          <span className="card-description">Chronological 10-day athletic feed of completed, planned, and Google Calendar workouts.</span>
        </div>

        <div className="dashboard-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <ShieldAlert size={48} style={{ color: 'var(--color-accent)', marginBottom: 16 }} />
          <h3 style={{ marginBottom: 8 }}>Google Account Sign In Required</h3>
          <p className="card-description" style={{ maxWidth: 450, margin: '0 auto 24px auto' }}>
            The APEX Workout Feed requires logging in with your Google Account to sync Google Calendar events, manage future plans, and track exercise logs.
          </p>
          <button className="btn btn-primary" onClick={signInWithGoogle} style={{ padding: '12px 24px', fontSize: '1rem' }}>
            Sign In with Google to Unlock Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header & Post Workout Action Bar */}
      <div className="card-header" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2><Activity size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} /> 10-Day Workout Feed</h2>
            <span className="card-description">Continuous daily timeline showing workouts and rest days.</span>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => {
              setScheduleDate(todayStr);
              setShowScheduleModal(true);
            }}
          >
            <PlusCircle size={16} /> Schedule Workout
          </button>
        </div>
      </div>

      {/* Filter Pill Group */}
      <div className="feed-filter-bar" style={{ marginBottom: 16 }}>
        <button
          className={`filter-pill ${selectedFilter === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('all')}
        >
          All Activity
        </button>
        <button
          className={`filter-pill ${selectedFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('completed')}
        >
          Completed
        </button>
        <button
          className={`filter-pill ${selectedFilter === 'planned' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('planned')}
        >
          Planned
        </button>
        <button
          className={`filter-pill ${selectedFilter === 'gcal' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('gcal')}
        >
          Google Calendar
        </button>
      </div>

      {/* TOP PAGINATION BAR */}
      <PaginationBar
        rangeLabel={rangeLabel}
        windowOffset={windowOffset}
        onPrev={() => setWindowOffset((prev) => prev - 1)}
        onNext={() => setWindowOffset((prev) => prev + 1)}
        onReset={() => setWindowOffset(0)}
      />

      {/* 10-DAY CONTINUOUS FEED */}
      <div className="feed-container">
        {loading ? (
          <div className="dashboard-card" style={{ textAlign: 'center', padding: '30px' }}>
            <p className="card-description">Loading 10-day workout feed...</p>
          </div>
        ) : (
          activeWindowDates.map((dateStr) => {
            const dayEvents = getEventsForDate(dateStr);
            const isToday = dateStr === todayStr;
            const dateObj = new Date(`${dateStr}T00:00:00`);
            const formattedDayLabel = dateObj.toLocaleDateString('default', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });

            return (
              <div key={dateStr} className="feed-day-block">
                {/* Date Header for Each Day */}
                <div className={`feed-day-header ${isToday ? 'is-today' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="feed-day-title">{formattedDayLabel}</span>
                    {isToday && <span className="today-badge">TODAY</span>}
                  </div>
                  <span className="feed-day-count">
                    {dayEvents.length > 0 ? `${dayEvents.length} session${dayEvents.length > 1 ? 's' : ''}` : 'Rest Day'}
                  </span>
                </div>

                {/* If day has events: render Feed Cards */}
                {dayEvents.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                    {dayEvents.map((item, idx) => (
                      <FeedCard
                        key={item.id || `${dateStr}_${idx}`}
                        item={item}
                        onOpenDetail={() => setActiveDetailEvent(item)}
                        onComplete={() => handleMarkCompleted(item)}
                      />
                    ))}
                  </div>
                ) : (
                  /* If day has NO events: render Rest Day Divider */
                  <div
                    className="rest-day-divider"
                    onClick={() => {
                      setScheduleDate(dateStr);
                      setShowScheduleModal(true);
                    }}
                    title="Click to schedule or log a workout for this date"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Moon size={16} style={{ color: 'var(--color-text-muted)' }} />
                      <span className="rest-day-text">Rest & Recovery Day • No activity logged</span>
                    </div>
                    <span className="rest-day-action">+ Log Workout</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* BOTTOM PAGINATION BAR */}
      <div style={{ marginTop: 24 }}>
        <PaginationBar
          rangeLabel={rangeLabel}
          windowOffset={windowOffset}
          onPrev={() => setWindowOffset((prev) => prev - 1)}
          onNext={() => setWindowOffset((prev) => prev + 1)}
          onReset={() => setWindowOffset(0)}
        />
      </div>

      {/* EVENT DETAIL MODAL */}
      {activeDetailEvent && (
        <div className="modal-overlay" onClick={() => setActiveDetailEvent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div>
                <span className={`badge-tag ${activeDetailEvent.status === 'planned' ? 'gold' : activeDetailEvent.isGcal ? 'blue' : 'green'}`} style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                  {activeDetailEvent.status === 'planned' ? 'Planned Workout' : activeDetailEvent.isGcal ? 'Google Calendar Event' : 'Completed Log'}
                </span>
                <h3 className="modal-title" style={{ marginTop: 4 }}>{activeDetailEvent.workout_name || activeDetailEvent.summary}</h3>
              </div>
              <button className="btn-close" onClick={() => setActiveDetailEvent(null)}>×</button>
            </div>

            <div style={{ display: 'flex', gap: 16, color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: 16, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
              <span><CalendarIcon size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> {activeDetailEvent.date}</span>
              <span><Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> {activeDetailEvent.duration || 45} Mins</span>
              <span style={{ textTransform: 'capitalize' }}><Dumbbell size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> {activeDetailEvent.category || 'Weightlifting'}</span>
            </div>

            {activeDetailEvent.notes && (
              <p className="card-description" style={{ marginBottom: 16, fontStyle: 'italic' }}>
                "{activeDetailEvent.notes}"
              </p>
            )}

            <h5 style={{ fontSize: '0.9rem', marginBottom: 10, color: 'var(--color-text-secondary)' }}>Prescribed Exercise Breakdown:</h5>
            <ul className="exercise-list" style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 20 }}>
              {activeDetailEvent.exercises && activeDetailEvent.exercises.length > 0 ? (
                activeDetailEvent.exercises.map((ex, idx) => (
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
                ))
              ) : (
                <li style={{ padding: '12px 0', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                  No explicit exercise set/rep breakdown provided for this session.
                </li>
              )}
            </ul>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {(activeDetailEvent.status === 'planned' || activeDetailEvent.isGcal) && (
                <button
                  className="btn btn-primary btn-block"
                  onClick={() => handleMarkCompleted(activeDetailEvent)}
                >
                  <CheckCircle size={18} />
                  Mark as Completed & Log Session
                </button>
              )}

              {!activeDetailEvent.isGcal && (
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteWorkout(activeDetailEvent.id)}
                  style={{ padding: '10px 14px' }}
                  title="Delete Workout Log"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE WORKOUT MODAL */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Schedule / Log Workout</h3>
              <button className="btn-close" onClick={() => setShowScheduleModal(false)}>×</button>
            </div>

            <form onSubmit={handleScheduleSubmit}>
              <div className="form-group">
                <label className="form-label">Target Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Select from Catalog</label>
                <select
                  className="form-select"
                  value={selectedCatalogId}
                  onChange={(e) => setSelectedCatalogId(e.target.value)}
                >
                  {ATHLETIC_WORKOUTS.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.category})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ margin: '16px 0', borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                  Or specify custom activity details:
                </p>

                <div className="form-group">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Custom workout title (optional)"
                    value={customWorkout.title}
                    onChange={(e) => setCustomWorkout({ ...customWorkout, title: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block">
                <CalendarDays size={18} /> Schedule & Post to Feed
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// 10-DAY PAGINATION CONTROL BAR COMPONENT
function PaginationBar({ rangeLabel, windowOffset, onPrev, onNext, onReset }) {
  return (
    <div className="feed-pagination-bar">
      <button className="btn btn-secondary pagination-btn" onClick={onPrev} title="Load previous 10 days">
        <ChevronLeft size={16} /> Older 10 Days
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="pagination-range-badge">{rangeLabel}</span>
        {windowOffset !== 0 && (
          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={onReset}>
            Today
          </button>
        )}
      </div>

      <button className="btn btn-secondary pagination-btn" onClick={onNext} title="Load next 10 days">
        Newer 10 Days <ChevronRight size={16} />
      </button>
    </div>
  );
}

// CHRONOLOGICAL FEED CARD COMPONENT
function FeedCard({ item, onOpenDetail, onComplete }) {
  const isPlanned = item.status === 'planned';
  const isGcal = item.isGcal;

  function getCategoryIcon(cat) {
    switch (cat) {
      case 'running': return '🏃';
      case 'volleyball': return '🏐';
      case 'flag_football': return '🏈';
      case 'recovery': return '🧘';
      default: return '🏋️';
    }
  }

  return (
    <div className={`feed-card ${isPlanned ? 'planned' : isGcal ? 'gcal' : 'completed'}`} onClick={onOpenDetail}>
      <div className="feed-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="feed-avatar">
            {isGcal ? '📅' : getCategoryIcon(item.category)}
          </div>
          <div>
            <h4 className="feed-item-title">{item.workout_name || item.summary}</h4>
            <span className="feed-timestamp">
              {item.duration || 45} mins • <span style={{ textTransform: 'capitalize' }}>{item.category || 'weightlifting'}</span>
            </span>
          </div>
        </div>

        <span className={`feed-status-badge ${isPlanned ? 'planned' : isGcal ? 'gcal' : 'completed'}`}>
          {isPlanned ? 'PLANNED' : isGcal ? 'GOOGLE CAL' : 'COMPLETED'}
        </span>
      </div>

      {item.notes && (
        <p className="feed-description">
          "{item.notes}"
        </p>
      )}

      {/* Exercise Routine Chips Preview */}
      {item.exercises && item.exercises.length > 0 && (
        <div className="feed-exercises-preview">
          {item.exercises.slice(0, 3).map((ex, idx) => (
            <span key={idx} className="exercise-chip">
              <strong>{ex.name}</strong> ({ex.sets}x{ex.reps})
            </span>
          ))}
          {item.exercises.length > 3 && (
            <span className="exercise-chip more">+{item.exercises.length - 3} more</span>
          )}
        </div>
      )}

      {/* Card Action Bar */}
      <div className="feed-card-actions" onClick={(e) => e.stopPropagation()}>
        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={onOpenDetail}>
          View Routine ({item.exercises?.length || 0}) <ChevronRight size={14} />
        </button>

        {(isPlanned || isGcal) && (
          <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={onComplete}>
            <CheckCircle size={14} /> Complete & Log
          </button>
        )}
      </div>
    </div>
  );
}
