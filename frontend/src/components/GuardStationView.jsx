import React, { useState } from 'react';
import {
  ShieldAlert,
  Bell,
  Camera,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ScanLine,
  Search,
  Lock,
  Unlock,
  Radio,
  Sparkles,
  UserCheck,
  Clock,
  Car,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  PlusCircle
} from 'lucide-react';

export default function GuardStationView({
  onAllowEntry,
  onRejectEntry,
  onIssueVisitorPass,
  recentEntries = []
}) {
  const [activeGate, setActiveGate] = useState('Gate 1 - Main Ingress');
  const [manualInput, setManualInput] = useState('');
  const [barrierStatus, setBarrierStatus] = useState('CLOSED'); // 'CLOSED', 'OPENING', 'OPEN'
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [activeSubMode, setActiveSubMode] = useState('live'); // 'live', 'qr_scan', 'visitor_modal'

  // Active vehicle currently detected at gate barrier
  const [activeDetection, setActiveDetection] = useState({
    plate: 'MP07AB1234',
    owner: 'Rajesh Gupta',
    associated: 'Arin Gupta (Student - CS Dept)',
    type: 'Car',
    model: 'Hyundai i20 (White)',
    color: 'White',
    time: 'Just Now',
    gate: 'Gate 1 - Main Ingress',
    status: 'AUTHORIZED',
    confidence: '98.4%',
    passType: 'Annual Student Permit',
    validTill: '31 Jul 2027',
    image: '/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png'
  });

  // Visitor quick-issue form state
  const [visitorForm, setVisitorForm] = useState({
    driverName: '',
    hostPerson: '',
    purpose: 'Campus Delivery / Meeting',
    vehicleType: 'Car'
  });

  const handleOpenBarrier = () => {
    setBarrierStatus('OPEN');
    setActionSuccessMessage(`🟢 Barrier Raised: Clearance Granted for ${activeDetection.plate}`);
    if (onAllowEntry) onAllowEntry();
    setTimeout(() => {
      setBarrierStatus('CLOSED');
      setActionSuccessMessage('');
    }, 4500);
  };

  const handleDenyEntry = () => {
    setBarrierStatus('CLOSED');
    setActionSuccessMessage(`🚨 Entry Denied: Security Intercept Triggered for ${activeDetection.plate}`);
    if (onRejectEntry) onRejectEntry();
    setTimeout(() => {
      setActionSuccessMessage('');
    }, 4500);
  };

  const handleManualPlateLookup = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const clean = manualInput.trim().toUpperCase().replace(/\s+/g, '');
    setActiveDetection({
      plate: clean,
      owner: 'Manual Guard Override',
      associated: 'Manual Entry Verified',
      type: 'Car',
      model: 'Inspected Vehicle',
      color: 'Silver',
      time: 'Just Now',
      gate: activeGate,
      status: clean.includes('9999') ? 'FLAGGED_UNLISTED' : 'AUTHORIZED',
      confidence: '100% (Manual Verification)',
      passType: 'Manual Check-in',
      validTill: 'Today Only',
      image: '/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png'
    });
    setManualInput('');
  };

  const handleCreateVisitorPass = (e) => {
    e.preventDefault();
    if (!visitorForm.driverName || !visitorForm.hostPerson) return;
    if (onIssueVisitorPass) {
      onIssueVisitorPass(activeDetection.plate, visitorForm);
    }
    setActionSuccessMessage(`🎫 1-Day Visitor Pass Generated for ${activeDetection.plate}`);
    setActiveDetection(prev => ({
      ...prev,
      owner: visitorForm.driverName,
      associated: `Visitor (Host: ${visitorForm.hostPerson})`,
      status: 'AUTHORIZED',
      passType: '1-Day Temporary Pass',
      validTill: 'Today 23:59'
    }));
    setActiveSubMode('live');
    setTimeout(() => setActionSuccessMessage(''), 4500);
  };

  const isAuthorized = activeDetection.status === 'AUTHORIZED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
      {/* Top Console Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        backgroundColor: 'var(--bg-card)',
        padding: '16px 22px',
        borderRadius: '16px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--accent-primary-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Gate Operator Console
              </h2>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--color-emerald-bg)',
                color: 'var(--color-emerald)',
                border: '1px solid var(--color-emerald-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Radio size={12} className="animate-pulse" />
                LIVE FEED 30 FPS
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Active Gate: <strong>{activeGate}</strong> • AI Best-Shot Latch Active (YOLO11n + OCR)
            </p>
          </div>
        </div>

        {/* Gate Selector & Mode Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            backgroundColor: 'var(--bg-card-subtle)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: '4px'
          }}>
            <button
              onClick={() => setActiveSubMode('live')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: activeSubMode === 'live' ? 'var(--accent-primary)' : 'transparent',
                color: activeSubMode === 'live' ? 'var(--accent-primary-text)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Camera size={14} />
              Ingress Camera
            </button>
            <button
              onClick={() => setActiveSubMode('qr_scan')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: activeSubMode === 'qr_scan' ? 'var(--accent-primary)' : 'transparent',
                color: activeSubMode === 'qr_scan' ? 'var(--accent-primary-text)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <QrCode size={14} />
              QR Gate Scanner
            </button>
          </div>

          <select
            value={activeGate}
            onChange={(e) => setActiveGate(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-main)',
              fontSize: '13px',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="Gate 1 - Main Ingress">Gate 1 - Main Ingress</option>
            <option value="Gate 2 - East Entrance">Gate 2 - East Entrance</option>
            <option value="Gate 3 - Service / Cargo Exit">Gate 3 - Cargo Gate</option>
          </select>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionSuccessMessage && (
        <div style={{
          backgroundColor: actionSuccessMessage.includes('Denied') ? 'var(--color-crimson-bg)' : 'var(--color-emerald-bg)',
          color: actionSuccessMessage.includes('Denied') ? 'var(--color-crimson)' : 'var(--color-emerald)',
          border: `1px solid ${actionSuccessMessage.includes('Denied') ? 'var(--color-crimson-border)' : 'var(--color-emerald-border)'}`,
          padding: '12px 18px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: 'var(--shadow-card)'
        }}>
          {actionSuccessMessage.includes('Denied') ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Main Console View (Two Column Split Layout) */}
      {activeSubMode === 'live' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '20px',
          alignItems: 'stretch'
        }}>
          {/* Left Column: Live Camera Viewfinder & OCR Reticle */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '18px',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-card-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={16} color="var(--accent-primary)" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                  Optical Telemetry Viewfinder
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                CONFIDENCE: {activeDetection.confidence}
              </span>
            </div>

            {/* Video Canvas / Frame View */}
            <div style={{
              position: 'relative',
              flex: 1,
              minHeight: '340px',
              backgroundColor: '#0a0a0c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <img
                src={activeDetection.image}
                alt="Gate Viewfinder"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png";
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'contrast(1.05)'
                }}
              />

              {/* Synthetic AI Target Bounding Reticle */}
              <div style={{
                position: 'absolute',
                width: '320px',
                height: '180px',
                border: `2px dashed ${isAuthorized ? '#10b981' : '#f59e0b'}`,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '8px',
                pointerEvents: 'none',
                boxShadow: isAuthorized ? '0 0 30px rgba(16, 185, 129, 0.25)' : '0 0 30px rgba(245, 158, 11, 0.25)'
              }}>
                <span style={{
                  backgroundColor: isAuthorized ? '#10b981' : '#f59e0b',
                  color: '#000',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {isAuthorized ? 'LATCHED: AUTHORIZED' : 'LATCHED: REVIEW'}
                </span>
                <span style={{
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  textShadow: '0 1px 4px rgba(0,0,0,0.9)'
                }}>
                  {activeDetection.type}
                </span>
              </div>

              {/* Floating Camera Metadata Overlay */}
              <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                right: '12px',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                borderRadius: '10px',
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#fff',
                fontSize: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <span style={{ fontWeight: 600 }}>RTSP Stream 01</span>
                  <span style={{ opacity: 0.6 }}>•</span>
                  <span style={{ opacity: 0.8 }}>ThreadedGrabber Active (0ms Lag)</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', opacity: 0.8 }}>
                  1920x1080 @ 30fps
                </span>
              </div>
            </div>

            {/* Quick Plate Manual Entry Bar */}
            <form onSubmit={handleManualPlateLookup} style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '10px',
              backgroundColor: 'var(--bg-card)'
            }}>
              <input
                type="text"
                placeholder="Type plate number manually (e.g. MP07AB1234)..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-card-hover)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Search size={14} />
                Lookup Plate
              </button>
            </form>
          </div>

          {/* Right Column: High-Contrast Plate Card & Barrier Actions */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Real-Time Identified Plate Card */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '18px',
              border: `2px solid ${isAuthorized ? 'var(--color-emerald-border)' : 'var(--color-amber-border)'}`,
              padding: '22px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}>
              {/* Header Status Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  color: isAuthorized ? 'var(--color-emerald)' : 'var(--color-amber)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {isAuthorized ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  {isAuthorized ? 'PERMIT VERIFIED & ACTIVE' : 'UNLISTED / REVIEW REQUIRED'}
                </span>

                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: barrierStatus === 'OPEN' ? 'var(--color-emerald-bg)' : 'var(--color-crimson-bg)',
                  color: barrierStatus === 'OPEN' ? 'var(--color-emerald)' : 'var(--color-crimson)',
                  border: `1px solid ${barrierStatus === 'OPEN' ? 'var(--color-emerald-border)' : 'var(--color-crimson-border)'}`
                }}>
                  {barrierStatus === 'OPEN' ? 'BARRIER: RAISED' : 'BARRIER: LOCKED'}
                </div>
              </div>

              {/* Realistic Indian License Plate Widget */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '3px solid #000000',
                borderRadius: '8px',
                padding: '6px 16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                alignSelf: 'flex-start'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  paddingRight: '10px',
                  borderRight: '2px solid #000'
                }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#003399', marginBottom: '2px' }} />
                  <span style={{ fontSize: '9px', fontWeight: 900, color: '#003399', letterSpacing: '0.5px' }}>IND</span>
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '28px',
                  fontWeight: 900,
                  color: '#000000',
                  letterSpacing: '3px'
                }}>
                  {activeDetection.plate}
                </span>
              </div>

              {/* Driver & Pass Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                backgroundColor: 'var(--bg-card-subtle)',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>REGISTERED OWNER</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                    {activeDetection.owner}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>CAMPUS ROLE</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {activeDetection.associated}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>VEHICLE MODEL</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {activeDetection.model}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>PASS VALIDITY</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-emerald)', marginTop: '2px' }}>
                    {activeDetection.validTill}
                  </div>
                </div>
              </div>

              {/* Big Touch Operator Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={handleOpenBarrier}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 6px 20px rgba(22, 163, 74, 0.35)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Unlock size={20} />
                  GRANT ENTRY & RAISE BARRIER
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    onClick={handleDenyEntry}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--color-crimson-bg)',
                      border: '1px solid var(--color-crimson-border)',
                      color: 'var(--color-crimson)',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <Lock size={16} />
                    Deny / Lock Barrier
                  </button>

                  <button
                    onClick={() => setActiveSubMode('visitor_modal')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-card-hover)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-main)',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <PlusCircle size={16} />
                    Issue Guest Pass
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Submode */}
      {activeSubMode === 'qr_scan' && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '18px',
          border: '1px solid var(--border-subtle)',
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{
            width: '280px',
            height: '280px',
            borderRadius: '20px',
            border: '3px dashed var(--accent-primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-card-subtle)',
            position: 'relative'
          }}>
            <ScanLine size={64} color="var(--accent-primary)" className="animate-bounce" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '12px' }}>
              Hold Resident Digital QR Pass to Camera
            </span>
          </div>

          <button
            onClick={() => {
              setActiveDetection({
                plate: 'MP07CD5678',
                owner: 'Priya Sharma (Faculty)',
                associated: 'Prof. Computer Science',
                type: 'Car',
                model: 'Honda City',
                color: 'Black',
                time: 'Just Now',
                gate: activeGate,
                status: 'AUTHORIZED',
                confidence: '100% (QR Verified)',
                passType: 'Faculty Permanent Pass',
                validTill: '31 Dec 2028',
                image: '/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png'
              });
              setActiveSubMode('live');
              setActionSuccessMessage('QR Pass Verified: Welcome Prof. Priya Sharma');
              setTimeout(() => setActionSuccessMessage(''), 4500);
            }}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-primary-text)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Simulate Successful QR Scan
          </button>
        </div>
      )}

      {/* Visitor Pass Issuance Modal */}
      {activeSubMode === 'visitor_modal' && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '18px',
          border: '1px solid var(--border-subtle)',
          padding: '28px',
          boxShadow: 'var(--shadow-card)',
          maxWidth: '640px',
          margin: '0 auto',
          width: '100%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Issue 1-Day Temporary Gate Pass
            </h3>
            <button
              onClick={() => setActiveSubMode('live')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
            >
              ✕ Cancel
            </button>
          </div>

          <form onSubmit={handleCreateVisitorPass} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Plate Number</label>
              <input
                type="text"
                disabled
                value={activeDetection.plate}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-card-subtle)',
                  color: 'var(--text-main)',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  marginTop: '4px'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Visitor / Driver Full Name</label>
              <input
                type="text"
                placeholder="e.g. Suresh Kumar"
                required
                value={visitorForm.driverName}
                onChange={(e) => setVisitorForm({ ...visitorForm, driverName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  marginTop: '4px'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Host Person / Department to Visit</label>
              <input
                type="text"
                placeholder="e.g. Dr. Verma (Mechanical Dept) / Guest House"
                required
                value={visitorForm.hostPerson}
                onChange={(e) => setVisitorForm({ ...visitorForm, hostPerson: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  marginTop: '4px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: '#16a34a',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Issue Pass & Open Barrier
              </button>
              <button
                type="button"
                onClick={() => setActiveSubMode('live')}
                style={{
                  padding: '14px 20px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-card-hover)',
                  color: 'var(--text-main)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bottom Row: Recent Gate Ingress Queue */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '18px',
        border: '1px solid var(--border-subtle)',
        padding: '18px 22px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Recent Gate Ingress Stream
            </h3>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Auto-synchronized via WebSocket (ARQ Background Worker)
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '12px'
        }}>
          {recentEntries.slice(0, 5).map((entry, idx) => {
            const isAuth = entry.entry_status === 'AUTHORIZED';
            return (
              <div
                key={entry.id || idx}
                onClick={() => {
                  setActiveDetection({
                    plate: entry.plate_number,
                    owner: entry.owner_name || 'Vehicle Record',
                    associated: entry.associated_person || 'Campus Visitor',
                    type: entry.vehicle_type || 'Car',
                    model: entry.make_model || 'Vehicle',
                    color: entry.color || 'Silver',
                    time: new Date(entry.first_seen_at || Date.now()).toLocaleTimeString(),
                    gate: entry.camera_name || activeGate,
                    status: entry.entry_status,
                    confidence: `${Math.round((entry.confidence || 0.95) * 100)}%`,
                    passType: isAuth ? 'Automated Clearance' : 'Flagged Inspection',
                    validTill: isAuth ? 'Verified' : 'Manual Review',
                    image: entry.image_url || '/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png'
                  });
                }}
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  border: `1px solid ${isAuth ? 'var(--border-subtle)' : 'var(--color-crimson-border)'}`,
                  borderRadius: '12px',
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'transform 0.1s ease',
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  backgroundColor: isAuth ? 'var(--color-emerald-bg)' : 'var(--color-crimson-bg)',
                  color: isAuth ? 'var(--color-emerald)' : 'var(--color-crimson)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Car size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-main)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {entry.plate_number}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: isAuth ? 'var(--color-emerald)' : 'var(--color-crimson)',
                    fontWeight: 600
                  }}>
                    {isAuth ? 'Verified' : 'Flagged Alert'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
