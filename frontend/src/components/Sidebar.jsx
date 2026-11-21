import React, { useState } from 'react';
import {
  Video,
  Car,
  ShieldCheck,
  ShieldAlert,
  Home,
  QrCode,
  FilePlus,
  Users,
  BarChart3,
  Settings,
  Shield,
  Sparkles,
  Activity,
  Code2,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import Avatar from './Avatar';

export default function Sidebar({
  activeTab,
  setActiveTab,
  currentUser,
  stats,
  onSignOut,
  isCollapsed: propIsCollapsed,
  onToggleCollapse: propOnToggleCollapse
}) {
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    return localStorage.getItem('campusgate_sidebar_collapsed') === 'true';
  });

  const isControlled = typeof propIsCollapsed === 'boolean';
  const isCollapsed = isControlled ? propIsCollapsed : internalCollapsed;

  const handleToggle = () => {
    const next = !isCollapsed;
    if (!isControlled) {
      setInternalCollapsed(next);
      localStorage.setItem('campusgate_sidebar_collapsed', String(next));
    }
    if (propOnToggleCollapse) {
      propOnToggleCollapse(next);
    }
  };

  const role = currentUser?.role || 'user'; // 'admin', 'guard', 'user'

  // =========================================================================
  // 1. PRIMARY NAVIGATION (Developer Directory strictly for Admins/Superadmins)
  // =========================================================================
  const universalDeveloper = { id: 'developer', label: 'Developer Directory', icon: Code2 };

  // =========================================================================
  // 2. MEMBER / PERSONAL PASS ITEMS
  // =========================================================================
  const personalPassItems = [
    { id: 'profile', label: 'Digital Gate Pass (QR)', icon: QrCode },
    { id: 'apply_pass', label: 'Apply for Vehicle Pass', icon: FilePlus }
  ];

  // =========================================================================
  // 3. GUARD OPERATIONS (Gate Security)
  // =========================================================================
  const guardItems = [
    { id: 'guard_console', label: 'Gate Ingress Console', icon: ShieldCheck, badge: 'LIVE' },
    { id: 'events', label: 'Security & Visitor Desk', icon: ShieldAlert, alertCount: stats?.activeAlerts || 0 },
    { id: 'overview', label: 'Campus Ingress Overview', icon: Activity }
  ];

  // =========================================================================
  // 4. ADMIN SYSTEM GOVERNANCE (Administrative)
  // =========================================================================
  const adminItems = [
    { id: 'overview', label: 'Campus Overview & Ingress', icon: Activity },
    { id: 'guard_console', label: 'Gate Ingress Console', icon: ShieldCheck, badge: 'LIVE' },
    { id: 'live', label: 'CCTV Matrix & Nodes', icon: Video, badge: 'CCTV' },
    { id: 'roster', label: 'Campus Fleet & Roster', icon: Users, count: stats?.totalRegistered || 256 },
    { id: 'events', label: 'Security & Alerts', icon: ShieldAlert, alertCount: stats?.activeAlerts || 0 },
    { id: 'analytics', label: 'Campus Flow Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Infrastructure & Nodes', icon: Settings }
  ];

  const isSuper = currentUser?.is_superadmin || ['24cd10ar15@mitsgwl.ac.in', 'vivekchaurasiya943@gmail.com', 'sarveshsingh8462@gmail.com', 'arin.gupta@mits.ac.in'].includes(currentUser?.email?.toLowerCase());

  const roleBadgeMeta = isSuper
    ? { label: '👑 Superadmin', color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)', border: 'rgba(217, 119, 6, 0.4)' }
    : ({
        admin: { label: 'Admin Access', color: 'var(--color-crimson)', bg: 'var(--color-crimson-bg)', border: 'var(--color-crimson-border)' },
        guard: { label: 'Gate Officer', color: 'var(--color-amber)', bg: 'var(--color-amber-bg)', border: 'var(--color-amber-border)' },
        user: { label: 'Campus Resident', color: 'var(--color-emerald)', bg: 'var(--color-emerald-bg)', border: 'var(--color-emerald-border)' }
      }[role] || { label: 'Member', color: 'var(--text-secondary)', bg: 'var(--bg-card-subtle)', border: 'var(--border-subtle)' });

  const renderNavButton = (item) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    if (isCollapsed) {
      return (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          title={`${item.label}${item.alertCount ? ` (${item.alertCount} alerts)` : ''}`}
          style={{
            width: '44px',
            height: '44px',
            margin: '0 auto',
            borderRadius: '10px',
            backgroundColor: isActive ? 'var(--bg-card-hover)' : 'transparent',
            color: isActive ? 'var(--text-main)' : 'var(--text-secondary)',
            border: isActive ? '1px solid var(--border-medium)' : '1px solid transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.15s ease'
          }}
        >
          <Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} style={{
            color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)'
          }} />
          {item.alertCount ? (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-crimson)',
              boxShadow: '0 0 6px var(--color-crimson)'
            }} />
          ) : null}
          {item.badge ? (
            <span style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-emerald)'
            }} />
          ) : null}
        </button>
      );
    }

    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '9px 12px',
          borderRadius: '10px',
          backgroundColor: isActive ? 'var(--bg-card-hover)' : 'transparent',
          color: isActive ? 'var(--text-main)' : 'var(--text-secondary)',
          border: isActive ? '1px solid var(--border-medium)' : '1px solid transparent',
          fontWeight: isActive ? 700 : 500,
          fontSize: '13px',
          textAlign: 'left',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} style={{
          color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)'
        }} />
        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.label}
        </span>
        {item.count ? (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
            {item.count}
          </span>
        ) : null}
        {item.alertCount ? (
          <span style={{
            padding: '1px 6px',
            borderRadius: '10px',
            backgroundColor: 'var(--color-crimson-bg)',
            color: 'var(--color-crimson)',
            fontSize: '10px',
            fontWeight: 800,
            border: '1px solid var(--color-crimson-border)'
          }}>
            {item.alertCount}
          </span>
        ) : null}
        {item.badge ? (
          <span style={{
            fontSize: '9px',
            color: 'var(--color-emerald)',
            backgroundColor: 'var(--color-emerald-bg)',
            border: '1px solid var(--color-emerald-border)',
            padding: '1px 5px',
            borderRadius: '4px',
            fontWeight: 800
          }}>
            {item.badge}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <aside style={{
      width: isCollapsed ? '72px' : '260px',
      minWidth: isCollapsed ? '72px' : '260px',
      backgroundColor: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      userSelect: 'none',
      transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
      overflowX: 'hidden'
    }}>
      {/* Brand Header & Collapse Toggle */}
      <div style={{
        padding: isCollapsed ? '18px 12px' : '18px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        gap: '10px',
        minHeight: '74px'
      }}>
        {isCollapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('home')}
              title="CampusGate Home (Click to navigate)"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'var(--accent-primary)',
                color: 'var(--accent-primary-text)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <ShieldCheck size={22} strokeWidth={2.4} />
            </button>
            <button
              onClick={handleToggle}
              title="Expand Sidebar"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <PanelLeftOpen size={16} />
            </button>
          </div>
        ) : (
          <>
            <div
              onClick={() => setActiveTab('home')}
              title="CampusGate Home (Click to navigate)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                minWidth: 0,
                flex: 1,
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--accent-primary)',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary-text)',
                flexShrink: 0
              }}>
                <ShieldCheck size={20} strokeWidth={2.4} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h1 style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  letterSpacing: '0.2px',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  CampusGate
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: roleBadgeMeta.bg,
                    border: `1px solid ${roleBadgeMeta.border}`,
                    color: roleBadgeMeta.color,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    whiteSpace: 'nowrap'
                  }}>
                    {roleBadgeMeta.label}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleToggle}
              title="Collapse Sidebar"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <PanelLeftClose size={16} />
            </button>
          </>
        )}
      </div>

      {/* Navigation Sections */}
      <nav style={{
        flex: 1,
        padding: isCollapsed ? '12px 6px' : '14px 12px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: isCollapsed ? '12px' : '16px'
      }}>
        {/* =========================================================
            1. DEVELOPER DIRECTORY (Strictly for Admins / Developers)
           ========================================================= */}
        {(isSuper || role === 'admin') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {renderNavButton(universalDeveloper)}
          </div>
        )}

        {/* =========================================================
            2. ROLE SPECIFIC OPERATIONS
           ========================================================= */}
        {role === 'admin' && (
          <>
            <div>
              {!isCollapsed && (
                <div style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: 'var(--color-crimson)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  padding: '2px 12px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>⚡ Admin Governance</span>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {adminItems.map(renderNavButton)}
              </div>
            </div>

            <div>
              {!isCollapsed && (
                <div style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  padding: '4px 12px 6px'
                }}>
                  Personal Pass
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {personalPassItems.map(renderNavButton)}
              </div>
            </div>
          </>
        )}

        {role === 'guard' && (
          <>
            <div>
              {!isCollapsed && (
                <div style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: 'var(--color-amber)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  padding: '2px 12px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>🛡️ Gate Operations</span>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {guardItems.map(renderNavButton)}
              </div>
            </div>

            <div>
              {!isCollapsed && (
                <div style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  padding: '4px 12px 6px'
                }}>
                  Personal Pass
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {personalPassItems.map(renderNavButton)}
              </div>
            </div>
          </>
        )}

        {role === 'user' && (
          <div>
            {!isCollapsed && (
              <div style={{
                fontSize: '10px',
                fontWeight: 800,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                padding: '2px 12px 6px'
              }}>
                My Pass & Access
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {personalPassItems.map(renderNavButton)}
            </div>
          </div>
        )}
      </nav>

      {/* User Footer Profile Card */}
      <div style={{
        padding: isCollapsed ? '12px 6px' : '14px 14px 16px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isCollapsed ? 'center' : 'stretch',
        gap: '10px',
        backgroundColor: 'var(--bg-card-subtle)'
      }}>
        {isCollapsed ? (
          <button
            onClick={() => setActiveTab('profile')}
            title={`${currentUser?.name || 'Campus Member'} (${roleBadgeMeta.label}) - Click to View Digital Pass`}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Avatar user={currentUser} size={36} borderRadius={10} />
          </button>
        ) : (
          <>
            <div
              onClick={() => setActiveTab('profile')}
              title="Click to View Digital Pass & Ingress Logs"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, cursor: 'pointer' }}
            >
              <Avatar user={currentUser} size={34} borderRadius={10} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {currentUser?.name || 'Authenticated Member'}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {currentUser?.email || 'user@mits.ac.in'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('profile')}
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <QrCode size={13} color="var(--accent-primary)" />
              <span>Digital Gate Pass & Logs</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
