'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { ACHIEVEMENTS, evaluateAchievements } from '@/lib/trophies-catalog';
import { Trophy, Award, Lock, Sparkles } from 'lucide-react';

export default function TrophiesPage() {
  const { user } = useAuth();
  const [supabase] = useState(() => createClient());
  const [workouts, setWorkouts] = useState([]);
  const [unlockedState, setUnlockedState] = useState({});

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    let logs = [];
    if (user) {
      const { data } = await supabase.from('workout_logs').select('*').eq('user_id', user.id);
      if (data) logs = data;
    } else {
      logs = JSON.parse(localStorage.getItem('apex_logged_workouts') || '[]');
    }

    setWorkouts(logs);
    setUnlockedState(evaluateAchievements(logs));
  }

  return (
    <div>
      <div className="card-header" style={{ marginBottom: 20 }}>
        <h2><Trophy size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: '#FFD700' }} /> Gamification Trophy Room</h2>
        <span className="card-description">Unlock metallic badges as you hit major training volume and consistency milestones.</span>
      </div>

      <div className="trophy-grid">
        {ACHIEVEMENTS.map(ach => {
          const evalObj = unlockedState[ach.id] || {};
          const highest = evalObj.highestTierUnlocked;
          const next = evalObj.nextTier;
          const currentVal = evalObj.currentValue || 0;

          const levelClass = highest ? highest.level : 'none';
          const maxVal = next ? next.threshold : (highest ? highest.threshold : 100);
          const percent = Math.min(100, Math.round((currentVal / maxVal) * 100));

          return (
            <div key={ach.id} className="trophy-card">
              <div className="trophy-icon">{ach.icon}</div>
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{ach.title}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>{ach.description}</p>
              </div>

              {highest ? (
                <div className={`badge-tag ${highest.level}`}>
                  {highest.name}
                </div>
              ) : (
                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  <Lock size={12} style={{ display: 'inline', marginRight: 4 }} /> Locked (Progress: {currentVal}/{maxVal})
                </div>
              )}

              {/* Progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                  <span>{currentVal} Mins / Workouts</span>
                  <span>{next ? `Next: ${next.name}` : 'MAX LEVEL'}</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${percent}%` }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
