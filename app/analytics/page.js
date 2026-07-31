'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { fetchCalendarEvents, deleteGoogleCalendarEvent, updateGoogleCalendarEventDuration, getSavedCalendarId } from '@/lib/gcalendar';
import { BarChart3, RefreshCw, Clock, Tag, Trash2, ChevronRight, CheckCircle, ExternalLink, Calendar as CalendarIcon, Dumbbell, ChevronLeft, Check, Flame, Award, PlusCircle } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const CATEGORY_KEYS = ['weightlifting', 'volleyball', 'grass_volleyball', 'basketball', 'running', 'flag_football', 'recovery', 'other'];

const CATEGORY_NAMES = {
  weightlifting: '🏋️ Weightlifting',
  volleyball: '🏐 Sand Volleyball',
  grass_volleyball: '🌱 Grass Volleyball',
  basketball: '🏀 Basketball',
  running: '🏃 Running',
  flag_football: '🏈 Flag Football',
  recovery: '🧘 Recovery',
  other: '⚡ Other'
};

const DEFAULT_HABITS = [
  { id: 'hydration', name: '💧 Hydration (3L+)' },
  { id: 'sleep', name: '😴 8h Quality Sleep' },
  { id: 'deep_work', name: '🧠 Deep Work Session' },
  { id: 'nutrition', name: '🥗 Clean Nutrition & Protein' },
  { id: 'mobility', name: '🧘 Mobility & Stretching' },
];

