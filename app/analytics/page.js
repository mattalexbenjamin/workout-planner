'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { fetchCalendarEvents, deleteGoogleCalendarEvent, updateGoogleCalendarEventDuration, getSavedCalendarId } from '@/lib/gcalendar';
import { BarChart3, RefreshCw, Clock, Tag, Trash2, ChevronRight, CheckCircle, ExternalLink, Calendar as CalendarIcon, Dumbbell, ChevronLeft, Check, Flame, Award, PlusCircle, Sparkles, TrendingUp, Activity, Zap, Target, Coffee, Scale, Moon, AlertTriangle, BatteryCharging, Plus, X, Sliders, Info, ShieldAlert, Sun } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import MetricTooltip from '@/components/MetricTooltip';
import { DEFAULT_HABITS, fetchUserHabitsAndLogs, saveHabitToAdd, saveHabitToDelete, saveHabitCheckToggle } from '@/lib/habits-sync';

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

  // Volume Metric Toggle State ('hours' | 'instances' | 'days')
  const [volumeMetric, setVolumeMetric] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nexus_analytics_volume_metric') || 'hours';
    }
    return 'hours';
  });

  const handleVolumeMetricChange = (metric) => {
    setVolumeMetric(metric);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_analytics_volume_metric', metric);
    }
  };

  // Selected Category & Event Modal States (null = All Categories)
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeDetailEvent, setActiveDetailEvent] = useState(null);
  const [categorySaved, setCategorySaved] = useState(false);
  const [durationSaved, setDurationSaved] = useState(false);

  // Habit Matrix & GitHub Grid State for Analytics
  const [habits, setHabits] = useState(DEFAULT_HABITS);
  const [habitLogs, setHabitLogs] = useState({});
  const [newHabitName, setNewHabitName] = useState('');
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current 30-day window, -1 = previous 30 days, +1 = next 30 days
  const [heatmapMode, setHeatmapMode] = useState('combined'); // 'combined' | 'habits' | 'workouts'
  const [hoveredHeatmapDay, setHoveredHeatmapDay] = useState(null);

  // --- Caffeine Tracker State & Settings ---
  const [caffeineLogs, setCaffeineLogs] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_caffeine_logs_v1');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    const now = new Date();
    const morning = new Date(now);
    morning.setHours(8, 30, 0, 0);
    return [
      {
        id: 'caff_sample_1',
        name: 'Celsius Can (200mg)',
        caffeineMg: 200,
        timestamp: morning.toISOString(),
        beverageType: 'celsius_can'
      }
    ];
  });

  const [caffeineSettings, setCaffeineSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_caffeine_settings_v1');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return {
      dailyCapMg: 400,
      targetBedtime: '22:30', // 10:30 PM default
      halfLifeHours: 5
    };
  });

  // Modal / Form state for Caffeine Tracker
  const [showCaffeineModal, setShowCaffeineModal] = useState(false);
  const [showCaffeineSettingsModal, setShowCaffeineSettingsModal] = useState(false);
  const [caffFormName, setCaffFormName] = useState('Celsius Can');
  const [caffFormMg, setCaffFormMg] = useState(200);
  const [caffFormPowderGrams, setCaffFormPowderGrams] = useState(5.6);
  const [isScaleMode, setIsScaleMode] = useState(false);
  const [caffFormTime, setCaffFormTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  // LocalStorage Persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_caffeine_logs_v1', JSON.stringify(caffeineLogs));
    }
  }, [caffeineLogs]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_caffeine_settings_v1', JSON.stringify(caffeineSettings));
    }
  }, [caffeineSettings]);

  // Handle Logging
  const handleLogCaffeine = (name, mg, powderGrams = null, customTimeStr = null) => {
    const logDate = new Date();
    if (customTimeStr) {
      const [h, m] = customTimeStr.split(':').map(Number);
      logDate.setHours(h || 0, m || 0, 0, 0);
    }

    const newLog = {
      id: `caff_${Date.now()}`,
      name: name || 'Caffeine Drink',
      caffeineMg: Number(mg),
      powderGrams: powderGrams ? Number(powderGrams) : null,
      timestamp: logDate.toISOString()
    };

    setCaffeineLogs(prev => [newLog, ...prev]);
    setShowCaffeineModal(false);
  };

  const handleDeleteCaffeineLog = (logId) => {
    setCaffeineLogs(prev => prev.filter(item => item.id !== logId));
  };

  // Pharmacokinetic Half-Life Decay Calculations
  const getActiveCaffeineAtTime = (targetDate = new Date()) => {
    const halfLifeMs = (caffeineSettings.halfLifeHours || 5) * 60 * 60 * 1000;
    const targetMs = targetDate.getTime();
    let activeTotal = 0;

    caffeineLogs.forEach(log => {
      const logMs = new Date(log.timestamp).getTime();
      if (targetMs >= logMs) {
        const elapsed = targetMs - logMs;
        const remaining = log.caffeineMg * Math.pow(0.5, elapsed / halfLifeMs);
        activeTotal += remaining;
      }
    });

    return Math.max(0, activeTotal);
  };

  const todayCaffeineTotal = React.useMemo(() => {
    const todayKey = formatDateKey(new Date());
    return caffeineLogs
      .filter(log => formatDateKey(new Date(log.timestamp)) === todayKey)
      .reduce((sum, log) => sum + log.caffeineMg, 0);
  }, [caffeineLogs]);

  const currentActiveCaffeine = getActiveCaffeineAtTime(new Date());

  const bedtimeDateObj = React.useMemo(() => {
    const [h, m] = (caffeineSettings.targetBedtime || '22:30').split(':').map(Number);
    const d = new Date();
    d.setHours(h || 22, m || 30, 0, 0);
    if (Date.now() > d.getTime() + 2 * 3600 * 1000) {
      d.setDate(d.getDate() + 1);
    }
    return d;
  }, [caffeineSettings.targetBedtime]);

  const bedtimeActiveCaffeine = getActiveCaffeineAtTime(bedtimeDateObj);

  // Clearance Time calculation (< 10mg)
  const clearanceTimeInfo = React.useMemo(() => {
    if (currentActiveCaffeine < 10) return { label: 'System Clear (< 10 mg)', hours: 0 };
    const nowMs = Date.now();
    for (let mins = 0; mins <= 36 * 60; mins += 15) {
      const futureDate = new Date(nowMs + mins * 60 * 1000);
      const active = getActiveCaffeineAtTime(futureDate);
      if (active < 10) {
        const hrs = (mins / 60).toFixed(1);
        const timeStr = futureDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return { label: `${timeStr} (~${hrs} hrs)`, hours: Number(hrs) };
      }
    }
    return { label: '> 36 hrs', hours: 36 };
  }, [caffeineLogs, caffeineSettings.halfLifeHours, currentActiveCaffeine]);

  // Sleep Risk Gauge
  const sleepRiskGauge = React.useMemo(() => {
    if (bedtimeActiveCaffeine < 25) {
      return {
        level: 'Low Risk',
        color: '#10B981',
        badgeBg: 'rgba(16, 185, 129, 0.15)',
        desc: 'Optimal for deep slow-wave & REM sleep architecture.'
      };
    } else if (bedtimeActiveCaffeine <= 50) {
      return {
        level: 'Moderate Risk',
        color: '#F59E0B',
        badgeBg: 'rgba(245, 158, 11, 0.15)',
        desc: 'May delay sleep onset latency and reduce restorative deep sleep.'
      };
    } else {
      return {
        level: 'High Sleep Disruption Risk',
        color: '#EF4444',
        badgeBg: 'rgba(239, 68, 68, 0.15)',
        desc: 'Elevated caffeine at bedtime. High risk of fragmented sleep.'
      };
    }
  }, [bedtimeActiveCaffeine]);

  // 24-Hour Bloodstream Decay Line Chart Data
  const caffeineDecayChartData = React.useMemo(() => {
    const labels = [];
    const points = [];
    const now = new Date();
    const startTime = new Date(now);
    startTime.setHours(startTime.getHours() - 6, 0, 0, 0);

    for (let i = 0; i <= 24; i++) {
      const pointDate = new Date(startTime.getTime() + i * 60 * 60 * 1000);
      const activeMg = Math.round(getActiveCaffeineAtTime(pointDate) * 10) / 10;
      const label = pointDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      labels.push(label);
      points.push(activeMg);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Blood Caffeine Level (mg)',
          data: points,
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          borderWidth: 2.5,
          pointRadius: 2,
          pointHoverRadius: 5,
          pointBackgroundColor: '#F59E0B',
          fill: true,
          tension: 0.35
        }
      ]
    };
  }, [caffeineLogs, caffeineSettings.halfLifeHours]);

  const decayChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Active Caffeine: ${context.parsed.y} mg`
        }
      }
    },
    scales: {
      y: {
        min: 0,
        title: { display: true, text: 'Active Caffeine (mg)', color: '#94A3B8' },
        ticks: { color: '#94A3B8' },
        grid: { color: '#E2E8F0' }
      },
      x: {
        ticks: { color: '#94A3B8', maxRotation: 45, minRotation: 0 },
        grid: { display: false }
      }
    }
  };

  // 7-Day History Trend Bar Chart Data
  const caffeineHistoryTrendChartData = React.useMemo(() => {
    const labels = [];
    const data = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = formatDateKey(d);
      const dayName = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });

      const daySum = caffeineLogs
        .filter(log => formatDateKey(new Date(log.timestamp)) === dateKey)
        .reduce((sum, log) => sum + log.caffeineMg, 0);

      labels.push(dayName);
      data.push(daySum);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Daily Caffeine Intake (mg)',
          data,
          backgroundColor: data.map(val => val > (caffeineSettings.dailyCapMg || 400) ? '#EF4444' : '#F59E0B'),
          borderRadius: 6
        }
      ]
    };
  }, [caffeineLogs, caffeineSettings.dailyCapMg]);

  const caffeineHistoryChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Intake: ${context.parsed.y} mg`
        }
      }
    },
    scales: {
      y: {
        min: 0,
        title: { display: true, text: 'Intake (mg)', color: '#94A3B8' },
        ticks: { color: '#94A3B8' },
        grid: { color: '#E2E8F0' }
      },
      x: {
        ticks: { color: '#94A3B8' },
        grid: { display: false }
      }
    }
  };

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
    const { habits: fetchedHabits, habitLogs: fetchedLogs } = await fetchUserHabitsAndLogs(supabase, user);
    setHabits(fetchedHabits);
    setHabitLogs(fetchedLogs);
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

  // Habit Management for Analytics Matrix (Cloud & Local Sync)
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

  // Aggregate category metrics (hours, instances, unique active days)
  const categoryStats = { weightlifting: 0, volleyball: 0, grass_volleyball: 0, basketball: 0, running: 0, flag_football: 0, recovery: 0, other: 0 };
  const categoryInstances = { weightlifting: 0, volleyball: 0, grass_volleyball: 0, basketball: 0, running: 0, flag_football: 0, recovery: 0, other: 0 };
  const categoryDaysMap = {
    weightlifting: new Set(),
    volleyball: new Set(),
    grass_volleyball: new Set(),
    basketball: new Set(),
    running: new Set(),
    flag_football: new Set(),
    recovery: new Set(),
    other: new Set()
  };

  combinedEvents.forEach((item) => {
    const catKey = categorizeEvent(item);
    const duration = Number(item.duration || 45);
    if (categoryStats[catKey] !== undefined) {
      categoryStats[catKey] += duration;
      categoryInstances[catKey] += 1;
      const rawDate = item.date || item.startDateTime || item.start?.dateTime || item.start?.date;
      if (rawDate) {
        const dateKey = String(rawDate).split('T')[0];
        categoryDaysMap[catKey].add(dateKey);
      }
    }
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

  // Habit Suite Calculations across rangeDays (30/90/240/365)
  const habitAnalyticsSuite = React.useMemo(() => {
    const today = new Date();
    const rangeDates = [];
    const dateKeysSet = new Set();

    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = formatDateKey(d);
      const monthDayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      rangeDates.push({ dateKey, label: monthDayStr, rawDate: d });
      dateKeysSet.add(dateKey);
    }

    const totalActiveHabits = habits.length;
    let totalPossibleChecks = 0;
    let totalActualChecks = 0;
    let perfectDays = 0;

    const trendLabels = [];
    const trendRates = [];
    const step = rangeDays > 120 ? 7 : rangeDays > 60 ? 3 : 1;

    rangeDates.forEach((d, index) => {
      let dayCompleted = 0;
      habits.forEach((h) => {
        if (habitLogs[`${h.id}_${d.dateKey}`]) {
          dayCompleted++;
          totalActualChecks++;
        }
      });

      totalPossibleChecks += totalActiveHabits;

      if (totalActiveHabits > 0 && dayCompleted === totalActiveHabits) {
        perfectDays++;
      }

      const dailyRate = totalActiveHabits > 0 ? Math.round((dayCompleted / totalActiveHabits) * 100) : 0;

      if (index % step === 0 || index === rangeDates.length - 1) {
        trendLabels.push(d.label);
        trendRates.push(dailyRate);
      }
    });

    const overallComplianceRate = totalPossibleChecks > 0 ? Math.round((totalActualChecks / totalPossibleChecks) * 100) : 0;

    const perHabitList = habits.map((h) => {
      let count = 0;
      rangeDates.forEach((d) => {
        if (habitLogs[`${h.id}_${d.dateKey}`]) count++;
      });
      const rate = rangeDates.length > 0 ? Math.round((count / rangeDates.length) * 100) : 0;
      const cleanName = h.name.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u, '');
      return {
        id: h.id,
        name: h.name,
        shortName: cleanName || h.name,
        complianceRate: rate,
        totalChecks: count
      };
    });

    let topStreakHabit = { name: 'None', streak: 0 };
    habits.forEach((h) => {
      let streak = 0;
      for (let i = 0; i < 90; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateKey = formatDateKey(d);
        if (habitLogs[`${h.id}_${dateKey}`]) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }
      if (streak > topStreakHabit.streak) {
        topStreakHabit = { name: h.name, streak };
      }
    });

    const workoutDateKeys = new Set();
    combinedEvents.forEach((evt) => {
      const rawDate = evt.date || evt.startDateTime || evt.start?.dateTime || evt.start?.date;
      if (rawDate) {
        const dateKey = String(rawDate).split('T')[0];
        if (dateKeysSet.has(dateKey)) {
          workoutDateKeys.add(dateKey);
        }
      }
    });

    let workoutDaysWithHighHabits = 0;
    workoutDateKeys.forEach((dKey) => {
      let count = 0;
      habits.forEach((h) => {
        if (habitLogs[`${h.id}_${dKey}`]) count++;
      });
      if (count >= 3 || (totalActiveHabits > 0 && count / totalActiveHabits >= 0.5)) {
        workoutDaysWithHighHabits++;
      }
    });

    const totalWorkoutDays = workoutDateKeys.size;
    const synergyScore = totalWorkoutDays > 0 ? Math.round((workoutDaysWithHighHabits / totalWorkoutDays) * 100) : 0;

    let synergyInsight = `On workout days over the last ${rangeDays} days, you hit 3+ core habits on ${synergyScore}% of your active training days!`;
    if (synergyScore >= 75) {
      synergyInsight = `🔥 Exceptional Synergy! You completed your core routines on ${synergyScore}% of training days. Consistency in nutrition, sleep & hydration directly fuels your peak performance.`;
    } else if (synergyScore >= 50) {
      synergyInsight = `⚡ Solid Routine Synergy! You maintained high habit compliance on ${synergyScore}% of workout days. Elevate sleep & hydration to unlock even higher energy levels.`;
    } else if (totalWorkoutDays > 0) {
      synergyInsight = `💡 Growth Opportunity: You completed core habits on ${synergyScore}% of workout days. Checking habits on training days helps prevent burnout and speeds up recovery.`;
    }

    return {
      overallComplianceRate,
      perfectDays,
      topStreakHabit,
      synergyScore,
      synergyInsight,
      trendLabels,
      trendRates,
      perHabitList
    };
  }, [habits, habitLogs, rangeDays, combinedEvents]);

  const dailyComplianceTrendChartData = {
    labels: habitAnalyticsSuite.trendLabels,
    datasets: [
      {
        label: 'Daily Habit Compliance %',
        data: habitAnalyticsSuite.trendRates,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderWidth: 2.5,
        pointRadius: habitAnalyticsSuite.trendRates.length > 60 ? 0 : 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#10B981',
        fill: true,
        tension: 0.3
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y}% Habits Completed`
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        title: { display: true, text: 'Compliance %', color: '#94A3B8' },
        ticks: { color: '#94A3B8', callback: (val) => `${val}%` },
        grid: { color: '#E2E8F0' }
      },
      x: {
        ticks: { color: '#94A3B8', maxTicksLimit: 10 },
        grid: { display: false }
      }
    }
  };

  const habitComparisonChartData = {
    labels: habitAnalyticsSuite.perHabitList.map((h) => h.shortName),
    datasets: [
      {
        label: 'Compliance Rate %',
        data: habitAnalyticsSuite.perHabitList.map((h) => h.complianceRate),
        backgroundColor: habitAnalyticsSuite.perHabitList.map((h) =>
          h.complianceRate >= 75 ? '#10B981' : h.complianceRate >= 45 ? '#0052FF' : '#F59E0B'
        ),
        borderRadius: 6,
        borderWidth: 0
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const item = habitAnalyticsSuite.perHabitList[context.dataIndex];
            return item ? `${item.name}: ${context.parsed.y}% (${item.totalChecks} days)` : `${context.parsed.y}%`;
          }
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        title: { display: true, text: 'Compliance %', color: '#94A3B8' },
        ticks: { color: '#94A3B8', callback: (val) => `${val}%` },
        grid: { color: '#E2E8F0' }
      },
      x: {
        ticks: { color: '#94A3B8' },
        grid: { display: false }
      }
    }
  };

  // GitHub-Style 52-Week Contribution Grid Data Computation (365 Days)
  const githubGridData = React.useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sun ... 6 = Sat

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (51 * 7 + currentDayOfWeek));

    const weeks = [];
    let currentWeek = [];
    const monthHeaders = [];
    let lastMonth = -1;
    let totalContributions = 0;
    let activeDaysCount = 0;

    const totalDays = 364 + currentDayOfWeek + 1;

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateKey = formatDateKey(d);
      const dayOfWeek = d.getDay();
      const monthNum = d.getMonth();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });

      const completedHabits = habits.filter((h) => Boolean(habitLogs[`${h.id}_${dateKey}`]));

      const dayWorkouts = combinedEvents.filter((evt) => {
        const rawDate = evt.date || evt.startDateTime || evt.start?.dateTime || evt.start?.date;
        return rawDate && String(rawDate).split('T')[0] === dateKey;
      });

      let score = 0;
      let level = 0;

      if (heatmapMode === 'habits') {
        score = completedHabits.length;
        if (score >= 4) level = 4;
        else if (score >= 3) level = 3;
        else if (score >= 2) level = 2;
        else if (score >= 1) level = 1;
      } else if (heatmapMode === 'workouts') {
        score = dayWorkouts.length;
        if (score >= 3) level = 4;
        else if (score === 2) level = 3;
        else if (score === 1) level = 2;
      } else {
        score = completedHabits.length + (dayWorkouts.length * 2);
        if (score >= 5) level = 4;
        else if (score >= 3) level = 3;
        else if (score >= 2) level = 2;
        else if (score >= 1) level = 1;
      }

      if (score > 0) {
        totalContributions += score;
        activeDaysCount++;
      }

      const dayObj = {
        dateKey,
        rawDate: d,
        dayOfWeek,
        formattedDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        completedHabits,
        dayWorkouts,
        score,
        level,
        isToday: dateKey === formatDateKey(new Date())
      };

      currentWeek.push(dayObj);

      if (dayOfWeek === 0) {
        if (monthNum !== lastMonth) {
          monthHeaders.push({ weekIndex: weeks.length, label: monthName });
          lastMonth = monthNum;
        }
      }

      if (dayOfWeek === 6 || i === totalDays - 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    return {
      weeks,
      monthHeaders,
      totalContributions,
      activeDaysCount,
      totalDays
    };
  }, [habits, habitLogs, combinedEvents, heatmapMode]);


  const getMetricData = () => {
    if (volumeMetric === 'instances') {
      return CATEGORY_KEYS.map((k) => categoryInstances[k]);
    } else if (volumeMetric === 'days') {
      return CATEGORY_KEYS.map((k) => categoryDaysMap[k].size);
    }
    return CATEGORY_KEYS.map((k) => (categoryStats[k] / 60).toFixed(1));
  };

  const getMetricLabel = () => {
    if (volumeMetric === 'instances') return 'Session Instances';
    if (volumeMetric === 'days') return 'Unique Active Days';
    return 'Total Active Hours';
  };

  const getMetricYAxisTitle = () => {
    if (volumeMetric === 'instances') return 'Sessions';
    if (volumeMetric === 'days') return 'Active Days';
    return 'Hours';
  };

  const chartData = {
    labels: ['Weightlifting', 'Sand Volleyball', 'Grass Volleyball', 'Basketball', 'Running', 'Flag Football', 'Recovery', 'Other'],
    datasets: [
      {
        label: getMetricLabel(),
        data: getMetricData(),
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
          label: (context) => {
            const val = context.parsed.y;
            if (volumeMetric === 'instances') {
              return `${val} Session${val === 1 ? '' : 's'} — Click to view events`;
            } else if (volumeMetric === 'days') {
              return `${val} Active Day${val === 1 ? '' : 's'} — Click to view events`;
            }
            return `${val} Hours (${Math.round(val * 60)} Mins) — Click to view events`;
          }
        }
      }
    },
    scales: {
      y: {
        title: { display: true, text: getMetricYAxisTitle(), color: '#94A3B8' },
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
        <div className="card-header" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ display: 'inline-flex', alignItems: 'center' }}>
              Multi-Sport Volume Distribution ({volumeMetric === 'instances' ? 'Sessions' : volumeMetric === 'days' ? 'Days' : 'Hours'})
              <MetricTooltip
                title="Multi-Sport Volume Metric"
                description="Toggle between ⏱️ Total Hours, 🔢 Session Instances, and 📅 Unique Active Days to analyze training volume across disciplines."
                formula="Hours = Total Mins ÷ 60 | Instances = Sessions Count | Days = Unique Active Dates"
                position="top"
              />
            </h3>
            <span className="card-description">Click any bar below to view and manage events for that category.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Metric Toggle Pills */}
            <div className="feed-filter-bar" style={{ margin: 0 }}>
              <button
                className={`filter-pill ${volumeMetric === 'hours' ? 'active' : ''}`}
                onClick={() => handleVolumeMetricChange('hours')}
                style={{ padding: '4px 12px', fontSize: '0.78rem' }}
              >
                Hours
              </button>
              <button
                className={`filter-pill ${volumeMetric === 'instances' ? 'active' : ''}`}
                onClick={() => handleVolumeMetricChange('instances')}
                style={{ padding: '4px 12px', fontSize: '0.78rem' }}
              >
                Instances
              </button>
              <button
                className={`filter-pill ${volumeMetric === 'days' ? 'active' : ''}`}
                onClick={() => handleVolumeMetricChange('days')}
                style={{ padding: '4px 12px', fontSize: '0.78rem' }}
              >
                Days
              </button>
            </div>

            <span className="badge-tag blue" style={{ fontSize: '0.75rem' }}>
              Selected: {selectedCategory ? CATEGORY_NAMES[selectedCategory] : 'All Categories'}
            </span>
          </div>
        </div>

        <div style={{ height: 280, position: 'relative', cursor: 'pointer' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* HABITS & ROUTINES ANALYTICS HUB */}
      <div className="habit-analytics-hub" style={{ marginTop: 28, marginBottom: 24 }}>
        <div className="card-header" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ display: 'inline-flex', alignItems: 'center', fontSize: '1.35rem', color: 'var(--color-text-primary)' }}>
                <Sparkles size={22} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: 'var(--color-accent)' }} />
                Habits & Routines Analytics Hub
              </h2>
              <span className="card-description" style={{ display: 'block', marginTop: 2 }}>
                Comprehensive habit compliance metrics, habit-workout synergy correlation, daily trend analytics, and habit comparison.
              </span>
            </div>
            <span className="badge-tag blue" style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
              Range: Last {rangeDays} Days
            </span>
          </div>
        </div>

        {/* 4 Habit Summary KPI Cards Grid */}
        <div className="habit-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 16 }}>
          <div className="dashboard-card" style={{ marginBottom: 0, padding: '14px 16px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Activity size={14} style={{ color: 'var(--color-accent)' }} /> Habit Compliance Rate
            </span>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--color-accent)', marginTop: 6, marginBottom: 2 }}>
              {habitAnalyticsSuite.overallComplianceRate}%
            </h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Over last {rangeDays} days</span>
          </div>

          <div className="dashboard-card" style={{ marginBottom: 0, padding: '14px 16px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle size={14} style={{ color: 'var(--color-success)' }} /> Perfect Habit Days
            </span>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--color-success)', marginTop: 6, marginBottom: 2 }}>
              {habitAnalyticsSuite.perfectDays} days
            </h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>100% habits completed</span>
          </div>

          <div className="dashboard-card" style={{ marginBottom: 0, padding: '14px 16px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Flame size={14} style={{ color: '#F59E0B' }} /> Top Active Habit Streak
            </span>
            <h2 style={{ fontSize: '1.4rem', color: '#F59E0B', marginTop: 8, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              🔥 {habitAnalyticsSuite.topStreakHabit.streak}d
            </h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {habitAnalyticsSuite.topStreakHabit.name}
            </span>
          </div>

          <div className="dashboard-card" style={{ marginBottom: 0, padding: '14px 16px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Zap size={14} style={{ color: '#8B5CF6' }} /> Habit-Workout Synergy
            </span>
            <h2 style={{ fontSize: '1.8rem', color: '#8B5CF6', marginTop: 6, marginBottom: 2 }}>
              {habitAnalyticsSuite.synergyScore}%
            </h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Workout days with 3+ habits</span>
          </div>
        </div>

        {/* Habit-Workout Correlation Synergy Insight Banner */}
        <div className="synergy-banner" style={{
          backgroundColor: 'rgba(0, 82, 255, 0.06)',
          border: '1px solid rgba(0, 82, 255, 0.2)',
          borderRadius: 'var(--border-radius-md)',
          padding: '12px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap'
        }}>
          <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>⚡</div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h4 style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>
              Habit-Workout Synergy Insight
            </h4>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
              {habitAnalyticsSuite.synergyInsight}
            </p>
          </div>
        </div>

        {/* Dual Side-by-Side Charts (Responsive Stack on Mobile) */}
        <div className="habit-charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {/* Chart 1: Daily Compliance Trend Line Chart */}
          <div className="dashboard-card" style={{ marginBottom: 0, padding: '16px' }}>
            <div className="card-header" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.95rem', margin: 0, display: 'inline-flex', alignItems: 'center' }}>
                <TrendingUp size={16} style={{ marginRight: 6, color: '#10B981' }} />
                Daily Compliance Trend (%)
                <MetricTooltip
                  title="Daily Compliance Trend"
                  description="Tracks percentage of habits completed on each day across your selected date range."
                  formula="Daily % = (Completed Habits ÷ Total Habits) × 100%"
                  position="top"
                />
              </h3>
            </div>
            <div style={{ height: 240, position: 'relative', width: '100%', minWidth: 0 }}>
              <Line data={dailyComplianceTrendChartData} options={lineChartOptions} />
            </div>
          </div>

          {/* Chart 2: Habit-by-Habit Comparison Bar Chart */}
          <div className="dashboard-card" style={{ marginBottom: 0, padding: '16px' }}>
            <div className="card-header" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.95rem', margin: 0, display: 'inline-flex', alignItems: 'center' }}>
                <BarChart3 size={16} style={{ marginRight: 6, color: '#0052FF' }} />
                Per-Habit Compliance Comparison
                <MetricTooltip
                  title="Habit Comparison Breakdown"
                  description="Compares compliance percentages across all individual habits over the selected date range."
                  formula="Habit % = (Total Checks for Habit ÷ Total Days) × 100%"
                  position="top"
                />
              </h3>
            </div>
            <div style={{ height: 240, position: 'relative', width: '100%', minWidth: 0 }}>
              <Bar data={habitComparisonChartData} options={barChartOptions} />
            </div>
          </div>
        </div>

        {/* GITHUB-STYLE 52-WEEK CONTRIBUTION CALENDAR GRID */}
        <div className="dashboard-card" style={{ marginTop: 20, marginBottom: 0, padding: '18px 20px' }}>
          <div className="card-header" style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', margin: 0, display: 'inline-flex', alignItems: 'center' }}>
                <CalendarIcon size={18} style={{ marginRight: 8, color: 'var(--color-accent)' }} />
                NEXUS 52-Week Life & Activity Heatmap
                <MetricTooltip
                  title="GitHub-Style Activity Calendar"
                  description="52-week contribution matrix tracking daily habit compliance and athletic workouts over the past 365 days."
                  formula="Intensity: ⬜ 0 Activity | 🟩 1-2 | 🟩 3-4 | 🟩 5+ (Combined)"
                  position="top"
                />
              </h3>
              <span className="card-description" style={{ display: 'block', marginTop: 2 }}>
                <strong>{githubGridData.totalContributions}</strong> activity points across <strong>{githubGridData.activeDaysCount}</strong> active days in the last 365 days.
              </span>
            </div>

            {/* Heatmap Mode Switcher Filter Pills */}
            <div className="feed-filter-bar" style={{ margin: 0 }}>
              <button
                className={`filter-pill ${heatmapMode === 'combined' ? 'active' : ''}`}
                onClick={() => setHeatmapMode('combined')}
                style={{ padding: '4px 10px', fontSize: '0.76rem' }}
              >
                🌟 Combined Activity
              </button>
              <button
                className={`filter-pill ${heatmapMode === 'habits' ? 'active' : ''}`}
                onClick={() => setHeatmapMode('habits')}
                style={{ padding: '4px 10px', fontSize: '0.76rem' }}
              >
                Habits Only
              </button>
              <button
                className={`filter-pill ${heatmapMode === 'workouts' ? 'active' : ''}`}
                onClick={() => setHeatmapMode('workouts')}
                style={{ padding: '4px 10px', fontSize: '0.76rem' }}
              >
                🏋️ Workouts Only
              </button>
            </div>
          </div>

          {/* GitHub Grid Scroll Container */}
          <div className="github-grid-scroll-wrapper" style={{ overflowX: 'auto', paddingBottom: 6 }}>
            <div className="github-grid-container" style={{ minWidth: 720, paddingTop: 4 }}>
              {/* Month Label Header Row */}
              <div style={{ display: 'flex', marginLeft: 28, marginBottom: 6, height: 16, position: 'relative' }}>
                {githubGridData.monthHeaders.map((mh, idx) => (
                  <span
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: mh.weekIndex * 13.5,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {mh.label}
                  </span>
                ))}
              </div>

              {/* Grid Body (Weekday Labels + 52 Weeks) */}
              <div style={{ display: 'flex', gap: 3 }}>
                {/* Weekday Labels (Mon, Wed, Fri) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: 24, fontSize: '0.65rem', color: 'var(--color-text-muted)', paddingTop: 1 }}>
                  <span style={{ height: 11, lineHeight: '11px' }}></span>
                  <span style={{ height: 11, lineHeight: '11px' }}>Mon</span>
                  <span style={{ height: 11, lineHeight: '11px' }}></span>
                  <span style={{ height: 11, lineHeight: '11px' }}>Wed</span>
                  <span style={{ height: 11, lineHeight: '11px' }}></span>
                  <span style={{ height: 11, lineHeight: '11px' }}>Fri</span>
                  <span style={{ height: 11, lineHeight: '11px' }}></span>
                </div>

                {/* 52 Columns of Weeks */}
                <div style={{ display: 'flex', gap: 3 }}>
                  {githubGridData.weeks.map((week, wIdx) => (
                    <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {week.map((dayObj) => (
                        <div
                          key={dayObj.dateKey}
                          className={`github-cell level-${dayObj.level} ${dayObj.isToday ? 'today-cell' : ''}`}
                          onMouseEnter={() => setHoveredHeatmapDay(dayObj)}
                          onMouseLeave={() => setHoveredHeatmapDay(null)}
                          style={{
                            width: 11,
                            height: 11,
                            borderRadius: 2,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Grid Legend & Live Hover Info Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: 10 }}>
            {/* Live Hover Info Popover Banner */}
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', minHeight: 20 }}>
              {hoveredHeatmapDay ? (
                <span>
                  <strong>{hoveredHeatmapDay.formattedDate}</strong> — {' '}
                  {heatmapMode === 'habits' ? (
                    <span><strong>{hoveredHeatmapDay.completedHabits.length}</strong> habits checked</span>
                  ) : heatmapMode === 'workouts' ? (
                    <span><strong>{hoveredHeatmapDay.dayWorkouts.length}</strong> workout sessions</span>
                  ) : (
                    <span>
                      <strong>{hoveredHeatmapDay.completedHabits.length}</strong> habits checked, {' '}
                      <strong>{hoveredHeatmapDay.dayWorkouts.length}</strong> workouts logged
                    </span>
                  )}
                  {hoveredHeatmapDay.dayWorkouts.length > 0 && (
                    <span style={{ color: 'var(--color-accent)', marginLeft: 6 }}>
                      ({hoveredHeatmapDay.dayWorkouts.map((w) => w.workout_name || w.summary).join(', ')})
                    </span>
                  )}
                </span>
              ) : (
                <span style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>
                  Hover over any square above to view detailed daily habits & workouts.
                </span>
              )}
            </div>

            {/* Intensity Scale Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              <span>Less</span>
              <div className="github-cell level-0" style={{ width: 11, height: 11, borderRadius: 2 }} title="0 Activity" />
              <div className="github-cell level-1" style={{ width: 11, height: 11, borderRadius: 2 }} title="Low Activity" />
              <div className="github-cell level-2" style={{ width: 11, height: 11, borderRadius: 2 }} title="Moderate Activity" />
              <div className="github-cell level-3" style={{ width: 11, height: 11, borderRadius: 2 }} title="High Activity" />
              <div className="github-cell level-4" style={{ width: 11, height: 11, borderRadius: 2 }} title="Peak Activity" />
              <span>More</span>
            </div>
          </div>
        </div>
      </div>

      {/* 30-DAY EXPANDED HABIT & ROUTINE MATRIX CARD */}
      <div className="habit-matrix-card" id="habit-matrix" style={{ marginTop: 24, marginBottom: 24 }}>
        <div className="card-header" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ display: 'inline-flex', alignItems: 'center' }}>
              30-Day Expanded Habit & Routine Matrix
              <MetricTooltip
                title="30-Day Habit Matrix & Analytics"
                description="Tracks your 30-day compliance, current streak, all-time record streak, and identifies your peak performance day of the week."
                formula="30-Day Compliance = (Days Logged ÷ 30) × 100%"
                position="top"
              />
            </h3>
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
        <div className="habit-matrix-wrapper">
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

      {/* CAFFEINE PHARMACOKINETICS & SLEEP READINESS HUB */}
      <div className="caffeine-analytics-hub" style={{ marginTop: 28, marginBottom: 24 }}>
        <div className="card-header" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ display: 'inline-flex', alignItems: 'center', fontSize: '1.35rem', color: 'var(--color-text-primary)' }}>
              <Coffee size={22} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: '#F59E0B' }} />
              Caffeine Pharmacokinetics & Sleep Readiness
            </h2>
            <span className="card-description" style={{ display: 'block', marginTop: 2 }}>
              Track active bloodstream caffeine half-life decay (t₁/₂ = {caffeineSettings.halfLifeHours || 5} hrs), projected caffeine at bedtime, Celsius powder scale measurements, and sleep risk.
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => setShowCaffeineSettingsModal(true)}
            >
              <Sliders size={14} style={{ marginRight: 4 }} /> Target Settings
            </button>
            <button
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.8rem', backgroundColor: '#F59E0B', borderColor: '#F59E0B', color: '#0F172A' }}
              onClick={() => {
                setIsScaleMode(false);
                setCaffFormName('Celsius Can');
                setCaffFormMg(200);
                setShowCaffeineModal(true);
              }}
            >
              <PlusCircle size={14} style={{ marginRight: 4 }} /> Log Caffeine
            </button>
          </div>
        </div>

        {/* 4 Caffeine KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 16 }}>
          {/* Card 1: Active Bloodstream Caffeine Right Now */}
          <div className="dashboard-card" style={{ marginBottom: 0, padding: '14px 16px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <BatteryCharging size={14} style={{ color: '#F59E0B' }} /> Current Active Caffeine
            </span>
            <h2 style={{ fontSize: '1.8rem', color: '#F59E0B', marginTop: 6, marginBottom: 2 }}>
              {Math.round(currentActiveCaffeine)} <span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>mg</span>
            </h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              Clearance: {clearanceTimeInfo.label}
            </span>
          </div>

          {/* Card 2: Today Total Intake vs Daily Safety Limit */}
          <div className="dashboard-card" style={{ marginBottom: 0, padding: '14px 16px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Zap size={14} style={{ color: todayCaffeineTotal > caffeineSettings.dailyCapMg ? '#EF4444' : '#0052FF' }} /> Today's Total Intake
            </span>
            <h2 style={{ fontSize: '1.8rem', color: todayCaffeineTotal > caffeineSettings.dailyCapMg ? '#EF4444' : 'var(--color-text-primary)', marginTop: 6, marginBottom: 2 }}>
              {todayCaffeineTotal} <span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>/ {caffeineSettings.dailyCapMg} mg</span>
            </h2>
            <div style={{ width: '100%', height: 6, backgroundColor: 'var(--border-color)', borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.round((todayCaffeineTotal / caffeineSettings.dailyCapMg) * 100))}%`,
                  backgroundColor: todayCaffeineTotal > caffeineSettings.dailyCapMg ? '#EF4444' : '#0052FF',
                  borderRadius: 3
                }}
              />
            </div>
          </div>

          {/* Card 3: Bedtime Caffeine Level */}
          <div className="dashboard-card" style={{ marginBottom: 0, padding: '14px 16px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Moon size={14} style={{ color: '#8B5CF6' }} /> Bedtime Level ({caffeineSettings.targetBedtime})
            </span>
            <h2 style={{ fontSize: '1.8rem', color: sleepRiskGauge.color, marginTop: 6, marginBottom: 2 }}>
              {Math.round(bedtimeActiveCaffeine)} <span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>mg</span>
            </h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              Projected in bloodstream at sleep
            </span>
          </div>

          {/* Card 4: Sleep Readiness Risk Indicator */}
          <div className="dashboard-card" style={{ marginBottom: 0, padding: '14px 16px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShieldAlert size={14} style={{ color: sleepRiskGauge.color }} /> Sleep Readiness Risk
            </span>
            <div style={{ marginTop: 8 }}>
              <span className="badge-tag" style={{ backgroundColor: sleepRiskGauge.badgeBg, color: sleepRiskGauge.color, fontWeight: 700, fontSize: '0.82rem', padding: '4px 10px' }}>
                {sleepRiskGauge.level}
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block', marginTop: 6 }}>
              {sleepRiskGauge.desc}
            </span>
          </div>
        </div>

        {/* Beverage Presets & Celsius Powder Scale Quick Bar */}
        <div style={{
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 4, marginRight: 6 }}>
            <Coffee size={15} style={{ color: '#F59E0B' }} /> Quick Log:
          </span>

          <button
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.78rem', border: '1px solid #F59E0B', color: '#F59E0B' }}
            onClick={() => handleLogCaffeine('Celsius Can', 200)}
          >
            ⚡ Celsius Can (200mg)
          </button>

          <button
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.78rem', border: '1px solid #10B981', color: '#10B981' }}
            onClick={() => {
              setIsScaleMode(true);
              setCaffFormName('Celsius Scale Packet');
              setCaffFormPowderGrams(5.6);
              setCaffFormMg(200);
              setShowCaffeineModal(true);
            }}
          >
            🧪 Celsius Scale / Powder
          </button>

          <button
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.78rem' }}
            onClick={() => handleLogCaffeine('Brewed Coffee', 95)}
          >
            ☕ Coffee (95mg)
          </button>

          <button
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.78rem' }}
            onClick={() => handleLogCaffeine('Espresso Shot', 63)}
          >
            ☕ Espresso (63mg)
          </button>

          <button
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.78rem' }}
            onClick={() => handleLogCaffeine('Pre-Workout', 250)}
          >
            🏋️ Pre-Workout (250mg)
          </button>

          <button
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.78rem' }}
            onClick={() => handleLogCaffeine('Green Tea', 45)}
          >
            🍵 Tea (45mg)
          </button>
        </div>

        {/* Dual Side-by-Side Caffeine Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
          {/* Chart 1: 24-Hour Pharmacokinetic Decay Line Chart */}
          <div className="dashboard-card" style={{ marginBottom: 0, padding: '16px' }}>
            <div className="card-header" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.95rem', margin: 0, display: 'inline-flex', alignItems: 'center' }}>
                <BatteryCharging size={16} style={{ marginRight: 6, color: '#F59E0B' }} />
                24-Hour Blood Caffeine Decay Timeline
                <MetricTooltip
                  title="Caffeine Half-Life Decay Pharmacokinetics"
                  description="Models real-time caffeine elimination from your bloodstream over time."
                  formula="C(t) = C₀ × (0.5)^(t ÷ t_half) [Default t_half = 5 hrs]"
                  position="top"
                />
              </h3>
            </div>
            <div style={{ height: 230, position: 'relative', width: '100%' }}>
              <Line data={caffeineDecayChartData} options={decayChartOptions} />
            </div>
          </div>

          {/* Chart 2: 7-Day History Trend vs 400mg Safety Cap */}
          <div className="dashboard-card" style={{ marginBottom: 0, padding: '16px' }}>
            <div className="card-header" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.95rem', margin: 0, display: 'inline-flex', alignItems: 'center' }}>
                <BarChart3 size={16} style={{ marginRight: 6, color: '#0052FF' }} />
                7-Day Intake History vs Safety Limit ({caffeineSettings.dailyCapMg}mg)
                <MetricTooltip
                  title="Daily Intake History"
                  description="Tracks total daily caffeine mg intake over the past 7 days against your safety threshold."
                  formula="Sum of caffeine entries per day vs Cap"
                  position="top"
                />
              </h3>
            </div>
            <div style={{ height: 230, position: 'relative', width: '100%' }}>
              <Bar data={caffeineHistoryTrendChartData} options={caffeineHistoryChartOptions} />
            </div>
          </div>
        </div>

        {/* Caffeine History & Log List */}
        <div className="dashboard-card" style={{ marginBottom: 0, padding: '16px' }}>
          <h4 style={{ fontSize: '0.9rem', margin: '0 0 12px 0', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={15} /> Recent Caffeine Logs
          </h4>

          {caffeineLogs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
              {caffeineLogs.slice(0, 10).map((log) => {
                const logDate = new Date(log.timestamp);
                const dateStr = logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const timeStr = logDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

                return (
                  <div key={log.id} style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-sm)'
                  }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                        {log.name}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginLeft: 8 }}>
                        {dateStr} at {timeStr} {log.powderGrams ? `• (${log.powderGrams}g scale weight)` : ''}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="badge-tag" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', fontWeight: 600, fontSize: '0.78rem' }}>
                        +{log.caffeineMg} mg
                      </span>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        onClick={() => handleDeleteCaffeineLog(log.id)}
                        title="Delete entry"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0, textAlign: 'center', padding: '12px 0' }}>
              No caffeine logged yet. Use the quick presets above to record your first drink!
            </p>
          )}
        </div>
      </div>

      {/* LOG CAFFEINE / CELSIUS SCALE MODAL */}
      {showCaffeineModal && (
        <div className="modal-overlay" onClick={() => setShowCaffeineModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  {isScaleMode ? '🧪 Celsius Packet Scale Calculator' : '⚡ Log Caffeine Intake'}
                </h3>
              </div>
              <button className="btn-close" onClick={() => setShowCaffeineModal(false)}>×</button>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Beverage / Item Name</label>
              <input
                type="text"
                className="form-input"
                value={caffFormName}
                onChange={(e) => setCaffFormName(e.target.value)}
                placeholder="e.g. Celsius Packet, Espresso, Coffee"
              />
            </div>

            {/* Mode Toggle: Fixed Mg vs Scale Powder Grams */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <button
                type="button"
                className={`filter-pill ${!isScaleMode ? 'active' : ''}`}
                onClick={() => setIsScaleMode(false)}
                style={{ flex: 1, padding: '6px', fontSize: '0.8rem' }}
              >
                Standard Caffeine (mg)
              </button>
              <button
                type="button"
                className={`filter-pill ${isScaleMode ? 'active' : ''}`}
                onClick={() => setIsScaleMode(true)}
                style={{ flex: 1, padding: '6px', fontSize: '0.8rem' }}
              >
                🧪 Scale Powder Weight (g)
              </button>
            </div>

            {isScaleMode ? (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px 14px', borderRadius: 'var(--border-radius-md)', marginBottom: 16 }}>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Scale size={14} style={{ color: '#10B981' }} /> Scale Weight (Grams):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={caffFormPowderGrams}
                    onChange={(e) => {
                      const grams = parseFloat(e.target.value) || 0;
                      setCaffFormPowderGrams(grams);
                      const calculatedMg = Math.round(grams * (200 / 5.6));
                      setCaffFormMg(calculatedMg);
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Calculated Caffeine (5.6g packet = 200mg):</span>
                  <span style={{ fontWeight: 700, color: '#10B981', fontSize: '1rem' }}>{caffFormMg} mg</span>
                </div>
              </div>
            ) : (
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Caffeine Amount (mg)</label>
                <input
                  type="number"
                  className="form-input"
                  value={caffFormMg}
                  onChange={(e) => setCaffFormMg(Number(e.target.value))}
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Consumption Time</label>
              <input
                type="time"
                className="form-input"
                value={caffFormTime}
                onChange={(e) => setCaffFormTime(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowCaffeineModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ backgroundColor: '#F59E0B', borderColor: '#F59E0B', color: '#0F172A', fontWeight: 600 }}
                onClick={() => handleLogCaffeine(caffFormName, caffFormMg, isScaleMode ? caffFormPowderGrams : null, caffFormTime)}
              >
                Confirm Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAFFEINE TARGET & BEDTIME SETTINGS MODAL */}
      {showCaffeineSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowCaffeineSettingsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">⚙️ Caffeine & Sleep Settings</h3>
              </div>
              <button className="btn-close" onClick={() => setShowCaffeineSettingsModal(false)}>×</button>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Target Bedtime (HH:MM)</label>
              <input
                type="time"
                className="form-input"
                value={caffeineSettings.targetBedtime}
                onChange={(e) => setCaffeineSettings(prev => ({ ...prev, targetBedtime: e.target.value }))}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                Used to project remaining active caffeine in your body at bedtime.
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Daily Safety Cap (mg)</label>
              <input
                type="number"
                className="form-input"
                value={caffeineSettings.dailyCapMg}
                onChange={(e) => setCaffeineSettings(prev => ({ ...prev, dailyCapMg: Number(e.target.value) }))}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                FDA recommended daily maximum is 400 mg.
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Caffeine Half-Life (Hours)</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={caffeineSettings.halfLifeHours}
                onChange={(e) => setCaffeineSettings(prev => ({ ...prev, halfLifeHours: Number(e.target.value) }))}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                Average caffeine metabolic half-life is 5 hours (ranges 3–7 hrs based on genetics).
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-primary"
                onClick={() => setShowCaffeineSettingsModal(false)}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

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
