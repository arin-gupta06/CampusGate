import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import {
  Search,
  Sparkles,
  Shield,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  ShieldCheck,
  UserCheck,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';

export default function Header({
  onSearch,
  onTriggerSimulation,
  wsStatus,
  currentUser,
  onOpenAuthModal,
  onSignOut,
  theme,
  toggleTheme
}) {
  const [currentTime, setCurrentTime] = useState('');
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = days[now.getDay()];
      const date = now.getDate();
      const month = months[now.getMonth()];
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setCurrentTime(`${day}, ${date} ${month} • ${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchValue);
  };

  const role = currentUser?.role || 'user';
  const isSuper = currentUser?.is_superadmin || ['24cd10ar15@mitsgwl.ac.in', 'vivekchaurasiya943@gmail.com', 'sarveshsingh8462@gmail.com', 'arin.gupta@mits.ac.in'].includes(currentUser?.email?.toLowerCase());

  const roleBadgeMeta = isSuper
    ? { label: '👑 Superadmin', color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)', border: 'rgba(217, 119, 6, 0.4)', icon: Shield }
    : ({
        admin: { label: 'Security Admin', color: 'var(--color-crimson)', bg: 'var(--color-crimson-bg)', border: 'var(--color-crimson-border)', icon: Shield },
        guard: { label: 'Gate Officer', color: 'var(--color-amber)', bg: 'var(--color-amber-bg)', border: 'var(--color-amber-border)', icon: ShieldCheck },
        user: { label: 'Campus Resident', color: 'var(--color-emerald)', bg: 'var(--color-emerald-bg)', border: 'var(--color-emerald-border)', icon: UserCheck }
      }[role] || { label: 'Member', color: 'var(--text-secondary)', bg: 'var(--bg-card-subtle)', border: 'var(--border-subtle)', icon: User });

  const RoleIcon = roleBadgeMeta.icon;

  return (
    <header style={{
      height: '74px',
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '20px',
      position: 'sticky',
      top: 0,
      zIndex: 30
    }}>
      {/* Brand & Live Operational Clock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
              CampusGate AI
            </span>
            <span style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-primary-text)',
              letterSpacing: '0.4px'
            }}>
              v2.4
            </span>
          </div>
          <p style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            margin: '2px 0 0',
            fontFamily: 'var(--font-mono)',
            fontWeight: 500
          }}>
            {currentTime}
          </p>
        </div>
      </div>

      {/* Global Search Bar */}
      <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '320px' }}>
        <Search size={14} style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-muted)'
        }} />
        <input
          type="text"
          placeholder="Search registered vehicle, pass, resident..."
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            if (onSearch) onSearch(e.target.value);
          }}
          style={{
            width: '100%',
            padding: '8px 12px 8px 34px',
            backgroundColor: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            color: 'var(--text-main)',
            fontSize: '12px',
            outline: 'none',
            fontFamily: 'inherit'
          }}
        />
      </form>

      {/* Right Actions: Authenticated Profile & Role Extras Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Real-time Ingress Simulation Trigger */}
        <button
          onClick={onTriggerSimulation}
          title="Simulate Vehicle Arrival (Auto OCR Latch)"
          style={{
            padding: '8px 12px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-card-hover)',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-main)',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <Sparkles size={14} color="#d97706" />
          <span>Simulate Arrival</span>
        </button>

        {/* WebSocket Stream Heartbeat Status */}
        <div style={{
          padding: '6px 10px',
          borderRadius: '8px',
          backgroundColor: wsStatus === 'CONNECTED' ? 'var(--color-emerald-bg)' : 'var(--color-crimson-bg)',
          border: `1px solid ${wsStatus === 'CONNECTED' ? 'var(--color-emerald-border)' : 'var(--color-crimson-border)'}`,
          color: wsStatus === 'CONNECTED' ? 'var(--color-emerald)' : 'var(--color-crimson)',
          fontSize: '11px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          {wsStatus === 'CONNECTED' ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            {wsStatus === 'CONNECTED' ? 'Live Stream' : 'Offline'}
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* User Account / OAuth Switcher Pill */}
        <button
          onClick={onOpenAuthModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '5px 12px 5px 6px',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <Avatar user={currentUser} size={28} borderRadius={7} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
              {currentUser?.name || 'Arin Gupta'}
            </div>
            <div style={{
              fontSize: '10px',
              fontWeight: 800,
              color: roleBadgeMeta.color,
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              <RoleIcon size={10} />
              {roleBadgeMeta.label}
            </div>
          </div>
          <ChevronDown size={14} style={{ color: 'var(--text-muted)', marginLeft: '2px' }} />
        </button>

        {/* Sign Out Button */}
        {onSignOut && (
          <button
            onClick={onSignOut}
            title="Sign Out of CampusGate"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