function formatDateKey(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AnalyticsPage() {
  const { user, session, profile, signInWithGoogle } = useAuth();
  const [supabase] = useState(() => createClient());

  const [rangeDays, setRangeDays] = useState(240); // Default to 8 Months (~240 days)
  const [combinedEvents, setCombinedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Category & Event Modal States (null = All Categories)
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeDetailEvent, setActiveDetailEvent] = useState(null);
  const [categorySaved, setCategorySaved] = useState(false);
  const [durationSaved, setDurationSaved] = useState(false);

  // Habit Matrix State for Analytics
  const [habits, setHabits] = useState(DEFAULT_HABITS);
  const [habitLogs, setHabitLogs] = useState({});
  const [newHabitName, setNewHabitName] = useState('');
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current 30-day window, -1 = previous 30 days, +1 = next 30 days

  const analyticsTodayRef = useRef(null);

  // 30-day date range generator for analytics
  const analyticsHabitDates = React.useMemo(() => {
    const list = [];
    const base = new Date();
    base.setDate(base.getDate() + (monthOffset * 30));
    const currentDateStr = formatDateKey(new Date());

    for (let i = -29; i <= 0; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      const dateKey = formatDateKey(d);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const numLabel = d.getDate();
      const isToday = dateKey === currentDateStr;
      list.push({ dateKey, dayLabel, numLabel, isToday, rawDate: d });
    }
    return list;
  }, [monthOffset]);

  // Center scroll onto Today's column when viewing current 30-day window
  useEffect(() => {
    if (monthOffset === 0 && analyticsTodayRef.current) {
      analyticsTodayRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [analyticsHabitDates, monthOffset]);

  useEffect(() => {
    loadAnalyticsData();
    fetchHabitsData();
  }, [user, session, rangeDays]);

  async function fetchHabitsData() {
    if (typeof window === 'undefined') return;
    const storageKey = user ? `nexus_custom_habits_${user.id}` : 'nexus_custom_habits_guest';
    const logsKey = user ? `nexus_habit_logs_${user.id}` : 'nexus_habit_logs_guest';

    const localHabits = localStorage.getItem(storageKey);
    if (localHabits) {
      try { setHabits(JSON.parse(localHabits)); } catch (e) {}
    }

    const localLogs = localStorage.getItem(logsKey);
    if (localLogs) {
      try { setHabitLogs(JSON.parse(localLogs)); } catch (e) {}
    }
  }

  function handleCategorySelect(catKey) {
    if (selectedCategory === catKey) {
      setSelectedCategory(null); // Toggle off if clicked again to return to default
    } else {
      setSelectedCategory(catKey);
    }
  }

  async function loadAnalyticsData() {
    setLoading(true);

    const now = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - rangeDays);

    const timeMin = startDate.toISOString();
    const timeMax = now.toISOString();

    // 1. Fetch Supabase workout logs
    let dbLogs = [];
    if (user) {
      const { data } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', now.toISOString().split('T')[0]);

      if (data) dbLogs = data;
    } else {
      const localStr = typeof window !== 'undefined' ? (localStorage.getItem('nexus_logged_workouts') || localStorage.getItem('apex_logged_workouts')) : null;
      const local = JSON.parse(localStr || '[]');
      dbLogs = local;
    }

    // 2. Fetch Google Calendar events for the time range
    let gcalLogs = [];
    const activeToken = session?.provider_token || (typeof window !== 'undefined' ? localStorage.getItem('nexus_provider_token') : null);

    if (activeToken) {
      const targetCalId = getSavedCalendarId(profile);
      const rawGcal = await fetchCalendarEvents(activeToken, targetCalId, timeMin, timeMax);

      // Apply category overrides
      const localOverrides = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('apex_gcal_category_overrides') || '{}' : '{}');
      const profileOverrides = profile?.gcal_category_overrides || {};
      const mergedOverrides = { ...localOverrides, ...profileOverrides };

      gcalLogs = rawGcal.map((evt) => {
        const key = evt.gcalId || evt.id;
        if (mergedOverrides[key]) {
          return { ...evt, category: mergedOverrides[key] };
        }
        return evt;
      });
    }

    // 3. Combine & Deduplicate
    const seen = new Set();
    const merged = [];

    [...dbLogs, ...gcalLogs].forEach((item) => {
      const uid = item.gcalId || item.id || `${item.date}_${item.workout_name || item.summary}`;
      if (!seen.has(uid)) {
        seen.add(uid);
        merged.push(item);
      }
    });

    setCombinedEvents(merged);
    setLoading(false);
  }

  // Helper to categorize each event
  function categorizeEvent(item) {
    const cat = (item.category || item.type || '').toLowerCase();
    const text = `${item.workout_name || item.summary || ''} ${item.notes || ''}`.toLowerCase();

    if (cat === 'weightlifting' || cat.includes('weight') || cat.includes('lift') || text.includes('lift') || text.includes('squat') || text.includes('gym')) {
      return 'weightlifting';
    } else if (cat === 'grass_volleyball' || cat.includes('grass')) {
      return 'grass_volleyball';
    } else if (cat === 'volleyball' || cat.includes('volleyball') || text.includes('volleyball') || text.includes('spike')) {
      return 'volleyball';
    } else if (cat === 'basketball' || cat.includes('basket') || text.includes('hoop')) {
      return 'basketball';
    } else if (cat === 'running' || cat.includes('run') || text.includes('sprint') || text.includes('run')) {
      return 'running';
    } else if (cat === 'flag_football' || cat.includes('football') || text.includes('football')) {
      return 'flag_football';
    } else if (cat === 'recovery' || cat.includes('recovery') || cat.includes('stretch') || text.includes('yoga')) {
      return 'recovery';
    } else {
      return 'other';
    }
  }

  // Handle Category Change inside Event Modal
  async function handleCategoryChange(newCategory) {
    if (!activeDetailEvent) return;

    const updatedEvent = { ...activeDetailEvent, category: newCategory };
    setActiveDetailEvent(updatedEvent);

    if (activeDetailEvent.isGcal) {
      const eventKey = activeDetailEvent.gcalId || activeDetailEvent.id;
      const localOverrides = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('apex_gcal_category_overrides') || '{}' : '{}');
      localOverrides[eventKey] = newCategory;
      if (typeof window !== 'undefined') {
        localStorage.setItem('apex_gcal_category_overrides', JSON.stringify(localOverrides));
      }

      if (user) {
        await supabase
          .from('profiles')
          .update({ gcal_category_overrides: localOverrides })
          .eq('id', user.id);
      }
    } else if (activeDetailEvent.id) {
      if (user) {
        await supabase
          .from('workout_logs')
          .update({ category: newCategory })
          .eq('id', activeDetailEvent.id);
      } else if (typeof window !== 'undefined') {
        const localLogs = JSON.parse(localStorage.getItem('nexus_logged_workouts') || localStorage.getItem('apex_logged_workouts') || '[]');
        const updatedLogs = localLogs.map((l) => (l.id === activeDetailEvent.id ? { ...l, category: newCategory } : l));
        localStorage.setItem('nexus_logged_workouts', JSON.stringify(updatedLogs));
      }
    }

    setCategorySaved(true);
    setTimeout(() => setCategorySaved(false), 2000);
    loadAnalyticsData();
  }

  // Handle Duration Change inside Event Modal
  async function handleDurationChange(newDuration) {
    if (!activeDetailEvent) return;

    const numDuration = Number(newDuration);
    if (!numDuration || numDuration <= 0) return;

    const updatedEvent = { ...activeDetailEvent, duration: numDuration };
    setActiveDetailEvent(updatedEvent);

    if (activeDetailEvent.isGcal) {
      const activeToken = session?.provider_token || (typeof window !== 'undefined' ? localStorage.getItem('nexus_provider_token') : null);
      if (activeToken && activeDetailEvent.gcalId) {
        const targetCalId = getSavedCalendarId(profile);
        await updateGoogleCalendarEventDuration(
          activeToken,
          targetCalId,
          activeDetailEvent.gcalId,
          numDuration,
          activeDetailEvent.startDateTime,
          activeDetailEvent.date
        );
      }
    } else if (activeDetailEvent.id) {
      if (user) {
        await supabase
          .from('workout_logs')
          .update({ duration: numDuration })
          .eq('id', activeDetailEvent.id);
      } else if (typeof window !== 'undefined') {
        const localLogs = JSON.parse(localStorage.getItem('nexus_logged_workouts') || localStorage.getItem('apex_logged_workouts') || '[]');
        const updatedLogs = localLogs.map((l) => (l.id === activeDetailEvent.id ? { ...l, duration: numDuration } : l));
        localStorage.setItem('nexus_logged_workouts', JSON.stringify(updatedLogs));
      }
    }

    setDurationSaved(true);
    setTimeout(() => setDurationSaved(false), 2000);
    loadAnalyticsData();
  }

  // Handle Delete Event
  async function handleDeleteEvent(eventToDelete) {
    if (!eventToDelete) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete "${eventToDelete.workout_name || eventToDelete.summary}"?`);
    if (!confirmDelete) return;

    if (eventToDelete.isGcal) {
      const activeToken = session?.provider_token || (typeof window !== 'undefined' ? localStorage.getItem('nexus_provider_token') : null);
      if (activeToken && eventToDelete.gcalId) {
        const targetCalId = getSavedCalendarId(profile);
        await deleteGoogleCalendarEvent(activeToken, targetCalId, eventToDelete.gcalId);
      }
    } else if (eventToDelete.id) {
      if (user) {
        await supabase.from('workout_logs').delete().eq('id', eventToDelete.id);
      } else if (typeof window !== 'undefined') {
        const localLogs = JSON.parse(localStorage.getItem('nexus_logged_workouts') || localStorage.getItem('apex_logged_workouts') || '[]');
        const updatedLogs = localLogs.filter((l) => l.id !== eventToDelete.id);
        localStorage.setItem('nexus_logged_workouts', JSON.stringify(updatedLogs));
      }
    }

    setActiveDetailEvent(null);
    loadAnalyticsData();
  }

  // Habit Management for Analytics Matrix
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

    if (typeof window !== 'undefined') {
      const storageKey = user ? `nexus_custom_habits_${user.id}` : 'nexus_custom_habits_guest';
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
  }

  function handleDeleteHabit(habitId) {
    const updated = habits.filter(h => h.id !== habitId);
    setHabits(updated);

    if (typeof window !== 'undefined') {
      const storageKey = user ? `nexus_custom_habits_${user.id}` : 'nexus_custom_habits_guest';
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
  }

  function toggleHabitCheck(habitId, dateKey) {
    const key = `${habitId}_${dateKey}`;
    const nextLogs = { ...habitLogs, [key]: !habitLogs[key] };
    setHabitLogs(nextLogs);

    if (typeof window !== 'undefined') {
      const storageKey = user ? `nexus_habit_logs_${user.id}` : 'nexus_habit_logs_guest';
      localStorage.setItem(storageKey, JSON.stringify(nextLogs));
    }
  }

  // Calculate deep habit stats (Current Streak, Longest All-Time Streak, 30-Day Success %, Best Day of Week)
  function getHabitDeepStats(habitId) {
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let countIn30Days = 0;

    const weekdayCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = formatDateKey(d);
      if (habitLogs[`${habitId}_${dateKey}`]) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }

    analyticsHabitDates.forEach(d => {
      if (habitLogs[`${habitId}_${d.dateKey}`]) {
        countIn30Days++;
        const dayName = d.rawDate.toLocaleDateString('en-US', { weekday: 'short' });
        if (weekdayCounts[dayName] !== undefined) {
          weekdayCounts[dayName]++;
        }
      }
    });

    for (let i = 0; i < 180; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = formatDateKey(d);
      if (habitLogs[`${habitId}_${dateKey}`]) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    const thirtyDaySuccessRate = Math.round((countIn30Days / 30) * 100);
    const sortedDays = Object.entries(weekdayCounts).sort((a, b) => b[1] - a[1]);
    const bestDay = sortedDays[0]?.[1] > 0 ? sortedDays[0][0] : 'N/A';

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      thirtyDaySuccessRate,
      countIn30Days,
      bestDay
    };
  }

  // Aggregate category durations
  const categoryStats = {
    weightlifting: 0,
    volleyball: 0,
    grass_volleyball: 0,
    basketball: 0,
    running: 0,
    flag_football: 0,
    recovery: 0,
    other: 0,
  };

  combinedEvents.forEach((item) => {
    const catKey = categorizeEvent(item);
    const duration = Number(item.duration || 45);
    categoryStats[catKey] += duration;
  });

  const totalMinutes = Object.values(categoryStats).reduce((a, b) => a + b, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const weeksInRange = Math.max(1, rangeDays / 7);
  const weeklyAvgHours = (totalHours / weeksInRange).toFixed(1);

  // Find top discipline
  const sortedCategories = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]);
  const topCategoryKey = sortedCategories[0]?.[0] || 'weightlifting';
  const topCategoryMins = sortedCategories[0]?.[1] || 0;

  // Filtered events for the currently selected category (null = All Categories)
  const selectedCategoryEvents = (selectedCategory
    ? combinedEvents.filter((item) => categorizeEvent(item) === selectedCategory)
    : combinedEvents
  ).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const CATEGORY_COLORS = {
    weightlifting: '#0052FF',
    volleyball: '#F59E0B',
    grass_volleyball: '#10B981',
    basketball: '#F97316',
    running: '#06B6D4',
    flag_football: '#EF4444',
    recovery: '#8B5CF6',
    other: '#64748B'
  };

  const chartData = {
    labels: ['Weightlifting', 'Sand Volleyball', 'Grass Volleyball', 'Basketball', 'Running', 'Flag Football', 'Recovery', 'Other'],
    datasets: [
      {
        label: 'Total Active Hours',
        data: CATEGORY_KEYS.map((k) => (categoryStats[k] / 60).toFixed(1)),
        backgroundColor: CATEGORY_KEYS.map((k) => CATEGORY_COLORS[k] || '#0052FF'),
        borderColor: CATEGORY_KEYS.map((k) => (k === selectedCategory ? '#00F0FF' : 'transparent')),
        borderWidth: CATEGORY_KEYS.map((k) => (k === selectedCategory ? 4 : 0)),
        borderRadius: 8
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event, elements) => {
      if (elements && elements.length > 0) {
        const idx = elements[0].index;
        const clickedCategory = CATEGORY_KEYS[idx];
        if (clickedCategory) {
          handleCategorySelect(clickedCategory);
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y} Hours (${Math.round(context.parsed.y * 60)} Mins) — Click to view events`
        }
      }
    },
    scales: {
      y: {
        title: { display: true, text: 'Hours', color: '#94A3B8' },
        ticks: { color: '#94A3B8' },
        grid: { color: '#E2E8F0' }
      },
      x: {
        ticks: { color: '#94A3B8' },
        grid: { display: false }
      }
    }
  };

  return (
    <div>
      {/* Header & Range Filter Bar */}
      <div className="card-header" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2><BarChart3 size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} /> NEXUS Life & Fitness Analytics</h2>
            <span className="card-description">Comprehensive multi-sport analytics, 30-day expanded habit matrix, and historical Google Calendar tracking.</span>
          </div>

          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={loadAnalyticsData} disabled={loading}>
            <RefreshCw size={14} style={{ marginRight: 4 }} /> {loading ? 'Analyzing...' : 'Refresh Analytics'}
          </button>
        </div>
      </div>

      {/* Time Range Pills */}
      <div className="feed-filter-bar" style={{ marginBottom: 20 }}>
        <button className={`filter-pill ${rangeDays === 30 ? 'active' : ''}`} onClick={() => setRangeDays(30)}>
          Last 30 Days
        </button>
        <button className={`filter-pill ${rangeDays === 90 ? 'active' : ''}`} onClick={() => setRangeDays(90)}>
          Last 90 Days
        </button>
        <button className={`filter-pill ${rangeDays === 240 ? 'active' : ''}`} onClick={() => setRangeDays(240)}>
          Last 8 Months
        </button>
        <button className={`filter-pill ${rangeDays === 365 ? 'active' : ''}`} onClick={() => setRangeDays(365)}>
          Last 1 Year
        </button>
      </div>

      {/* Re-authorize Google Calendar Notice if Token Missing */}
      {!session?.provider_token && (typeof window === 'undefined' || !localStorage.getItem('nexus_provider_token')) && (
        <div style={{ backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', padding: '14px 16px', borderRadius: 'var(--border-radius-md)', marginBottom: 20 }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', marginBottom: 8, fontWeight: 600 }}>
            💡 Connect Google Calendar to analyze 8 months of historical fitness events.
          </p>
          <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={signInWithGoogle}>
            🔑 Grant Google Calendar Permissions
          </button>
        </div>
      )}

      {/* 4 Key Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div className="dashboard-card" style={{ marginBottom: 0 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Logged Sessions
          </span>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--color-accent)', marginTop: 4 }}>{combinedEvents.length}</h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Workouts & Calendar Events</span>
        </div>

        <div className="dashboard-card" style={{ marginBottom: 0 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Active Hours
          </span>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--color-success)', marginTop: 4 }}>{totalHours} hrs</h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Over last {rangeDays} days</span>
        </div>

        <div className="dashboard-card" style={{ marginBottom: 0 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Weekly Average
          </span>
          <h2 style={{ fontSize: '1.8rem', color: '#8B5CF6', marginTop: 4 }}>{weeklyAvgHours} hrs/wk</h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Training Volume Pace</span>
        </div>

        <div className="dashboard-card" style={{ marginBottom: 0 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Top Sport Discipline
          </span>
          <h2 style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)', marginTop: 8 }}>
            {CATEGORY_NAMES[topCategoryKey] || '🏋️ Weightlifting'}
          </h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            {(topCategoryMins / 60).toFixed(1)} hrs logged
          </span>
        </div>
      </div>

      {/* Interactive Volume Chart Card */}
      <div className="dashboard-card">
        <div className="card-header" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>Multi-Sport Volume Distribution (Hours)</h3>
            <span className="card-description">Click any bar below to view and manage events for that category.</span>
          </div>
          <span className="badge-tag blue" style={{ fontSize: '0.75rem' }}>
            Selected: {selectedCategory ? CATEGORY_NAMES[selectedCategory] : 'All Categories'}
          </span>
        </div>

        <div style={{ height: 280, position: 'relative', cursor: 'pointer' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* 30-DAY EXPANDED HABIT & ROUTINE MATRIX CARD */}
      <div className="habit-matrix-card" id="habit-matrix" style={{ marginTop: 24, marginBottom: 24 }}>
        <div className="card-header" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3>30-Day Expanded Habit & Routine Matrix</h3>
            <span className="card-description">Comprehensive 30-day view with historical streak tracking, longest all-time streak, monthly success rate, and best day of week.</span>
          </div>

          {/* Month Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              onClick={() => setMonthOffset(monthOffset - 1)}
            >
              <ChevronLeft size={14} /> Earlier 30 Days
            </button>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-accent)' }}>
              {monthOffset === 0 ? 'Current 30 Days' : `${Math.abs(monthOffset * 30)} Days Ago`}
            </span>
            {monthOffset < 0 && (
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                onClick={() => setMonthOffset(monthOffset + 1)}
              >
                Newer <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Matrix Scrollable Container */}
        <div className="habit-matrix-wrapper" style={{ maxHeight: 480 }}>
          <table className="habit-table">
            <thead>
              <tr>
                <th className="sticky-col-left" style={{ minWidth: 140 }}>Habit / Routine</th>
                {analyticsHabitDates.map((d) => (
                  <th
                    key={d.dateKey}
                    ref={d.isToday ? analyticsTodayRef : null}
                    className={`date-col-header ${d.isToday ? 'is-today' : ''}`}
                  >
                    <div>{d.dayLabel}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 900 }}>{d.numLabel}</div>
                  </th>
                ))}
                <th className="sticky-col-right" style={{ minWidth: 160, textAlign: 'center' }}>Deep Habit Analytics</th>
              </tr>
            </thead>
            <tbody>
              {habits.map((habit) => {
                const deepStats = getHabitDeepStats(habit.id);
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
                    {analyticsHabitDates.map((d) => {
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                          <span className="streak-badge" title="Current Active Streak">
                            🔥 {deepStats.currentStreak}d
                          </span>
                          <span className="badge-tag gold" style={{ fontSize: '0.65rem', padding: '2px 5px' }} title="Longest All-Time Streak">
                            🏆 Best: {deepStats.longestStreak}d
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                          <span><strong>{deepStats.thirtyDaySuccessRate}%</strong> (30d)</span>
                          <span>• Top: <strong>{deepStats.bestDay}</strong></span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add Habit Inline Form */}
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

      {/* Category Events Manager Section */}
      <div className="dashboard-card">
        <div className="card-header" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <h3>{selectedCategory ? `${CATEGORY_NAMES[selectedCategory]} Events` : 'All Sport Events'} ({selectedCategoryEvents.length})</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              Total: <strong>{selectedCategory ? `${(categoryStats[selectedCategory] / 60).toFixed(1)} hrs` : `${totalHours} hrs`}</strong> logged over last {rangeDays} days
            </span>
          </div>
        </div>

        {/* Category Pill Buttons */}
        <div className="feed-filter-bar" style={{ marginBottom: 16 }}>
          <button
            className={`filter-pill ${selectedCategory === null ? 'active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            🌟 All Categories ({combinedEvents.length})
          </button>
          {CATEGORY_KEYS.map((k) => (
            <button
              key={k}
              className={`filter-pill ${selectedCategory === k ? 'active' : ''}`}
              onClick={() => handleCategorySelect(k)}
            >
              {CATEGORY_NAMES[k]} ({combinedEvents.filter((item) => categorizeEvent(item) === k).length})
            </button>
          ))}
        </div>

        {/* Events List */}
        {selectedCategoryEvents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selectedCategoryEvents.map((evt, idx) => (
              <div
                key={evt.gcalId || evt.id || idx}
                className="dashboard-card"
                style={{ marginBottom: 0, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-surface-elevated)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: '1.4rem' }}>
                    {evt.isGcal ? '📅' : '🏋️'}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', margin: 0 }}>{evt.workout_name || evt.summary}</h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                      {evt.date} • {evt.duration || 45} mins {evt.isGcal ? '• Google Calendar' : '• NEXUS Log'}
                    </span>
                    {evt.notes && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '2px 0 0 0', fontStyle: 'italic' }}>
                        "{evt.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    onClick={() => setActiveDetailEvent(evt)}
                  >
                    Edit / Details <ChevronRight size={14} />
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                    onClick={() => handleDeleteEvent(evt)}
                    title="Delete Event"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="card-description" style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-muted)' }}>
            No events logged under {selectedCategory ? CATEGORY_NAMES[selectedCategory] : 'All Categories'} in the last {rangeDays} days.
          </p>
        )}
      </div>

      {/* EVENT EDITING MODAL */}
      {activeDetailEvent && (
        <div className="modal-overlay" onClick={() => setActiveDetailEvent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div>
                <span className={`badge-tag ${activeDetailEvent.isGcal ? 'blue' : 'green'}`} style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                  {activeDetailEvent.isGcal ? 'Google Calendar Event' : 'NEXUS Workout Log'}
                </span>
                <h3 className="modal-title" style={{ marginTop: 4 }}>{activeDetailEvent.workout_name || activeDetailEvent.summary}</h3>
              </div>
              <button className="btn-close" onClick={() => setActiveDetailEvent(null)}>×</button>
            </div>

            <div style={{ display: 'flex', gap: 16, color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: 16, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
              <span><CalendarIcon size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> {activeDetailEvent.date}</span>
              <span><Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> {activeDetailEvent.duration || 45} Mins</span>
            </div>

            {/* Sport Category Override Selector */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
                  <Tag size={14} /> Category Classification
                </label>
                {categorySaved && (
                  <span className="badge-tag green" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                    Updated ✓
                  </span>
                )}
              </div>
              <select
                className="form-select"
                value={activeDetailEvent.category || selectedCategory || 'weightlifting'}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                {CATEGORY_KEYS.map((k) => (
                  <option key={k} value={k}>{CATEGORY_NAMES[k]}</option>
                ))}
              </select>
            </div>

            {/* Session Duration Selector & Custom Minute Input */}
            <div className="form-group" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
                  <Clock size={14} /> Duration (Minutes)
                </label>
                {durationSaved && (
                  <span className="badge-tag green" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                    Updated on Google Cal ✓
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <select
                  className="form-select"
                  value={activeDetailEvent.duration || 45}
                  onChange={(e) => handleDurationChange(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes (1 hr)</option>
                  <option value={75}>75 Minutes (1 hr 15m)</option>
                  <option value={90}>90 Minutes (1.5 hrs)</option>
                  <option value={120}>120 Minutes (2 hrs)</option>
                  {!([15, 30, 45, 60, 75, 90, 120].includes(Number(activeDetailEvent.duration))) && (
                    <option value={activeDetailEvent.duration}>
                      {activeDetailEvent.duration} Minutes (Custom)
                    </option>
                  )}
                </select>

                <input
                  type="number"
                  className="form-input"
                  style={{ width: 90 }}
                  placeholder="Mins"
                  value={activeDetailEvent.duration || ''}
                  onChange={(e) => handleDurationChange(e.target.value)}
                  min="1"
                  max="720"
                />
              </div>
            </div>

            {activeDetailEvent.notes && (
              <p className="card-description" style={{ marginBottom: 20, fontStyle: 'italic' }}>
                "{activeDetailEvent.notes}"
              </p>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteEvent(activeDetailEvent)}
                style={{ padding: '10px 16px' }}
              >
                <Trash2 size={16} style={{ marginRight: 4 }} /> Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
