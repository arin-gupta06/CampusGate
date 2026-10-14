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
  stats
}) {
  // Define available menu items per role
  // Requirement 7: Guard accesses ONLY Settings, Events & Alerts, Vehicles
  const allAdminItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live', label: 'Live Monitoring & Topology', icon: Video, badge: 'CCTV' },
    { id: 'vehicles', label: 'Vehicles', icon: Car, count: stats?.totalRegistered || 256 },
    { id: 'events', label: 'Events & Alerts', icon: AlertTriangle, alertCount: stats?.activeAlerts || 5 },
    { id: 'analytics', label: 'Data Analytics', icon: BarChart3 },
    { id: 'users', label: 'Users Roster', icon: Users },
    { id: 'settings', label: 'Settings & QR Code', icon: Settings },
  ];

  const guardItems = [
    { id: 'vehicles', label: 'Vehicles', icon: Car, count: stats?.totalRegistered || 256 },
    { id: 'events', label: 'Events & Alerts', icon: AlertTriangle, alertCount: stats?.activeAlerts || 5 },
    { id: 'settings', label: 'Settings & QR Code', icon: Settings },
  ];

  const menuItems = userRole === 'guard' ? guardItems : allAdminItems;

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#0a0f1d',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
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
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          boxShadow: '0 0 16px rgba(37, 99, 235, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff'
        }}>
          <ShieldCheck size={22} strokeWidth={2.4} />
        </div>
        <div>
          <h1 style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#f8fafc',
            letterSpacing: '0.4px',
            margin: 0
          }}>
            CampusGuard
          </h1>
          <span style={{
            fontSize: '11px',
            color: '#64748b',
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
          backgroundColor: '#0f172a',
          padding: '4px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
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
              padding: '5px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: userRole === 'admin' ? '#2563eb' : 'transparent',
              color: userRole === 'admin' ? '#fff' : '#64748b'
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
              padding: '5px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: userRole === 'guard' ? '#10b981' : 'transparent',
              color: userRole === 'guard' ? '#000' : '#64748b'
            }}
          >
            Guard
          </button>

          <button
            onClick={() => setUserRole('public')}
            style={{
              padding: '5px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: userRole === 'public' ? '#38bdf8' : 'transparent',
              color: userRole === 'public' ? '#000' : '#64748b'
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
                backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: isActive ? '#60a5fa' : '#94a3b8',
                border: isActive ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13px',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} style={{
                color: isActive ? '#3b82f6' : '#64748b'
              }} />
              <span style={{ flex: 1 }}>{item.label}</span>

              {item.alertCount ? (
                <span style={{
                  padding: '2px 7px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  {item.alertCount}
                </span>
              ) : null}

              {item.badge ? (
                <span style={{
                  fontSize: '10px',
                  color: '#38bdf8',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
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
                  color: '#64748b',
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
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        backgroundColor: '#0c1222'
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#64748b',
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
          backgroundColor: '#070b14',
          padding: '4px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
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
              fontWeight: 600,
              backgroundColor: appMode === 'desktop' ? '#1e293b' : 'transparent',
              color: appMode === 'desktop' ? '#38bdf8' : '#64748b'
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
              fontWeight: 600,
              backgroundColor: appMode === 'guard' ? '#1e293b' : 'transparent',
              color: appMode === 'guard' ? '#10b981' : '#64748b'
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
