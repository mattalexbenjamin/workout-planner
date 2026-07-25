'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { ATHLETIC_WORKOUTS, getExerciseGuideUrl } from '@/lib/workouts-catalog';
import { fetchCalendarEvents, createGoogleCalendarEvent, inferWorkoutFromTitle } from '@/lib/gcalendar';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, PlusCircle, CheckCircle, Clock, ExternalLink, CalendarDays, Flame, Dumbbell, ShieldAlert, Trash2 } from 'lucide-react';

export default function CalendarPage() {
  const { user, session, profile, signInWithGoogle } = useAuth();
  const [supabase] = useState(() => createClient());

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'completed' | 'planned' | 'gcal'

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
  }, [user, currentDate, session]);

  async function loadCalendarData() {
    setLoading(true);

    // 1. Fetch APEX Workout logs from Supabase
    const { data: logs, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (!error && logs) {
      setWorkoutLogs(logs);
    } else {
      const localLogs = JSON.parse(localStorage.getItem('apex_logged_workouts') || '[]');
      setWorkoutLogs(localLogs);
    }

    // 2. Fetch Google Calendar events if session has provider_token
    if (session?.provider_token) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const timeMin = new Date(year, month - 1, 1).toISOString();
      const timeMax = new Date(year, month + 2, 0).toISOString();

      const events = await fetchCalendarEvents(
        session.provider_token,
        profile?.selected_calendar_id || 'primary',
        timeMin,
        timeMax
      );
      setGcalEvents(events);
    }

    setLoading(false);
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

    let insertedId = null;

    if (user) {
      const { data } = await supabase.from('workout_logs').insert([newPlanned]).select();
      if (data && data[0]) insertedId = data[0].id;
    } else {
      const updated = [newPlanned, ...workoutLogs];
      setWorkoutLogs(updated);
      localStorage.setItem('apex_logged_workouts', JSON.stringify(updated));
    }

    // Auto-sync to Google Calendar if enabled
    if (session?.provider_token && (profile?.auto_sync_gcal !== false)) {
      await createGoogleCalendarEvent(session.provider_token, profile?.selected_calendar_id || 'primary', newPlanned);
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
      // Log Google Calendar event as APEX completed workout
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

  // Format month name & year
  const monthYearString = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Navigation handlers
  function handlePrevMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  }
  function handleNextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  }
  function handleToday() {
    setCurrentDate(new Date());
  }

  // Generate days for current month view
  function generateMonthGrid() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const grid = [];
    // Padding days from prev month
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthTotalDays - i);
      grid.push({ date: d, isCurrentMonth: false });
    }
    // Days of current month
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      grid.push({ date: d, isCurrentMonth: true });
    }
    // Remaining padding days for 6-row grid
    const remaining = 42 - grid.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      grid.push({ date: d, isCurrentMonth: false });
    }

    return grid;
  }

  // Get all events for a specific date string (YYYY-MM-DD)
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

    return combined;
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // If user is not logged in with Google, render mandatory Sign In screen (per requirement)
  if (!user) {
    return (
      <div>
        <div className="card-header" style={{ marginBottom: 20 }}>
          <h2><CalendarIcon size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} /> Timeline Calendar</h2>
          <span className="card-description">View all past, current, and future/planned workouts with set & rep exercise breakdowns.</span>
        </div>

        <div className="dashboard-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <ShieldAlert size={48} style={{ color: 'var(--color-accent)', marginBottom: 16 }} />
          <h3 style={{ marginBottom: 8 }}>Google Account Sign In Required</h3>
          <p className="card-description" style={{ maxWidth: 450, margin: '0 auto 24px auto' }}>
            The APEX Timeline Calendar requires logging in with your Google Account to sync Google Calendar events, manage future training plans, and track exercise history.
          </p>
          <button className="btn btn-primary" onClick={signInWithGoogle} style={{ padding: '12px 24px', fontSize: '1rem' }}>
            Sign In with Google to Unlock Calendar
          </button>
        </div>
      </div>
    );
  }

  const monthGrid = generateMonthGrid();

  return (
    <div>
      <div className="card-header" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2><CalendarIcon size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} /> Workout Timeline Calendar</h2>
            <span className="card-description">Interactive timeline view of completed, planned, and Google Calendar workouts.</span>
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

      {/* Calendar Header Controls */}
      <div className="calendar-controls-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-secondary btn-icon" onClick={handlePrevMonth} title="Previous Month">
            <ChevronLeft size={18} />
          </button>
          <h3 style={{ fontSize: '1.1rem', minWidth: 170, textAlign: 'center', margin: 0 }}>{monthYearString}</h3>
          <button className="btn btn-secondary btn-icon" onClick={handleNextMonth} title="Next Month">
            <ChevronRight size={18} />
          </button>
          <button className="btn btn-secondary" onClick={handleToday} style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
            Today
          </button>
        </div>

        {/* View Mode & Filter Controls */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="filter-pill-group">
            <button
              className={`filter-pill ${selectedFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('all')}
            >
              All Events
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
              Google Cal
            </button>
          </div>

          <div className="view-toggle-group">
            <button
              className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button
              className={`toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="calendar-grid-container">
          <div className="calendar-weekday-header">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          <div className="calendar-month-grid">
            {monthGrid.map((cell, idx) => {
              const dateStr = cell.date.toISOString().split('T')[0];
              const isToday = dateStr === todayStr;
              const dayEvents = getEventsForDate(dateStr);

              return (
                <div
                  key={idx}
                  className={`calendar-day-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'is-today' : ''}`}
                  onClick={() => {
                    setScheduleDate(dateStr);
                  }}
                >
                  <div className="cell-day-number">
                    <span>{cell.date.getDate()}</span>
                    {isToday && <span className="today-badge">TODAY</span>}
                  </div>

                  <div className="cell-events-wrapper">
                    {dayEvents.slice(0, 3).map((evt, eIdx) => {
                      const isPlanned = evt.status === 'planned';
                      const isGcal = evt.isGcal;

                      return (
                        <div
                          key={eIdx}
                          className={`event-badge ${isPlanned ? 'planned' : isGcal ? 'gcal' : 'completed'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDetailEvent(evt);
                          }}
                          title={`${evt.workout_name || evt.summary} (${evt.duration || 45} mins)`}
                        >
                          <span className="event-dot"></span>
                          <span className="event-title">{evt.workout_name || evt.summary}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span className="more-events-tag">+{dayEvents.length - 3} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="calendar-week-container">
          <div className="week-days-list">
            {Array.from({ length: 7 }).map((_, i) => {
              const curr = new Date(currentDate);
              const dayOfWeek = curr.getDay();
              const startOfWeek = new Date(curr.setDate(curr.getDate() - dayOfWeek + i));
              const dateStr = startOfWeek.toISOString().split('T')[0];
              const isToday = dateStr === todayStr;
              const events = getEventsForDate(dateStr);

              return (
                <div key={i} className={`week-day-card ${isToday ? 'is-today' : ''}`}>
                  <div className="week-day-header">
                    <h4>{startOfWeek.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}</h4>
                    {isToday && <span className="today-badge">TODAY</span>}
                  </div>

                  <div className="week-day-events">
                    {events.length === 0 ? (
                      <p className="no-events-text">Rest Day / No Scheduled Workout</p>
                    ) : (
                      events.map((evt, eIdx) => (
                        <div
                          key={eIdx}
                          className={`week-event-item ${evt.status === 'planned' ? 'planned' : evt.isGcal ? 'gcal' : 'completed'}`}
                          onClick={() => setActiveDetailEvent(evt)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <strong className="event-name">{evt.workout_name || evt.summary}</strong>
                            <span className="event-category-tag">{evt.category}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                            <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                            {evt.duration || 45} mins • {evt.exercises?.length || 0} exercises
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EVENT DETAIL MODAL (Click into any event to see exercises, sets, reps) */}
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

            <div style={{ display: 'flex', gap: 16, color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: 16, borderBottom: '1px solid var(--color-border)', paddingBottom: 12 }}>
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
              <h3 className="modal-title">Schedule Future Workout</h3>
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

              <div style={{ margin: '16px 0', borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
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
                <CalendarDays size={18} /> Schedule & Sync to Calendar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
