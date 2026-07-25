'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { BarChart3, TrendingUp, Award, Calendar } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [supabase] = useState(() => createClient());

  const [rangeDays, setRangeDays] = useState(7);
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    fetchWorkouts();
  }, [user, rangeDays]);

  async function fetchWorkouts() {
    if (user) {
      const { data } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (data) setWorkouts(data);
    } else {
      const local = JSON.parse(localStorage.getItem('apex_logged_workouts') || '[]');
      setWorkouts(local);
    }
  }

  // Aggregate category durations
  const categoryStats = {
    weightlifting: 0,
    volleyball: 0,
    running: 0,
    flag_football: 0,
    recovery: 0
  };

  workouts.forEach(w => {
    const cat = (w.category || w.type || '').toLowerCase();
    const duration = Number(w.duration || 0);
    if (cat.includes('weight') || cat.includes('lifting')) categoryStats.weightlifting += duration;
    else if (cat.includes('volleyball')) categoryStats.volleyball += duration;
    else if (cat.includes('running')) categoryStats.running += duration;
    else if (cat.includes('football') || cat.includes('flag')) categoryStats.flag_football += duration;
    else if (cat.includes('recovery')) categoryStats.recovery += duration;
  });

  const chartData = {
    labels: ['Weightlifting', 'Volleyball', 'Running', 'Flag Football', 'Recovery'],
    datasets: [
      {
        label: 'Total Minutes Logged',
        data: [
          categoryStats.weightlifting,
          categoryStats.volleyball,
          categoryStats.running,
          categoryStats.flag_football,
          categoryStats.recovery
        ],
        backgroundColor: [
          '#38BDF8',
          '#F59E0B',
          '#10B981',
          '#EF4444',
          '#A855F7'
        ],
        borderRadius: 8
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    scales: {
      y: {
        ticks: { color: '#94A3B8' },
        grid: { color: '#334155' }
      },
      x: {
        ticks: { color: '#94A3B8' },
        grid: { display: false }
      }
    }
  };

  return (
    <div>
      <div className="card-header" style={{ marginBottom: 20 }}>
        <h2><BarChart3 size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} /> Athletic Analytics & Volume</h2>
        <span className="card-description">Track training volume distribution, sport duration, and consistency over time.</span>
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div className="dashboard-card" style={{ marginBottom: 0 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Logged Sessions</span>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--color-accent)', marginTop: 4 }}>{workouts.length}</h2>
        </div>
        <div className="dashboard-card" style={{ marginBottom: 0 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Active Hours</span>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--color-success)', marginTop: 4 }}>
            {(workouts.reduce((acc, curr) => acc + Number(curr.duration || 0), 0) / 60).toFixed(1)} hrs
          </h2>
        </div>
      </div>

      {/* Chart Card */}
      <div className="dashboard-card">
        <div className="card-header">
          <h3>Sport Volume Distribution</h3>
          <span className="card-description">Minutes accumulated across each athletic discipline.</span>
        </div>

        <div style={{ height: 260, position: 'relative' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
