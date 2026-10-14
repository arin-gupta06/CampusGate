import React, { useState, useEffect } from 'react';
import { Search, Bell, Sparkles, ChevronDown, Shield, Wifi, WifiOff, User } from 'lucide-react';

export default function Header({
  onSearch,
  onTriggerSimulation,
  wsStatus,
  userRole,
  setUserRole
}) {
  const [currentTime, setCurrentTime] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = days[now.getDay()];
      const date = now.getDate();
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formatted = `${day}, ${date} ${month} ${year} ${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
      setCurrentTime(formatted);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchValue);
  };

  return (
    <header style={{
      height: '74px',
      backgroundColor: '#0a0f1d',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '0 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 30
    }}>
      {/* Title & Greeting */}
      <div>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#f8fafc',
          letterSpacing: '-0.2px',
          margin: 0
        }}>
          {userRole === 'guard' ? 'Good Morning, Gate Guard' : 'Good Morning, Admin'}
        </h2>
        <p style={{
          fontSize: '12px',
          color: '#64748b',
          marginTop: '2px',
          fontWeight: 500
        }}>
          {userRole === 'guard' ? 'Gate 1 & Gate 2 Vehicle Ingress Station' : 'Live monitoring of campus vehicles & gate barriers'}
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} style={{
        position: 'relative',
        width: '360px'
      }}>
        <Search size={16} style={{
          position: 'absolute',
          left: '14px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#64748b'
        }} />
        <input
          type="text"
          placeholder="Search vehicle, person, camera..."
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            if (onSearch) onSearch(e.target.value);
          }}
          style={{
            width: '100%',
            height: '40px',
            backgroundColor: '#111827',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            borderRadius: '10px',
            padding: '0 16px 0 40px',
            fontSize: '13px',
            color: '#f1f5f9',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.09)'}
        />
      </form>

      {/* Right Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        {/* Simulate Live Event Button */}
        <button
          onClick={onTriggerSimulation}
          title="Simulate a vehicle passing through Gate 1 with OCR detection"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            color: '#60a5fa',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Sparkles size={15} />
          <span>Simulate Entry</span>
        </button>

        {/* Live Status + Clock */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#0f172a',
          padding: '6px 14px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              animation: 'pulse-dot 2s infinite'
            }} />
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#ef4444',
              letterSpacing: '0.6px'
            }}>
              LIVE
            </span>
          </div>

          <span style={{
            color: 'rgba(255, 255, 255, 0.2)',
            fontSize: '12px'
          }}>|</span>

          <span style={{
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            color: '#94a3b8',
            fontWeight: 500
          }}>
            {currentTime}
          </span>
        </div>

        {/* WebSocket Connection Status */}
        <div title={wsStatus === 'CONNECTED' ? 'WebSocket Live Stream Online' : 'WebSocket Reconnecting...'} style={{
          display: 'flex',
          alignItems: 'center',
          color: wsStatus === 'CONNECTED' ? '#10b981' : '#f59e0b',
          fontSize: '12px'
        }}>
          {wsStatus === 'CONNECTED' ? <Wifi size={17} /> : <WifiOff size={17} />}
        </div>

        {/* User Profile Avatar & Role Menu */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              paddingLeft: '6px',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#1e293b',
              border: `2px solid ${userRole === 'admin' ? '#3b82f6' : userRole === 'guard' ? '#10b981' : '#38bdf8'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
              color: '#f8fafc'
            }}>
              {userRole === 'guard' ? 'GD' : 'AG'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', textTransform: 'capitalize' }}>
                {userRole}
              </span>
              <ChevronDown size={14} color="#94a3b8" />
            </div>
          </div>

          {showRoleMenu && (
            <div style={{
              position: 'absolute',
              top: '46px',
              right: 0,
              width: '180px',
              backgroundColor: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '6px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <button
                onClick={() => {
                  setUserRole('admin');
                  setShowRoleMenu(false);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: userRole === 'admin' ? '#1e293b' : 'transparent',
                  color: userRole === 'admin' ? '#60a5fa' : '#cbd5e1',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                Switch to Admin
              </button>
              <button
                onClick={() => {
                  setUserRole('guard');
                  setShowRoleMenu(false);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: userRole === 'guard' ? '#1e293b' : 'transparent',
                  color: userRole === 'guard' ? '#10b981' : '#cbd5e1',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                Switch to Guard
              </button>
              <button
                onClick={() => {
                  setUserRole('public');
                  setShowRoleMenu(false);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: userRole === 'public' ? '#1e293b' : 'transparent',
                  color: userRole === 'public' ? '#38bdf8' : '#cbd5e1',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                Switch to Public Portal
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
