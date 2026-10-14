import React, { useState } from 'react';
import {
  Video,
  Map,
  Plus,
  Maximize2,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Navigation,
  ArrowRight,
  GitBranch,
  ShieldCheck,
  Activity,
  Trash2,
  Layers,
  Sparkles
} from 'lucide-react';

export default function LiveMonitoringView({
  cameras = [],
  onAddCameraClick,
  onDeleteCamera,
  onLoadDemoCameras,
  onSelectVehicle
}) {
  const [subView, setSubView] = useState('ALL'); // 'ALL', 'CAMERAS', 'TOPOLOGY'
  const hasCameras = cameras && cameras.length > 0;

  const [simulatedHandoff, setSimulatedHandoff] = useState([
    {
      id: 'ho-881',
      sourceCam: 'Gate 1 - Main Entry',
      destCam: 'Campus Road',
      plate: 'MP07AB1234',
      status: 'RECONCILED',
      timeDelta: '42s (Plausible)',
      confidence: 0.96,
      reason: 'Plate matched & travel time within 30-90s window'
    },
    {
      id: 'ho-882',
      sourceCam: 'Gate 2 - Side Entry',
      destCam: 'Parking Area',
      plate: 'MP07GH3456',
      status: 'PENDING_MATCH',
      timeDelta: '28s',
      confidence: 0.68,
      reason: 'Plate partially obscured at Gate 2; waiting for Parking Cam 1'
    }
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            Live Monitoring & Camera Topology Hub
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Multi-camera RTSP surveillance, virtual line-crossing gates, and geometric handoff reconciliation
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Sub-view toggle */}
          <div style={{
            display: 'flex',
            backgroundColor: '#0f172a',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              onClick={() => setSubView('ALL')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: subView === 'ALL' ? '#1e293b' : 'transparent',
                color: subView === 'ALL' ? '#38bdf8' : '#94a3b8'
              }}
            >
              Unified Control
            </button>
            <button
              onClick={() => setSubView('CAMERAS')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: subView === 'CAMERAS' ? '#1e293b' : 'transparent',
                color: subView === 'CAMERAS' ? '#38bdf8' : '#94a3b8'
              }}
            >
              Cameras Matrix
            </button>
            <button
              onClick={() => setSubView('TOPOLOGY')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: subView === 'TOPOLOGY' ? '#1e293b' : 'transparent',
                color: subView === 'TOPOLOGY' ? '#38bdf8' : '#94a3b8'
              }}
            >
              Topology & Tracking
            </button>
          </div>

          <button
            onClick={onAddCameraClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#2563eb',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
            }}
          >
            <Plus size={15} />
            <span>Add Camera</span>
          </button>
        </div>
      </div>

      {/* Part 1: Live Camera Streams Matrix or Empty State */}
      {(subView === 'ALL' || subView === 'CAMERAS') && (
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
              <Video size={18} color="#3b82f6" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Active RTSP Surveillance Feeds ({cameras.length})
              </h3>
            </div>
            {hasCameras ? (
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
                ● All Feeds Healthy (Bitrate: 4.2 Mbps Avg)
              </span>
            ) : (
              <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 600 }}>
                ○ No Cameras Configured
              </span>
            )}
          </div>

          {/* If NO cameras are configured, display the required clean empty state */}
          {!hasCameras ? (
            <div style={{
              backgroundColor: '#070b14',
              borderRadius: '14px',
              border: '2px dashed rgba(255, 255, 255, 0.1)',
              padding: '50px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '340px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
                marginBottom: '16px'
              }}>
                <Camera size={30} />
              </div>

              <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: '0 0 6px' }}>
                No camera feed configured
              </h4>
              <p style={{
                fontSize: '13px',
                color: '#94a3b8',
                maxWidth: '440px',
                margin: '0 auto 24px',
                lineHeight: 1.5
              }}>
                There are currently no active RTSP surveillance camera feeds or camera nodes configured in the system. Add your campus gate entry, corridor, or parking cameras to start automated plate detection and cross-camera tracking.
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={onAddCameraClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '11px 22px',
                    fontSize: '13px',
                    fontWeight: 600,
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
                  }}
                >
                  <Plus size={16} />
                  <span>Add Camera for Configuration</span>
                </button>

                {onLoadDemoCameras && (
                  <button
                    onClick={onLoadDemoCameras}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#1e293b',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '10px',
                      padding: '11px 18px',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                  >
                    <Sparkles size={15} />
                    <span>Quick Load Demo Cameras</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Configured Camera Grid with Realistic High-Tech CCTV Monitor Display */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px'
            }}>
              {cameras.map((cam, idx) => (
                <div
                  key={cam.id || idx}
                  style={{
                    backgroundColor: '#070b14',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Camera Top Info Bar */}
                  <div style={{
                    padding: '10px 14px',
                    backgroundColor: '#0b1120',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        boxShadow: '0 0 6px #10b981'
                      }} />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>{cam.name}</span>
                      <span style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {cam.role}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        {cam.fps || 30} FPS • {cam.resolution || '1080p'}
                      </span>
                      <button style={{ background: 'none', color: '#94a3b8', padding: '2px' }} title="Calibrate Line Crossing">
                        <Sliders size={13} />
                      </button>
                      <button style={{ background: 'none', color: '#94a3b8', padding: '2px' }} title="Restart Stream">
                        <RefreshCw size={13} />
                      </button>
                      {onDeleteCamera && (
                        <button
                          onClick={() => onDeleteCamera(cam.id)}
                          style={{ background: 'none', color: '#ef4444', padding: '2px' }}
                          title="Remove Camera Node"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* CCTV Monitor Viewport */}
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16/9',
                    backgroundColor: '#050811',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {/* Simulated High-Tech CCTV Viewport Background */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `
                        radial-gradient(ellipse at center, rgba(30, 41, 59, 0.4) 0%, rgba(5, 8, 17, 0.95) 100%),
                        linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
                      `,
                      backgroundSize: '100% 100%, 30px 30px, 30px 30px'
                    }} />

                    {/* Camera Center Crosshair & Live Simulation Graphics */}
                    <div style={{
                      position: 'relative',
                      zIndex: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '70px',
                        height: '70px',
                        border: '1px dashed rgba(59, 130, 246, 0.4)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}>
                        <div style={{ width: '6px', height: '6px', backgroundColor: '#38bdf8', borderRadius: '50%' }} />
                        <div style={{ position: 'absolute', width: '20px', height: '1px', backgroundColor: 'rgba(56, 189, 248, 0.6)' }} />
                        <div style={{ position: 'absolute', height: '20px', width: '1px', backgroundColor: 'rgba(56, 189, 248, 0.6)' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                        RTSP STREAM ACTIVE • AI DETECTOR ARMED
                      </span>
                    </div>

                    {/* Red Live Pill */}
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: 'rgba(239, 68, 68, 0.9)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '9px',
                      fontWeight: 800,
                      letterSpacing: '0.4px',
                      zIndex: 3
                    }}>
                      LIVE
                    </div>

                    {/* Virtual Detection Line Overlay */}
                    <div style={{
                      position: 'absolute',
                      bottom: '26%',
                      left: '8%',
                      right: '8%',
                      height: '2px',
                      backgroundColor: '#10b981',
                      boxShadow: '0 0 10px #10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      zIndex: 3
                    }}>
                      <span style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.9)',
                        color: '#000',
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '2px',
                        transform: 'translateY(-100%)'
                      }}>
                        LINE CROSSING GATE ACTIVE
                      </span>
                      <span style={{
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: '#94a3b8',
                        fontSize: '8px',
                        padding: '1px 4px',
                        transform: 'translateY(-100%)'
                      }}>
                        ByteTrack Line #1
                      </span>
                    </div>

                    {/* Simulated Vehicle Bounding Box for Gate 1 */}
                    {idx === 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '25%',
                        left: '35%',
                        width: '30%',
                        height: '26%',
                        border: '2px solid #10b981',
                        borderRadius: '4px',
                        boxShadow: '0 0 12px rgba(16, 185, 129, 0.5)',
                        zIndex: 3,
                        display: 'flex',
                        alignItems: 'flex-start'
                      }}>
                        <span style={{
                          backgroundColor: '#10b981',
                          color: '#000',
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '1px 4px',
                          borderRadius: '2px',
                          transform: 'translateY(-100%)'
                        }}>
                          MP07AB1234 • 98%
                        </span>
                      </div>
                    )}

                    {/* RTSP stream URL overlay at bottom */}
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '10px',
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      color: 'rgba(255, 255, 255, 0.75)',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      zIndex: 3
                    }}>
                      {cam.rtsp_url}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Part 2: Topology Network & Cross-Camera Tracking Hub */}
      {(subView === 'ALL' || subView === 'TOPOLOGY') && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1.1fr',
          gap: '20px'
        }}>
          {/* Interactive Topology Graph */}
          <div style={{
            backgroundColor: '#0f172a',
            borderRadius: '16px',
            padding: '22px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Camera Geometric Topology & Transit Path
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Directional graph governing expected travel time windows between cameras
                </p>
              </div>
              <span style={{
                backgroundColor: hasCameras ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                color: hasCameras ? '#a5b4fc' : '#64748b',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '6px'
              }}>
                {hasCameras ? 'Handoff Engine Online' : 'Awaiting Camera Nodes'}
              </span>
            </div>

            {/* SVG Interactive Topology Visualization */}
            <div style={{
              backgroundColor: '#070b14',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              overflow: 'hidden',
              height: '320px',
              position: 'relative'
            }}>
              <svg viewBox="0 0 600 320" style={{ width: '100%', height: '100%' }}>
                {/* Connectors */}
                <line x1="100" y1="90" x2="280" y2="160" stroke="#3b82f6" strokeWidth="3" strokeDasharray="6 3" />
                <line x1="100" y1="230" x2="280" y2="160" stroke="#3b82f6" strokeWidth="3" strokeDasharray="6 3" />
                <line x1="280" y1="160" x2="480" y2="160" stroke="#10b981" strokeWidth="3" strokeDasharray="6 3" />

                {/* Node 1: Gate 1 */}
                <circle cx="100" cy="90" r="28" fill="#1e293b" stroke="#3b82f6" strokeWidth="2.5" />
                <text x="100" y="86" fill="#f8fafc" fontSize="11" textAnchor="middle" fontWeight="700">Gate 1</text>
                <text x="100" y="100" fill="#38bdf8" fontSize="9" textAnchor="middle">Entry Cam</text>

                {/* Node 2: Gate 2 */}
                <circle cx="100" cy="230" r="28" fill="#1e293b" stroke="#3b82f6" strokeWidth="2.5" />
                <text x="100" y="226" fill="#f8fafc" fontSize="11" textAnchor="middle" fontWeight="700">Gate 2</text>
                <text x="100" y="240" fill="#38bdf8" fontSize="9" textAnchor="middle">Side Cam</text>

                {/* Node 3: Campus Road (Corridor) */}
                <circle cx="280" cy="160" r="32" fill="#1e293b" stroke="#f59e0b" strokeWidth="2.5" />
                <text x="280" y="156" fill="#f8fafc" fontSize="11" textAnchor="middle" fontWeight="700">Campus Road</text>
                <text x="280" y="170" fill="#f59e0b" fontSize="9" textAnchor="middle">Corridor Sensor</text>

                {/* Node 4: Parking Area */}
                <circle cx="480" cy="160" r="32" fill="#1e293b" stroke="#10b981" strokeWidth="2.5" />
                <text x="480" y="156" fill="#f8fafc" fontSize="11" textAnchor="middle" fontWeight="700">Parking Area</text>
                <text x="480" y="170" fill="#10b981" fontSize="9" textAnchor="middle">Destination</text>

                {/* Travel Time Labels */}
                <rect x="165" y="110" width="65" height="18" rx="4" fill="#0f172a" stroke="#334155" />
                <text x="197" y="123" fill="#94a3b8" fontSize="9" textAnchor="middle">30–90 sec</text>

                <rect x="165" y="195" width="65" height="18" rx="4" fill="#0f172a" stroke="#334155" />
                <text x="197" y="208" fill="#94a3b8" fontSize="9" textAnchor="middle">20–70 sec</text>

                <rect x="360" y="145" width="70" height="18" rx="4" fill="#0f172a" stroke="#334155" />
                <text x="395" y="158" fill="#94a3b8" fontSize="9" textAnchor="middle">40–120 sec</text>
              </svg>
            </div>
          </div>

          {/* Cross-Camera Reconciliation Status & Handoff Pipeline */}
          <div style={{
            backgroundColor: '#0f172a',
            borderRadius: '16px',
            padding: '22px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Cross-Camera Handoff Pipeline
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', marginBottom: '14px' }}>
              Resolves vehicles with unreadable plates using downstream evidence
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
              {simulatedHandoff.map((ho) => (
                <div
                  key={ho.id}
                  style={{
                    backgroundColor: '#11192d',
                    borderRadius: '10px',
                    padding: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="plate-number" style={{ fontSize: '13px', color: '#f8fafc', fontWeight: 800 }}>
                      {ho.plate}
                    </span>
                    <span style={{
                      backgroundColor: ho.status === 'RECONCILED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: ho.status === 'RECONCILED' ? '#10b981' : '#f59e0b',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {ho.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
                    <span>{ho.sourceCam}</span>
                    <ArrowRight size={12} color="#3b82f6" />
                    <span>{ho.destCam}</span>
                  </div>

                  <div style={{ fontSize: '10px', color: '#64748b' }}>
                    Travel Time: <strong style={{ color: '#cbd5e1' }}>{ho.timeDelta}</strong> • Conf: <strong style={{ color: '#10b981' }}>{(ho.confidence * 100).toFixed(0)}%</strong>
                  </div>

                  <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '2px' }}>
                    {ho.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
