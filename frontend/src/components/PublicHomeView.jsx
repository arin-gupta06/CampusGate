import React, { useState } from 'react';
import {
  ShieldCheck,
  Car,
  User,
  QrCode,
  ArrowRight,
  CheckCircle,
  Video,
  Lock,
  Layers,
  Sparkles,
  Info,
  Phone,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Workflow,
  Search,
  FileText,
  AlertTriangle,
  HelpCircle,
  Activity,
  Zap,
  Gauge,
  Compass,
  Sun,
  Moon
} from 'lucide-react';

export default function PublicHomeView({
  onNavigateToSettings,
  onNavigateToProfile,
  onSwitchToAdmin,
  theme,
  toggleTheme
}) {
  // Navigation tabs: 'home', 'about', 'gate-status', 'how-it-works', 'guidelines', 'developers', 'contact'
  const [activeNav, setActiveNav] = useState('home');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  
  // Instant Plate Status Checker
  const [checkPlateInput, setCheckPlateInput] = useState('');
  const [plateCheckResult, setPlateCheckResult] = useState(null);

  const handlePlateCheck = (e) => {
    e.preventDefault();
    const clean = checkPlateInput.trim().toUpperCase().replace(/\s+/g, '');
    if (!clean) return;

    const mockAuthorized = ['MP07AB1234', 'MP07CD5678', 'MP07JK2345', 'MP07LM6789', 'MP07MN1011', 'MP07PQ3456'];
    
    if (mockAuthorized.includes(clean)) {
      setPlateCheckResult({
        status: 'AUTHORIZED',
        plate: clean,
        type: 'Student / Faculty Pass',
        gateAccess: 'All Campus Gates (Gate 1 & Gate 2)',
        validUntil: '31 July 2027',
        message: 'Vehicle is pre-authorized for automated barrier lift.'
      });
    } else {
      setPlateCheckResult({
        status: 'UNREGISTERED',
        plate: clean,
        type: 'No Active Pass',
        gateAccess: 'Requires Manual Guard Check',
        validUntil: 'N/A',
        message: 'Vehicle not registered. Please register using the form below or at the security office.'
      });
    }
  };

  return (
    <div style={{
      maxWidth: '1260px',
      margin: '0 auto',
      padding: '24px 24px 60px',
      display: 'flex',
      flexDirection: 'column',
      gap: '30px'
    }}>
      {/* ============================================================ */}
      {/* PUBLIC NAVBAR: Spaced-out design without Control Room Access */}
      {/* ============================================================ */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 26px',
        backgroundColor: 'var(--bg-card-subtle)',
        borderRadius: '18px',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 10px 32px rgba(0, 0, 0, 0.45)',
        position: 'sticky',
        top: '16px',
        zIndex: 50,
        backdropFilter: 'blur(12px)',
        gap: '20px'
      }}>
        {/* Brand */}
        <div
          onClick={() => setActiveNav('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary-text)',
            boxShadow: '0 0 16px rgba(37, 99, 235, 0.5)'
          }}>
            <ShieldCheck size={23} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '0.2px' }}>
              CampusGuard
            </h1>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
              Official Campus Vehicle Portal
            </span>
          </div>
        </div>

        {/* Center Navbar Tabs - Spacious, single line with no text wrapping */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'var(--bg-card-subtle)',
          padding: '5px 8px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          whiteSpace: 'nowrap',
          overflowX: 'auto'
        }}>
          {[
            { id: 'home', label: 'Home' },
            { id: 'about', label: 'About' },
            { id: 'gate-status', label: 'Gate Status' },
            { id: 'how-it-works', label: 'How It Works' },
            { id: 'guidelines', label: 'Guidelines' },
            { id: 'developers', label: 'Developers' },
            { id: 'contact', label: 'Contact Us' }
          ].map(tab => {
            const isActive = activeNav === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveNav(tab.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? 'rgba(59, 130, 246, 0.16)' : 'transparent',
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action Buttons - Public Self-Service Only (NO Control Room Access) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Theme Toggle Button */}
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Black (Dark Mode)' : 'White (Light Mode)'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-medium)',
                borderRadius: '9px',
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
              <span>{theme === 'light' ? 'Black' : 'White'}</span>
            </button>
          )}

          <button
            onClick={onNavigateToSettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              color: 'var(--accent-primary)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '9px',
              padding: '8px 15px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            <QrCode size={14} />
            <span>Register Vehicle</span>
          </button>

          <button
            onClick={onNavigateToProfile}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              backgroundColor: 'var(--bg-card-subtle)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '9px',
              padding: '8px 15px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            <User size={14} color="#38bdf8" />
            <span>My Profile</span>
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 1. HOME TAB                                                  */}
      {/* ============================================================ */}
      {activeNav === 'home' && (
        <>
          {/* Hero Section */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '24px',
            border: '1px solid var(--border-subtle)',
            padding: '48px 40px',
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            gap: '40px',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-100px',
              right: '-100px',
              width: '350px',
              height: '350px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(0,0,0,0) 70%)',
              pointerEvents: 'none'
            }} />

            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                padding: '4px 12px',
                borderRadius: '99px',
                fontSize: '12px',
                fontWeight: 700,
                marginBottom: '18px',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                <Sparkles size={14} />
                <span>Multi-Camera Vision AI Access System</span>
              </div>

              <h2 style={{
                fontSize: '36px',
                fontWeight: 800,
                color: 'var(--text-main)',
                lineHeight: 1.2,
                letterSpacing: '-0.5px',
                margin: '0 0 16px'
              }}>
                Automated Vehicle Identification & Entry Auditing
              </h2>

              <p style={{
                fontSize: '15px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: '32px'
              }}>
                Welcome to the official campus gate vehicle access portal. CampusGuard uses automated YOLOv8 license plate recognition, virtual line-crossing detectors, and cross-camera corridor tracking for fast, contactless gate clearance and vehicle audit.
              </p>

              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <button
                  onClick={onNavigateToSettings}
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-primary-text)',
                    padding: '13px 22px',
                    borderRadius: '12px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 20px rgba(37, 99, 235, 0.45)',
                    cursor: 'pointer'
                  }}
                >
                  <QrCode size={18} />
                  <span>Register / Update Vehicle (Settings)</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  onClick={() => setActiveNav('gate-status')}
                  style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    color: 'var(--text-main)',
                    padding: '13px 22px',
                    borderRadius: '12px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer'
                  }}
                >
                  <Activity size={18} color="#10b981" />
                  <span>Live Gate Status</span>
                </button>
              </div>
            </div>

            {/* Visual Preview Card */}
            <div style={{
              backgroundColor: 'var(--bg-card-subtle)',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
            }}>
              <div style={{
                position: 'relative',
                aspectRatio: '16/10',
                backgroundColor: 'var(--bg-base)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `
                    radial-gradient(ellipse at center, rgba(30, 41, 59, 0.5) 0%, rgba(5, 8, 17, 0.95) 100%),
                    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
                  `,
                  backgroundSize: '100% 100%, 25px 25px, 25px 25px'
                }} />

                <div style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    border: '1px dashed #10b981',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircle size={28} color="#10b981" />
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                    MP07AB1234
                  </span>
                  <span style={{ fontSize: '10px', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '99px', fontWeight: 700 }}>
                    AUTHORIZED • BARRIER AUTO-LIFT
                  </span>
                </div>
              </div>

              <div style={{ padding: '16px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)', fontWeight: 700 }}>
                  <span>Gate 1 Entrance Detection</span>
                  <span style={{ color: '#10b981' }}>Clearance &lt; 350ms</span>
                </div>
                <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                  YOLOv8 Plate Quality Gating + EasyOCR Sanitization
                </div>
              </div>
            </div>
          </div>

          {/* 3 Core Value Proposition Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px'
          }}>
            <div style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                marginBottom: '14px'
              }}>
                <CheckCircle size={22} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px' }}>
                Instant Contactless Entry
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Registered students and faculty experience automated barrier lift without stopping for manual RFID cards or paper passes.
              </p>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
                marginBottom: '14px'
              }}>
                <Layers size={22} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px' }}>
                Multi-Camera Corridor Handoff
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                If a plate is temporarily unreadable at Gate 1, downstream cameras on the Campus Road reconcile the vehicle through geometric topology.
              </p>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
                marginBottom: '14px'
              }}>
                <QrCode size={22} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px' }}>
                Instant QR Registration
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Scan the on-gate QR code with any smartphone camera to register a new vehicle or update student contact details in seconds.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* 2. ABOUT TAB                                                 */}
      {/* ============================================================ */}
      {activeNav === 'about' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '20px',
            padding: '36px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                <Info size={18} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                About the Campus Gate Vision AI System
              </h2>
            </div>
            
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '24px' }}>
              CampusGuard was conceived to solve the critical campus security and congestion challenges faced at college entry gates. During peak arrival windows (08:30–09:30 AM), manual guard inspections and RFID swipe cards cause severe bottlenecks, vehicle queues, and pass-sharing vulnerabilities.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginTop: '16px'
            }}>
              <div style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderRadius: '14px',
                padding: '24px',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-primary)', margin: '0 0 10px' }}>
                  The Core Principle
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  <strong>"An unreadable plate is not evidence that a vehicle is unauthorized."</strong> Real-world entry gates face glare, dirt, odd angles, or tailgating. Rather than rejecting vehicles or stalling traffic, CampusGuard leverages multi-camera topology to reconcile vehicle evidence downstream.
                </p>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderRadius: '14px',
                padding: '24px',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#10b981', margin: '0 0 10px' }}>
                  High-Assurance Auditing
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Every vehicle observation stores vehicle crops, plate crops, detection timestamps, directional track sessions, and line-crossing coordinates in a persistent PostgreSQL audit log for transparent campus security.
                </p>
              </div>
            </div>

            {/* Additional Security Objectives */}
            <div style={{ marginTop: '28px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
                Key Technical & Operational Objectives
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div style={{ backgroundColor: 'var(--bg-card-subtle)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '4px' }}>Sub-350ms Clearance</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Real-time barrier trigger before the driver reaches a complete stop, eliminating idling exhaust and morning queues.
                  </p>
                </div>
                <div style={{ backgroundColor: 'var(--bg-card-subtle)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', marginBottom: '4px' }}>Zero Pass-Sharing</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Tying access permissions directly to vehicle license plate numbers and physical attributes rather than loanable physical RFID cards.
                  </p>
                </div>
                <div style={{ backgroundColor: 'var(--bg-card-subtle)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b', marginBottom: '4px' }}>Automated Audit Log</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Tamper-proof forensic trail of every entry and exit event, linked with high-res snapshot crops and corridor handoff times.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. GATE STATUS & PASS CHECKER (RELEVANT TAB)                 */}
      {/* ============================================================ */}
      {activeNav === 'gate-status' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Real-time Gate Indicators */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Live Campus Gate Operational Status
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Real-time sensor telemetry and barrier health across active entry corridors
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '6px 14px',
                borderRadius: '99px',
                color: '#10b981',
                fontSize: '12px',
                fontWeight: 700
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                <span>ALL GATES FULLY OPERATIONAL</span>
              </div>
            </div>

            {/* Gate 1 & Gate 2 Status Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
              {/* Gate 1 */}
              <div style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderRadius: '14px',
                padding: '20px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Gate 1 — Main Ingress</h3>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--accent-primary)', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    FastLane Enabled
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
                  <div style={{ backgroundColor: 'var(--bg-card-subtle)', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Queue Time</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>0.0 s</div>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-card-subtle)', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avg Clearance</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '2px' }}>318 ms</div>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-card-subtle)', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Barrier Health</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>100% OK</div>
                  </div>
                </div>
              </div>

              {/* Gate 2 */}
              <div style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderRadius: '14px',
                padding: '20px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Gate 2 — West Academic Ingress</h3>
                  </div>
                  <span style={{ fontSize: '11px', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    Normal Flow
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
                  <div style={{ backgroundColor: 'var(--bg-card-subtle)', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Queue Time</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>&lt; 5 s</div>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-card-subtle)', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avg Clearance</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '2px' }}>342 ms</div>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-card-subtle)', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Barrier Health</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>100% OK</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Instant Plate Pass Verification Tool */}
            <div style={{
              backgroundColor: 'var(--bg-card-subtle)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(59, 130, 246, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Search size={18} color="#38bdf8" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Instant Gate Pass Verification Tool
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                Check if your vehicle license plate is authorized for automated barrier lift before approaching the gate.
              </p>

              <form onSubmit={handlePlateCheck} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Enter Plate Number (e.g. MP07AB1234)"
                  value={checkPlateInput}
                  onChange={(e) => setCheckPlateInput(e.target.value)}
                  style={{
                    flex: 1,
                    height: '44px',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '0 16px',
                    fontSize: '14px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-main)',
                    textTransform: 'uppercase'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    height: '44px',
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-primary-text)',
                    padding: '0 24px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Search size={15} />
                  <span>Check Pass Status</span>
                </button>
              </form>

              {/* Plate Result Display */}
              {plateCheckResult && (
                <div style={{
                  marginTop: '18px',
                  backgroundColor: plateCheckResult.status === 'AUTHORIZED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${plateCheckResult.status === 'AUTHORIZED' ? '#10b981' : '#ef4444'}`,
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {plateCheckResult.status === 'AUTHORIZED' ? (
                      <CheckCircle2 size={28} color="#10b981" />
                    ) : (
                      <AlertTriangle size={28} color="#ef4444" />
                    )}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                          {plateCheckResult.plate}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '99px',
                          backgroundColor: plateCheckResult.status === 'AUTHORIZED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: plateCheckResult.status === 'AUTHORIZED' ? '#10b981' : '#ef4444'
                        }}>
                          {plateCheckResult.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                        {plateCheckResult.message}
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '12px' }}>
                    <div style={{ color: 'var(--text-muted)' }}>Allowed Access</div>
                    <div style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{plateCheckResult.gateAccess}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. HOW IT WORKS TAB                                          */}
      {/* ============================================================ */}
      {activeNav === 'how-it-works' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '20px',
            padding: '36px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                <Workflow size={18} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                How the Multi-Camera Pipeline Works
              </h2>
            </div>
            
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '28px' }}>
              From gate ingress line crossing to cross-camera handoff in 4 coordinated AI stages:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
              <div style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderRadius: '14px',
                padding: '20px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '8px' }}>01</div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px' }}>Line Crossing</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  YOLOv8 vehicle detector combined with ByteTrack tracks vehicle trajectories across the configured gate ingress line.
                </p>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderRadius: '14px',
                padding: '20px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '8px' }}>02</div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px' }}>Quality Gate</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Laplacian variance filter rejects blurry or low-resolution crops (sharpness threshold &gt; 120) before OCR execution.
                </p>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderRadius: '14px',
                padding: '20px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '8px' }}>03</div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px' }}>Indian Plate OCR</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  EasyOCR with regex sanitization disambiguates letters and numbers (e.g., MP07AB1234) against authorized campus records.
                </p>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderRadius: '14px',
                padding: '20px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginBottom: '8px' }}>04</div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px' }}>Corridor Handoff</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Downstream corridor & parking cameras correlate vehicle transitions within expected 30–90s travel windows.
                </p>
              </div>
            </div>

            {/* Reconciliation Proof Walkthrough */}
            <div style={{
              backgroundColor: 'var(--bg-card-subtle)',
              borderRadius: '14px',
              padding: '20px',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-primary)', margin: '0 0 8px' }}>
                Why Downstream Topology Correlation Matters
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                When vehicle V-101 crosses Gate 1 under severe headlight glare, the OCR confidence may drop below threshold. The system flags this as a candidate observation rather than immediately rejecting the vehicle. When V-101 reaches Camera 2 (Academic Corridor) 38 seconds later under uniform lighting, the plate is recognized as MP07AB1234. The engine back-propagates this authorization to clear the Gate 1 event without false alarm friction!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. PASS GUIDELINES & RULES (RELEVANT TAB)                    */}
      {/* ============================================================ */}
      {activeNav === 'guidelines' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '20px',
            padding: '36px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                <FileText size={18} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Campus Vehicle Regulations & Pass Guidelines
              </h2>
            </div>
            
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              All students, faculty, and campus visitors must adhere to official campus traffic guidelines and pass protocols.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ backgroundColor: 'var(--bg-card-subtle)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', marginBottom: '8px', fontWeight: 700 }}>
                  <Gauge size={16} />
                  <span>Campus Speed Limit (15 km/h)</span>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  The strict speed limit on all campus roads and corridor roundabouts is 15 km/h. Optical speed sensors between Gate 1 and Central Library automatically flag overspeeding vehicles.
                </p>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card-subtle)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '8px', fontWeight: 700 }}>
                  <Compass size={16} />
                  <span>Designated Parking Zones</span>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Students must park exclusively in <strong>Zone A</strong> (Two-Wheelers) or <strong>Zone B</strong> (Four-Wheelers). Zone C is reserved for faculty and staff. Parking on pedestrian walkways will result in vehicle wheel-lock.
                </p>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card-subtle)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', marginBottom: '8px', fontWeight: 700 }}>
                  <Clock size={16} />
                  <span>Hostel & Night Curfew Policy</span>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Student vehicles entering after <strong>10:30 PM</strong> require biometric guard log-in and warden approval. Overnight guest parking requires a temporary 24-hour pass issued at Gate 1 Control Room.
                </p>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card-subtle)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', marginBottom: '8px', fontWeight: 700 }}>
                  <ShieldCheck size={16} />
                  <span>Registration Document Requirements</span>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  For new registrations, students must provide: (1) Valid College Enrollment / ID, (2) State Registration Certificate (RC), (3) Driving License, and (4) Active Third-Party Vehicle Insurance.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. DEVELOPERS TAB                                            */}
      {/* ============================================================ */}
      {activeNav === 'developers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '20px',
            padding: '36px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(192, 132, 252, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                <Code2 size={18} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Engineering & Architecture Team
              </h2>
            </div>
            
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '28px' }}>
              Built with state-of-the-art computer vision models, high-concurrency asynchronous backend services, and a sleek frontend interface.
            </p>

            {/* Tech Stack Matrix */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '18px',
              marginBottom: '32px'
            }}>
              <div style={{
                backgroundColor: 'var(--bg-input)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', marginBottom: '12px' }}>
                  <Cpu size={18} />
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>Computer Vision & AI</span>
                </div>
                <ul style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: '16px', margin: 0 }}>
                  <li>Ultralytics YOLOv8 Fine-tuned Detector</li>
                  <li>ByteTrack Multi-Object Tracker</li>
                  <li>Laplacian Sharpness Quality Gate</li>
                  <li>EasyOCR + Indian HSRP Plate Normalizer</li>
                </ul>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-input)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '12px' }}>
                  <Database size={18} />
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>Backend & Reconciliation</span>
                </div>
                <ul style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: '16px', margin: 0 }}>
                  <li>FastAPI Asynchronous Web Engine</li>
                  <li>PostgreSQL 16 via Docker Container</li>
                  <li>SQLAlchemy 2.0 ORM with Migrations</li>
                  <li>Real-time WebSocket Push (/ws/live-feed)</li>
                </ul>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-input)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', marginBottom: '12px' }}>
                  <Code2 size={18} />
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>Frontend Dashboard</span>
                </div>
                <ul style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: '16px', margin: 0 }}>
                  <li>React 18 & Vite Fast Bundler</li>
                  <li>Recharts Visual Telemetry & Analytics</li>
                  <li>qrcode.react Self-Service Mobile Pass</li>
                  <li>Lucide Glassmorphism Design System</li>
                </ul>
              </div>
            </div>

            {/* Developer Credits Card */}
            <div style={{
              backgroundColor: 'var(--bg-card-subtle)',
              borderRadius: '14px',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid rgba(59, 130, 246, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-card-subtle)',
                  border: '2px solid #3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '15px',
                  color: 'var(--accent-primary-text)'
                }}>
                  AG
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                    Arin Gupta & Team
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    Computer Science & Engineering • Vision AI Project Lead
                  </p>
                </div>
              </div>

              <a
                href="https://github.com/arin-gupta06/CampusGate"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--bg-card-subtle)',
                  color: 'var(--accent-primary)',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: '1px solid var(--border-medium)'
                }}
              >
                {/* Clean inline GitHub SVG icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                <span>GitHub Repository</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. CONTACT US TAB                                            */}
      {/* ============================================================ */}
      {activeNav === 'contact' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '20px',
            padding: '36px',
            border: '1px solid var(--border-subtle)',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '36px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <Phone size={18} />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Campus Gate Security & Support
                </h2>
              </div>

              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
                Have questions regarding gate pass clearance, vehicle registration errors, or unlisted guest entry permits? Contact the security control room or IT support desk.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>Control Room Location</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Main Campus Gate 1 Security Tower, Ground Floor</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <Phone size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>Emergency Gate Helplines</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gate 1 Post: +91 751 240 9301 • Gate 2 Post: +91 751 240 9302</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                    <Mail size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>IT Support & Passes Desk</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>support.campusgate@mits.ac.in</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'rgba(192, 132, 252, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                    <Clock size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>Operating Hours</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Automated Vision AI Gates: 24/7/365 Non-stop</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Contact / Support Ticket Form */}
            <div style={{
              backgroundColor: 'var(--bg-input)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid var(--border-subtle)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 16px' }}>
                Send Security Desk a Query
              </h3>

              {contactSubmitted ? (
                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10b981',
                  color: '#10b981',
                  borderRadius: '10px',
                  padding: '18px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: 600
                }}>
                  ✓ Query submitted to Security Control Room! You will receive response on your college email shortly.
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setContactSubmitted(true);
                    setTimeout(() => setContactSubmitted(false), 5000);
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                >
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Your Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      required
                      style={{
                        width: '100%',
                        height: '38px',
                        backgroundColor: 'var(--bg-card-subtle)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '0 12px',
                        fontSize: '12px',
                        color: 'var(--text-main)'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      College Email or Phone
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. student@mits.ac.in"
                      required
                      style={{
                        width: '100%',
                        height: '38px',
                        backgroundColor: 'var(--bg-card-subtle)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '0 12px',
                        fontSize: '12px',
                        color: 'var(--text-main)'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Vehicle Plate Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MP07AB1234"
                      style={{
                        width: '100%',
                        height: '38px',
                        backgroundColor: 'var(--bg-card-subtle)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '0 12px',
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--accent-primary)'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Message / Issue
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe your pass query or barrier issue..."
                      required
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-card-subtle)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: 'var(--text-main)',
                        resize: 'none'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--accent-primary-text)',
                      padding: '11px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      marginTop: '4px'
                    }}
                  >
                    <Send size={14} />
                    <span>Send Message to Security Desk</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
