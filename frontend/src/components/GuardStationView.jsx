import React, { useState } from 'react';
import {
  ShieldAlert,
  Bell,
  Camera,
  CheckCircle,
  AlertTriangle,
  QrCode,
  ScanLine,
  ChevronLeft,
  Search,
  Lock,
  Unlock,
  Radio,
  Sparkles
} from 'lucide-react';

export default function GuardStationView({ onAllowEntry, onRejectEntry }) {
  const [activeScreen, setActiveScreen] = useState('home'); // 'home', 'scan', 'alert-detail'
  const [manualInput, setManualInput] = useState('');
  const [barrierStatus, setBarrierStatus] = useState('CLOSED'); // 'CLOSED', 'OPENING', 'OPEN'
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  // Sample vehicle currently detected in viewfinder
  const [activeDetection, setActiveDetection] = useState({
    plate: 'MP07AB1234',
    owner: 'Rajesh Gupta',
    associated: 'Arin Gupta (Student)',
    type: 'Car',
    model: 'Hyundai i20',
    color: 'White',
    time: '10:42:15 AM',
    gate: 'Gate 1 - Main Entry',
    status: 'Authorized',
    image: '/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png'
  });

  const handleOpenBarrier = () => {
    setBarrierStatus('OPEN');
    setActionSuccessMessage('Barrier Gate 1 Unlocked: Entry Granted');
    setTimeout(() => {
      setBarrierStatus('CLOSED');
      setActionSuccessMessage('');
    }, 4000);
  };

  const handleSoundAlarm = () => {
    setActionSuccessMessage('🚨 Security Control Room Notified! Barrier Locked.');
    setTimeout(() => {
      setActionSuccessMessage('');
    }, 4000);
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      padding: '20px 0',
      minHeight: 'calc(100vh - 100px)'
    }}>
      {/* Mobile Device Simulation Frame */}
      <div style={{
        width: '390px',
        backgroundColor: 'var(--bg-card-subtle)',
        borderRadius: '36px',
        border: '8px solid #1e293b',
        boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        height: '780px'
      }}>
        {/* Phone Notch & Status Bar */}
        <div style={{
          height: '44px',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--text-main)',
          backgroundColor: 'var(--bg-card-subtle)',
          zIndex: 20
        }}>
          <span>9:41</span>
          <div style={{
            width: '90px',
            height: '18px',
            backgroundColor: '#000',
            borderRadius: '12px'
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Radio size={14} color="#10b981" />
            <div style={{
              width: '18px',
              height: '10px',
              border: '1px solid #f8fafc',
              borderRadius: '2px',
              position: 'relative'
            }}>
              <div style={{ width: '12px', height: '100%', backgroundColor: '#10b981' }} />
            </div>
          </div>
        </div>

        {/* Action feedback banner */}
        {actionSuccessMessage && (
          <div style={{
            backgroundColor: '#10b981',
            color: '#000',
            fontSize: '12px',
            fontWeight: 700,
            padding: '8px 14px',
            textAlign: 'center',
            zIndex: 30
          }}>
            {actionSuccessMessage}
          </div>
        )}

        {/* Tab 1: Guard Home & Alert Queue */}
        {activeScreen === 'home' && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '16px 20px',
            overflowY: 'auto'
          }}>
            {/* Guard Profile Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-card-subtle)',
                  border: '2px solid #3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '13px'
                }}>
                  RS
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Good Morning</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>Guard Rajesh</div>
                </div>
              </div>

              <div style={{
                position: 'relative',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-card-subtle)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-main)'
              }}>
                <Bell size={18} />
                <span style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444'
                }} />
              </div>
            </div>

            {/* Quick Stat Tiles */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderRadius: '14px',
                padding: '14px',
                border: '1px solid rgba(59, 130, 246, 0.25)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-primary)' }}>12</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>Today Entries</div>
              </div>

              <div style={{
                backgroundColor: '#26121b',
                borderRadius: '14px',
                padding: '14px',
                border: '1px solid rgba(239, 68, 68, 0.25)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444' }}>3</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>Active Alerts</div>
              </div>
            </div>

            {/* Barrier Gate Control */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '14px',
              padding: '14px',
              border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Gate 1 Barrier Arm</div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: barrierStatus === 'OPEN' ? '#10b981' : '#ef4444',
                  marginTop: '2px'
                }}>
                  {barrierStatus === 'OPEN' ? '🟢 BARRIER RAISED' : '🔒 BARRIER LOCKED'}
                </div>
              </div>
              <button
                onClick={handleOpenBarrier}
                style={{
                  backgroundColor: barrierStatus === 'OPEN' ? '#10b981' : '#2563eb',
                  color: 'var(--accent-primary-text)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {barrierStatus === 'OPEN' ? <Unlock size={14} /> : <Lock size={14} />}
                <span>{barrierStatus === 'OPEN' ? 'Close Gate' : 'Open Gate'}</span>
              </button>
            </div>

            {/* Live Alerts Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>Live Alerts</span>
              <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>View All</span>
            </div>

            {/* Alert List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              <div
                onClick={() => setActiveScreen('alert-detail')}
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderRadius: '12px',
                  padding: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: '48px', height: '40px', borderRadius: '6px', overflow: 'hidden' }}>
                  <img src="/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                    MP07XY9999
                  </div>
                  <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>
                    Unknown Vehicle
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Gate 1 • 10:41 AM
                  </div>
                </div>
              </div>

              <div
                onClick={() => setActiveScreen('alert-detail')}
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderRadius: '12px',
                  padding: '12px',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: '48px', height: '40px', borderRadius: '6px', overflow: 'hidden' }}>
                  <img src="/assets/ChatGPT Image Sep 27, 2026, 11_19_51 AM.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                    MP07GH3456
                  </div>
                  <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>
                    Suspicious Vehicle
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Gate 2 • 10:38 AM
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Scan Vehicle Viewfinder */}
        {activeScreen === 'scan' && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#000',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '16px',
              right: '16px',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <button
                onClick={() => setActiveScreen('home')}
                style={{ background: 'none', color: 'var(--accent-primary-text)' }}
              >
                <ChevronLeft size={24} />
              </button>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-primary-text)' }}>
                Scan Vehicle Plate
              </span>
              <div style={{ width: '24px' }} />
            </div>

            {/* Camera Viewfinder */}
            <div style={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src="/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png"
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Targeting Reticle */}
              <div style={{
                position: 'absolute',
                width: '260px',
                height: '160px',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '16px',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Plate Box */}
                <div style={{
                  border: '2px solid #10b981',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  boxShadow: '0 0 12px #10b981'
                }}>
                  <span style={{
                    color: '#10b981',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '16px',
                    fontWeight: 800,
                    letterSpacing: '1px'
                  }}>
                    MP07AB1234
                  </span>
                </div>
              </div>

              <div style={{
                position: 'absolute',
                bottom: '100px',
                color: 'var(--text-main)',
                fontSize: '12px',
                fontWeight: 600,
                textAlign: 'center',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)'
              }}>
                Position the number plate within the frame
              </div>
            </div>

            {/* Bottom Shutter & Manual Entry */}
            <div style={{
              backgroundColor: 'var(--bg-card-subtle)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <button
                onClick={() => setActiveScreen('alert-detail')}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: '4px solid #fff',
                  backgroundColor: '#3b82f6',
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)'
                }}
              />

              <button
                onClick={() => {
                  const plate = prompt('Enter Vehicle License Plate manually:');
                  if (plate) {
                    setActiveDetection(prev => ({ ...prev, plate: plate.toUpperCase() }));
                    setActiveScreen('alert-detail');
                  }
                }}
                style={{
                  background: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                ⌨ Enter Manually
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Detailed Alert Decision View */}
        {activeScreen === 'alert-detail' && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '16px 20px',
            overflowY: 'auto'
          }}>
            <button
              onClick={() => setActiveScreen('home')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '12px'
              }}
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>

            {/* Vehicle Card */}
            <div style={{
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#000',
              aspectRatio: '16/10',
              marginBottom: '14px'
            }}>
              <img src="/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div style={{
              fontSize: '22px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-main)',
              marginBottom: '12px'
            }}>
              {activeDetection.plate}
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '12px',
              backgroundColor: 'var(--bg-card)',
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Owner</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{activeDetection.owner}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Make / Model</span>
                <span style={{ color: 'var(--text-main)' }}>{activeDetection.model}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>{activeDetection.status}</span>
              </div>
            </div>

            {/* Decision Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleOpenBarrier}
                style={{
                  backgroundColor: '#10b981',
                  color: '#000',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <CheckCircle size={16} />
                <span>Allow Entry (Raise Barrier)</span>
              </button>

              <button
                onClick={handleSoundAlarm}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <AlertTriangle size={16} />
                <span>Notify Control Room</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Mobile Tab Bar */}
        <div style={{
          height: '60px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'var(--bg-card-subtle)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          alignItems: 'center',
          padding: '0 12px'
        }}>
          <button
            onClick={() => setActiveScreen('home')}
            style={{
              background: 'none',
              color: activeScreen === 'home' ? '#38bdf8' : '#64748b',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <ShieldAlert size={18} />
            <span>Home</span>
          </button>

          <button
            onClick={() => setActiveScreen('scan')}
            style={{
              background: 'none',
              color: activeScreen === 'scan' ? '#38bdf8' : '#64748b',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <ScanLine size={18} />
            <span>Scan</span>
          </button>

          <button
            onClick={() => setActiveScreen('alert-detail')}
            style={{
              background: 'none',
              color: activeScreen === 'alert-detail' ? '#38bdf8' : '#64748b',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <CheckCircle size={18} />
            <span>Details</span>
          </button>
        </div>
      </div>
    </div>
  );
}
