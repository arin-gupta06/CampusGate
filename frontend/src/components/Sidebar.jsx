import React from 'react';
import {
  LayoutDashboard,
  Video,
  Car,
  AlertTriangle,
  BarChart3,
  Users,
  Settings,
  ShieldCheck,
  Smartphone,
  Monitor,
  Home,
  UserCheck
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  userRole, // 'admin', 'guard', 'public'
  setUserRole,
  appMode,
  setAppMode,
  stats,
  theme,
  toggleTheme
}) {
  // Define available menu items per role
  // Requirement 7: Guard accesses ONLY Settings, Events & Alerts, Vehicles
  const allAdminItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live', label: 'Live Monitoring & Topology', icon: Video, badge: 'CCTV' },
    { id: 'vehicles', label: 'Vehicles & Users Roster', icon: Users, count: stats?.totalRegistered || 256 },
    { id: 'events', label: 'Relay & Transit Logs', icon: AlertTriangle, alertCount: stats?.activeAlerts || 5 },
    { id: 'analytics', label: 'Data Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings & QR Code', icon: Settings },
  ];

  const guardItems = [
    { id: 'vehicles', label: 'Vehicles & Users Roster', icon: Users, count: stats?.totalRegistered || 256 },
    { id: 'events', label: 'Relay & Transit Logs', icon: AlertTriangle, alertCount: stats?.activeAlerts || 5 },
    { id: 'settings', label: 'Settings & QR Code', icon: Settings },
  ];

  const menuItems = userRole === 'guard' ? guardItems : allAdminItems;

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      userSelect: 'none'
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'var(--accent-primary)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-primary-text)'
        }}>
          <ShieldCheck size={22} strokeWidth={2.4} />
        </div>
        <div>
          <h1 style={{
            fontSize: '18px',
            fontWeight: 800,
            color: 'var(--text-main)',
            letterSpacing: '0.4px',
            margin: 0
          }}>
            CampusGuard
          </h1>
          <span style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            fontWeight: 600
          }}>
            {userRole === 'guard' ? 'Guard Post Access' : 'Admin Control Room'}
          </span>
        </div>
      </div>

      {/* Role Switcher Pill */}
      <div style={{ padding: '12px 14px 4px' }}>
        <div style={{
          backgroundColor: 'var(--bg-card-subtle)',
          padding: '4px',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '4px'
        }}>
          <button
            onClick={() => {
              setUserRole('admin');
              setActiveTab('dashboard');
            }}
            style={{
              padding: '6px 4px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: userRole === 'admin' ? 'var(--accent-primary)' : 'transparent',
              color: userRole === 'admin' ? 'var(--accent-primary-text)' : 'var(--text-secondary)'
            }}
          >
            Admin
          </button>

          <button
            onClick={() => {
              setUserRole('guard');
              setActiveTab('vehicles');
            }}
            style={{
              padding: '6px 4px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: userRole === 'guard' ? 'var(--accent-primary)' : 'transparent',
              color: userRole === 'guard' ? 'var(--accent-primary-text)' : 'var(--text-secondary)'
            }}
          >
            Guard
          </button>

          <button
            onClick={() => setUserRole('public')}
            style={{
              padding: '6px 4px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: userRole === 'public' ? 'var(--accent-primary)' : 'transparent',
              color: userRole === 'public' ? 'var(--accent-primary-text)' : 'var(--text-secondary)'
            }}
          >
            Public
          </button>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{
        flex: 1,
        padding: '12px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: isActive ? 'var(--bg-card-hover)' : 'transparent',
                color: isActive ? 'var(--text-main)' : 'var(--text-secondary)',
                border: isActive ? '1px solid var(--border-medium)' : '1px solid transparent',
                fontWeight: isActive ? 700 : 500,
                fontSize: '13px',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} style={{
                color: isActive ? 'var(--text-main)' : 'var(--text-muted)'
              }} />
              <span style={{ flex: 1 }}>{item.label}</span>

              {item.alertCount ? (
                <span style={{
                  padding: '2px 7px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-crimson-bg)',
                  color: 'var(--color-crimson)',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: '1px solid var(--color-crimson-border)'
                }}>
                  {item.alertCount}
                </span>
              ) : null}

              {item.badge ? (
                <span style={{
                  fontSize: '10px',
                  color: 'var(--text-main)',
                  backgroundColor: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontWeight: 700
                }}>
                  {item.badge}
                </span>
              ) : null}

              {item.count && !item.alertCount ? (
                <span style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontWeight: 600
                }}>
                  {item.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Guard Station Mobile View Quick Toggle */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface)'
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          marginBottom: '10px'
        }}>
          Display Mode
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          backgroundColor: 'var(--bg-card-subtle)',
          padding: '4px',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => setAppMode('desktop')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '6px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: appMode === 'desktop' ? 'var(--accent-primary)' : 'transparent',
              color: appMode === 'desktop' ? 'var(--accent-primary-text)' : 'var(--text-secondary)'
            }}
          >
            <Monitor size={14} />
            Desktop
          </button>
          <button
            onClick={() => setAppMode('guard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '6px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: appMode === 'guard' ? 'var(--accent-primary)' : 'transparent',
              color: appMode === 'guard' ? 'var(--accent-primary-text)' : 'var(--text-secondary)'
            }}
          >
            <Smartphone size={14} />
            Mobile
          </button>
        </div>

        {/* Live System Indicator */}
        <div style={{
          marginTop: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          color: '#10b981'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 8px #10b981'
          }} />
          <span>Handoff Engine Online</span>
        </div>
      </div>
    </aside>
  );
}
