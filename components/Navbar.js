'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dumbbell, Calendar, Bot, Trophy, BarChart3, Settings } from 'lucide-react';
import { useAuth } from './AuthProvider';

export function Header() {
  const { user, signInWithGoogle, signOut } = useAuth();

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="brand">
          <span className="brand-title">APEX</span>
          <span className="brand-subtitle">SUMMER '26 ATHLETICS</span>
        </div>
        <div>
          {user ? (
            <div className="status-badge connected" title={user.email} onClick={signOut} style={{ cursor: 'pointer' }}>
              <span className="status-dot"></span>
              <span>{user.email?.split('@')[0]}</span>
            </div>
          ) : (
            <button className="status-badge disconnected" onClick={signInWithGoogle} style={{ cursor: 'pointer' }}>
              <span className="status-dot"></span>
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Today', icon: Calendar },
    { href: '/workouts', label: 'Workouts', icon: Dumbbell },
    { href: '/ai', label: 'AI Coach', icon: Bot },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/trophies', label: 'Trophies', icon: Trophy },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="app-nav">
      <div className="nav-container">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
