'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { fetchCalendarEvents, getSavedCalendarId } from '@/lib/gcalendar';
import { BarChart3, TrendingUp, Award, Calendar, RefreshCw, Zap, Clock, Activity } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function AnalyticsPage() {
  const { user, session, profile, signInWithGoogle } = useAuth();
  const [supabase] = useState(() => createClient());

  const [rangeDays, setRangeDays] = useState(240); // Default to 8 Months (~240 days)
  const [combinedEvents, setCombinedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [user, session, rangeDays]);

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
      const local = JSON.parse(localStorage.getItem('nexus_logged_workouts') || localStorage.getItem('apex_logged_workouts') || '[]');
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

  const categoryNames = {
    weightlifting: '🏋️ Weightlifting',
    volleyball: '🏐 Sand Volleyball',
    grass_volleyball: '🌱 Grass Volleyball',
    basketball: '🏀 Basketball',
    running: '🏃 Running',
    flag_football: '🏈 Flag Football',
    recovery: '🧘 Recovery',
    other: '⚡ Other'
  };

  const chartData = {
    labels: ['Weightlifting', 'Sand Volleyball', 'Grass Volleyball', 'Basketball', 'Running', 'Flag Football', 'Recovery', 'Other'],
    datasets: [
      {
        label: 'Total Active Hours',
        data: [
          (categoryStats.weightlifting / 60).toFixed(1),
          (categoryStats.volleyball / 60).toFixed(1),
          (categoryStats.grass_volleyball / 60).toFixed(1),
          (categoryStats.basketball / 60).toFixed(1),
          (categoryStats.running / 60).toFixed(1),
          (categoryStats.flag_football / 60).toFixed(1),
          (categoryStats.recovery / 60).toFixed(1),
          (categoryStats.other / 60).toFixed(1)
        ],
        backgroundColor: [
          '#0052FF',
          '#F59E0B',
          '#10B981',
          '#F97316',
          '#06B6D4',
          '#EF4444',
          '#8B5CF6',
          '#64748B'
        ],
        borderRadius: 8
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y} Hours (${Math.round(context.parsed.y * 60)} Mins)`
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
            <span className="card-description">Aggregating workouts & Google Calendar events across multi-sport categories.</span>
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
      {!session?.provider_token && !localStorage.getItem('nexus_provider_token') && (
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
            {categoryNames[topCategoryKey] || '🏋️ Weightlifting'}
          </h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            {(topCategoryMins / 60).toFixed(1)} hrs logged
          </span>
        </div>
      </div>

      {/* Chart Card */}
      <div className="dashboard-card">
        <div className="card-header" style={{ marginBottom: 16 }}>
          <h3>Multi-Sport Volume Distribution (Hours)</h3>
          <span className="card-description">Total active hours accumulated in each category over the last {rangeDays} days.</span>
        </div>

        <div style={{ height: 280, position: 'relative' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
