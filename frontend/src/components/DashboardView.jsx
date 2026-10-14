import React from 'react';
import {
  Car,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Maximize2,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Camera,
  Plus,
  Sparkles
} from 'lucide-react';

export default function DashboardView({
  stats,
  cameras = [],
  recentEntries = [],
  onSelectEntry,
  onNavigateTab,
  onAddCameraClick,
  onLoadDemoCameras
}) {
  const hasCameras = cameras && cameras.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Top Stat Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '18px'
      }}>
        {/* Card 1: Total Vehicles */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3b82f6'
          }}>
            <Car size={24} />
          </div>
          <div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>
              {stats?.totalToday || 124}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', fontWeight: 500 }}>
              Total Vehicles Today
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#38bdf8', marginTop: '4px', fontWeight: 600 }}>
              <TrendingUp size={13} />
              <span>↑ 12%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Verified Vehicles */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981'
          }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>
              {stats?.verifiedToday || 98}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', fontWeight: 500 }}>
              Verified Vehicles
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#10b981', marginTop: '4px', fontWeight: 600 }}>
              <TrendingUp size={13} />
              <span>↑ 8%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Unknown Vehicles */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f59e0b'
          }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>
              {stats?.unknownToday || 12}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', fontWeight: 500 }}>
              Unknown Vehicles
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#f59e0b', marginTop: '4px', fontWeight: 600 }}>
              <TrendingUp size={13} />
              <span>↑ 3%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Active Alerts */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444'
          }}>
            <Bell size={24} />
          </div>
          <div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>
              {stats?.activeAlerts || 5}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', fontWeight: 500 }}>
              Active Alerts
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: 600 }}>
              <TrendingDown size={13} />
              <span>↓ 2%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content Split: Live Camera Feeds (Left) & Recent Entries (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.7fr 1fr',
        gap: '24px'
      }}>
        {/* Left: Live Camera Feeds Grid or Empty State */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          padding: '22px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Live Camera Feeds
              </h3>
              {hasCameras && (
                <span style={{
                  fontSize: '11px',
                  color: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '99px',
                  fontWeight: 600
                }}>
                  {cameras.length} Active Nodes
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {hasCameras && (
                <button
                  onClick={() => onNavigateTab('live')}
                  style={{
                    background: 'none',
                    color: '#38bdf8',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <span>Live Monitoring & Topology</span>
                  <ChevronRight size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Conditional Rendering: Empty State vs Video Matrix */}
          {!hasCameras ? (
            <div style={{
              backgroundColor: '#070b14',
              borderRadius: '14px',
              border: '2px dashed rgba(255, 255, 255, 0.1)',
              padding: '48px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '320px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
                marginBottom: '16px'
              }}>
                <Camera size={26} />
              </div>

              <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', margin: '0 0 6px' }}>
                No camera feed configured
              </h4>
              <p style={{
                fontSize: '13px',
                color: '#94a3b8',
                maxWidth: '400px',
                margin: '0 auto 22px',
                lineHeight: 1.5
              }}>
                No camera feeds are currently active. Click below to enter RTSP details and configure your first camera node.
              </p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={onAddCameraClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
                  }}
                >
                  <Plus size={16} />
                  <span>Add Camera Details</span>
                </button>

                {onLoadDemoCameras && (
                  <button
                    onClick={onLoadDemoCameras}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#1e293b',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '10px',
                      padding: '10px 16px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    <Sparkles size={14} />
                    <span>Load Demo Cameras</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Configured Camera Grid */
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px'
            }}>
              {cameras.slice(0, 4).map((cam, idx) => (
                <div
                  key={cam.id || idx}
                  style={{
                    backgroundColor: '#070b14',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    position: 'relative',
                    aspectRatio: '16/10',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Top Overlay */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    right: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 2
                  }}>
                    <div style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.75)',
                      backdropFilter: 'blur(6px)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#f8fafc',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      {cam.name}
                    </div>

                    <div style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.85)',
                      padding: '3px 7px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#fff',
                      letterSpacing: '0.4px'
                    }}>
                      <span style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        backgroundColor: '#fff'
                      }} />
                      LIVE
                    </div>
                  </div>

                  {/* High-Tech CCTV Sensor Display */}
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#050811',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `
                        radial-gradient(ellipse at center, rgba(30, 41, 59, 0.4) 0%, rgba(5, 8, 17, 0.95) 100%),
                        linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
                      `,
                      backgroundSize: '100% 100%, 25px 25px, 25px 25px'
                    }} />

                    {/* Sensor Target Reticle */}
                    <div style={{
                      position: 'relative',
                      zIndex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        border: '1px dashed rgba(59, 130, 246, 0.35)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}>
                        <div style={{ width: '4px', height: '4px', backgroundColor: '#38bdf8', borderRadius: '50%' }} />
                      </div>
                      <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        AI VISION READY
                      </span>
                    </div>

                    {/* Virtual Line Overlay */}
                    <div style={{
                      position: 'absolute',
                      bottom: '26%',
                      left: '8%',
                      right: '8%',
                      height: '2px',
                      backgroundColor: '#10b981',
                      boxShadow: '0 0 8px #10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      zIndex: 2
                    }}>
                      <span style={{
                        backgroundColor: '#10b981',
                        color: '#000',
                        fontSize: '8px',
                        fontWeight: 800,
                        padding: '1px 4px',
                        borderRadius: '2px',
                        transform: 'translateY(-100%)'
                      }}>
                        LINE CROSSING ACTIVE
                      </span>
                    </div>

                    {/* Bottom CCTV Timestamp */}
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '10px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: 'rgba(255, 255, 255, 0.75)',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      zIndex: 2
                    }}>
                      10:42:{12 + idx}
                    </div>

                    <div
                      onClick={() => onNavigateTab('live')}
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '10px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        cursor: 'pointer',
                        zIndex: 2
                      }}
                    >
                      <Maximize2 size={14} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent Entries Live Feed */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          padding: '22px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Recent Entries
            </h3>
            <button
              onClick={() => onNavigateTab('events')}
              style={{
                background: 'none',
                color: '#38bdf8',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              View All
            </button>
          </div>

          {/* List of Entries */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            flex: 1,
            overflowY: 'auto',
            maxHeight: '440px'
          }}>
            {recentEntries.map((entry) => {
              const isVerified = entry.entry_status === 'AUTHORIZED';
              const isAlert = entry.entry_status === 'FLAGGED_UNLISTED' || entry.entry_status === 'BLACKLISTED';

              return (
                <div
                  key={entry.id}
                  onClick={() => onSelectEntry(entry)}
                  style={{
                    backgroundColor: '#131d33',
                    borderRadius: '10px',
                    padding: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#182542';
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#131d33';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '42px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: '#0a0f1d'
                  }}>
                    <img
                      src={entry.image_url}
                      alt={entry.plate_number}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '2px'
                    }}>
                      <span className="plate-number" style={{
                        fontSize: '13px',
                        color: '#f8fafc',
                        letterSpacing: '1px'
                      }}>
                        {entry.plate_number}
                      </span>

                      {isVerified ? (
                        <span style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '99px',
                          border: '1px solid rgba(16, 185, 129, 0.3)'
                        }}>
                          Verified
                        </span>
                      ) : isAlert ? (
                        <span style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          color: '#ef4444',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '99px',
                          border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                          Unknown
                        </span>
                      ) : (
                        <span style={{
                          backgroundColor: 'rgba(245, 158, 11, 0.15)',
                          color: '#f59e0b',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '99px',
                          border: '1px solid rgba(245, 158, 11, 0.3)'
                        }}>
                          Suspicious
                        </span>
                      )}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      color: '#94a3b8'
                    }}>
                      <span>{entry.camera_name || 'Gate 1'}</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>
                        {new Date(entry.first_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
