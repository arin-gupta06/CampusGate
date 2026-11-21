import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Avatar from './Avatar';
import {
  ShieldCheck,
  Crown,
  Sparkles,
  ArrowRight,
  Shield,
  CheckCircle2,
  Lock,
  ExternalLink,
  ChevronDown,
  UserCheck,
  AlertCircle,
  Car,
  QrCode,
  Search,
  Zap,
  Activity,
  Layers,
  Code2,
  Cpu,
  Clock,
  Smartphone,
  Eye,
  Check,
  Sun,
  Moon,
  Compass,
  Info
} from 'lucide-react';
import { loginWithOAuth, checkPlateAuthorization, API_BASE } from '../services/api';

export default function GoogleLandingView({ currentUser, onLoginSuccess, onOpenApplyPass, onNavigateTab }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDemoAccess, setShowDemoAccess] = useState(false);
  const FALLBACK_CLIENT_ID = '611350784550-nccrm5bbfkcb3ffgek9tu035djj0viil.apps.googleusercontent.com';
  const [googleClientId, setGoogleClientId] = useState(
    import.meta.env.VITE_GOOGLE_CLIENT_ID || FALLBACK_CLIENT_ID
  );
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const googleBtnContainerRef = useRef(null);

  // Live Plate Checker State
  const [plateQuery, setPlateQuery] = useState('');
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState(null);

  // Fetch official Google Client ID from backend
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`${API_BASE}/auth/config`);
        const cType = res.headers.get('content-type') || '';
        if (res.ok && cType.includes('application/json')) {
          const data = await res.json();
          if (data.google_client_id && !data.google_client_id.includes('YOUR_GOOGLE_CLIENT_ID')) {
            setGoogleClientId(data.google_client_id);
          }
        }
      } catch (e) {
        console.warn('Could not fetch auth config:', e);
      }
    }
    loadConfig();
  }, []);

  // Initialize official Google Identity Services button if Client ID exists
  useEffect(() => {
    if (!googleClientId) return;

    const renderGoogleBtn = () => {
      if (window.google?.accounts?.id && googleBtnContainerRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response) => {
              if (response.credential) {
                handleGoogleCredentialSuccess(response.credential);
              }
            }
          });

          googleBtnContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'signin_with',
            shape: 'pill'
          });
          setGsiLoaded(true);
          return true;
        } catch (err) {
          console.warn('Google GSI button render error:', err);
        }
      }
      return false;
    };

    if (!renderGoogleBtn()) {
      const interval = setInterval(() => {
        if (renderGoogleBtn()) clearInterval(interval);
      }, 300);
      const timeout = setTimeout(() => clearInterval(interval), 6000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [googleClientId]);

  const handleGoogleCredentialSuccess = async (googleJwt) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE}/auth/oauth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: googleJwt })
      });
      const cType = res.headers.get('content-type') || '';
      if (res.ok && cType.includes('application/json')) {
        const data = await res.json();
        onLoginSuccess(data.user);
      } else if (res.ok) {
        handleDemoLogin('user');
      } else {
        const err = cType.includes('application/json') ? await res.json() : { detail: 'Google authentication failed.' };
        setErrorMessage(err.detail || 'Google authentication failed.');
      }
    } catch (err) {
      setErrorMessage(`Verification error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Google OAuth 2.0 Popup Flow (TokenClient) or full-screen redirect
  const handleTriggerGooglePopup = () => {
    setErrorMessage('');
    setIsLoading(true);

    if (googleClientId && window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              setIsLoading(false);
              setErrorMessage(`Google Sign-In Error: ${tokenResponse.error_description || tokenResponse.error}. Please verify that your current application domain is added in Google Cloud Console under Authorized JavaScript Origins.`);
              return;
            }
            try {
              const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              const profile = await profileRes.json();

              const res = await fetch(`${API_BASE}/auth/oauth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: profile.email,
                  name: profile.name,
                  avatar: profile.picture,
                  google_id: profile.sub
                })
              });
              const cType = res.headers.get('content-type') || '';
              if (res.ok && cType.includes('application/json')) {
                const data = await res.json();
                onLoginSuccess(data.user);
              } else {
                handleDemoLogin('user');
              }
            } catch (err) {
              handleDemoLogin('user');
            } finally {
              setIsLoading(false);
            }
          }
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('OAuth2 tokenClient error, redirecting to OAuth route:', err);
      }
    }

    // Direct redirect to official Google OAuth consent screen (never blocked by popup blockers)
    window.location.href = '/api/auth/oauth/google';
  };

  const handleDirectLogin = async (email, name, role) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const auth = await loginWithOAuth('google', email, role);
      if (auth && auth.user) {
        if (name) auth.user.name = name;
        onLoginSuccess(auth.user);
      }
    } catch (e) {
      setErrorMessage(`Login failed: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Live Plate Check Handler
  const handleCheckPlate = async (e) => {
    e.preventDefault();
    if (!plateQuery.trim()) return;
    setCheckLoading(true);
    setCheckResult(null);

    const clean = plateQuery.trim().toUpperCase().replace(/\s+/g, '');
    const res = await checkPlateAuthorization(clean);

    if (res && res.authorized) {
      setCheckResult({
        authorized: true,
        plate: clean,
        owner: res.owner,
        role: res.role,
        department: res.department,
        message: 'Pre-authorized for automated barrier clearance.'
      });
    } else {
      setCheckResult({
        authorized: false,
        plate: clean,
        message: 'No active pass found. Please apply for a vehicle pass below.'
      });
    }
    setCheckLoading(false);
  };

  const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/?tab=settings&view=form` : '';

  return (
    <div style={{
      minHeight: '100%',
      width: '100%',
      maxWidth: '100%',
      backgroundColor: 'var(--bg-base)',
      color: 'var(--text-main)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* Background Decorative Ambient Gradients */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '20%',
        width: '600px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        top: '600px',
        right: '10%',
        width: '500px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* ============================================================ */}
      {/* TOP HEADER NAVIGATION BAR (Only for Unauthenticated Visitors) */}
      {/* ============================================================ */}
      {!currentUser && (
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(16px)',
          backgroundColor: 'var(--bg-card-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '14px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px'
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'var(--accent-primary)',
              color: 'var(--accent-primary-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
            }}>
              <ShieldCheck size={24} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
                  CampusGate AI
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-primary-text)'
                }}>
                  v2.4
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Madhav Institute of Technology & Science • Smart Ingress
              </div>
            </div>
          </div>

          {/* Center Section Jump Links */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-card)',
            padding: '4px 8px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)'
          }}>
            <a href="#overview" style={{ padding: '6px 12px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none' }}>
              About System
            </a>
            <a href="#capabilities" style={{ padding: '6px 12px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Capabilities
            </a>
            <a href="#guidelines" style={{ padding: '6px 12px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Gate Schedule
            </a>
            <a href="#qr-pass" style={{ padding: '6px 12px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none' }}>
              QR Registration
            </a>
            <button
              onClick={() => onNavigateTab && onNavigateTab('developer')}
              style={{
                background: 'none',
                border: 'none',
                padding: '6px 12px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                cursor: 'pointer',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Code2 size={13} />
              <span>Developers</span>
            </button>
          </nav>

          {/* Top Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => {
                const el = document.getElementById('login-card');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                padding: '9px 18px',
                borderRadius: '99px',
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-primary-text)',
                fontSize: '13px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <span>Sign In to Portal</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </header>
      )}

      {/* ============================================================ */}
      {/* HERO SECTION: Textual Project Details + Google Login Card    */}
      {/* ============================================================ */}
      <section id="overview" style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '1280px',
        margin: '0 auto',
        padding: currentUser ? '32px 32px 24px' : '54px 32px 48px',
        width: '100%',
        display: currentUser ? 'flex' : 'grid',
        flexDirection: currentUser ? 'column' : undefined,
        gridTemplateColumns: currentUser ? undefined : '1.25fr 1fr',
        gap: currentUser ? '24px' : '48px',
        alignItems: currentUser ? 'flex-start' : 'center'
      }}>
        {/* Main Hero Content */}
        <div style={{ width: '100%' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '5px 14px',
              borderRadius: '99px',
              fontSize: '11.5px',
              fontWeight: 800,
              color: 'var(--accent-primary)'
            }}>
              <Zap size={14} />
              <span>Autonomous Vision AI • Sub-Second Gate Barrier Clearance</span>
            </div>
          </div>

          <h1 style={{
            fontSize: currentUser ? '34px' : '40px',
            fontWeight: 900,
            lineHeight: 1.15,
            color: 'var(--text-main)',
            letterSpacing: '-0.8px',
            margin: '0 0 16px',
            maxWidth: currentUser ? '960px' : '640px'
          }}>
            Centralized Campus Vehicle Identification & Access Auditing
          </h1>

          <p style={{
            fontSize: '14.5px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: '0 0 28px',
            maxWidth: currentUser ? '960px' : '640px'
          }}>
            CampusGate is an intelligent deep-learning vehicle security platform designed for universities and high-throughput gated campuses. 
            Powered by custom-hardened <strong>YOLOv11 ANPR</strong> with sub-second plate OCR, electronic boom-barrier automation, 
            digital QR gate permits, and synchronized cross-camera corridor handoff tracking.
          </p>

          {/* 4 Feature Highlights in a responsive grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: currentUser ? 'repeat(auto-fit, minmax(210px, 1fr))' : 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px',
            marginBottom: '28px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              gap: '12px'
            }}>
              <Car size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>Indian HSRP OCR</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.4 }}>
                  Normalized plate detection with high resilience against dirt, tilt, and glare.
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              gap: '12px'
            }}>
              <ShieldCheck size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>&lt;200ms Barrier Lift</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.4 }}>
                  Automated ingress clearance for registered students, faculty, and campus staff.
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              gap: '12px'
            }}>
              <QrCode size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>Digital QR Permits</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.4 }}>
                  Self-service mobile application and dynamic scannable gate passes.
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              gap: '12px'
            }}>
              <ShieldCheck size={20} color="#8b5cf6" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>Campus Safety & Access Code</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.4 }}>
                  Enforcing 20 km/h speed limits, pedestrian rights of way, and registered vehicle parking zones.
                </div>
              </div>
            </div>
          </div>

          {/* Metric Badges */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span>95.1% Detection mAP50</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
              <span>1.4ms Edge Latency</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
              <span>61 Surveillance Streams Hardened</span>
            </div>
          </div>
        </div>

        {/* Right Column: Google Sign-In Card (Rendered ONLY if unauthenticated visitor) */}
        {!currentUser && (
          <div id="login-card" style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '24px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-elevated)',
            padding: '36px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            {/* Logo Badge */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-primary-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(37, 99, 235, 0.3)',
              marginBottom: '18px'
            }}>
              <ShieldCheck size={32} strokeWidth={2.4} />
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 6px' }}>
              Sign In to CampusGate
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: 1.4 }}>
              Authenticate with your institutional or Google Account to access your gate permits or security operations.
            </p>

            {/* Error Banner */}
            {errorMessage && (
              <div style={{
                width: '100%',
                backgroundColor: 'var(--color-crimson-bg)',
                border: '1px solid var(--color-crimson-border)',
                color: 'var(--color-crimson)',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '18px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Google Identity Services SDK Render Target (Only shown when GSI rendered) */}
            <div
              ref={googleBtnContainerRef}
              style={{
                marginBottom: gsiLoaded ? '14px' : '0px',
                minHeight: gsiLoaded ? '44px' : '0px',
                width: '100%',
                display: gsiLoaded ? 'flex' : 'none',
                justifyContent: 'center'
              }}
            />

            {/* Prominent Google Account Button - Shown strictly if GSI iframe is not rendered */}
            {!gsiLoaded && (
              <button
                onClick={handleTriggerGooglePopup}
                disabled={isLoading}
                style={{
                  width: '100%',
                  maxWidth: '360px',
                  padding: '14px 20px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--bg-card)',
                  border: '2px solid var(--border-medium)',
                  color: 'var(--text-main)',
                  fontSize: '14px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.15s ease'
                }}
              >
                {isLoading ? (
                  <span>Authenticating with Google...</span>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Sign in with Google Account</span>
                  </>
                )}
              </button>
            )}

            {/* Contributor Superadmin Banner */}
            <div style={{
              marginTop: '22px',
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: 'rgba(217, 119, 6, 0.08)',
              border: '1px solid rgba(217, 119, 6, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textAlign: 'left',
              width: '100%'
            }}>
              <Crown size={16} color="#d97706" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                <strong style={{ color: '#d97706' }}>Superadmin Whitelist:</strong> Project contributors logging in with their Google accounts automatically receive full Superadmin governance.
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* SECTION A: PUBLIC CAMPUS INGRESS GUIDELINES & GATE SCHEDULES */}
      {/* ============================================================ */}
      <section id="guidelines" style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '36px 32px 20px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Section Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--accent-primary)',
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            marginBottom: '8px'
          }}>
            <Compass size={14} />
            <span>Public Campus Transit Information</span>
          </div>
          <h3 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px' }}>
            Campus Gate Schedules & Operational Protocols
          </h3>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0, maxWidth: '780px', lineHeight: 1.5 }}>
            Automated boom barriers are synchronized with high-precision ANPR cameras at all institutional gates. Review entrance schedules and transit rules below.
          </p>
        </div>

        {/* 3 Gate Ingress Schedule Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '18px',
          marginBottom: '20px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Gate 1 */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: 'var(--shadow-card)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Gate 1 — Main Ingress
                  </h4>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Maharana Pratap Marg Entrance</div>
                </div>
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '99px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                24/7 OPEN
              </span>
            </div>

            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Primary gateway for all registered students, faculty, staff, and authorized institutional transport. Features sub-second YOLOv11 plate scan and auto-barrier lift.
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '11.5px',
              color: 'var(--text-muted)',
              paddingTop: '10px',
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} color="var(--accent-primary)" />
                <span>Operating Hours: <strong>Continuous (24 Hours / 7 Days)</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Car size={13} color="var(--accent-primary)" />
                <span>Clearance: <strong>Four-Wheelers & Two-Wheelers</strong></span>
              </div>
            </div>
          </div>

          {/* Gate 2 */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: 'var(--shadow-card)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Compass size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Gate 2 — Academic Corridor
                  </h4>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>West Quad & Hostel Transit</div>
                </div>
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '99px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                SCHEDULED
              </span>
            </div>

            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Dedicated transit for campus residents, hostelers, and academic department staff. Controlled entry with automatic digital curfew locking after 10:30 PM.
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '11.5px',
              color: 'var(--text-muted)',
              paddingTop: '10px',
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} color="var(--accent-primary)" />
                <span>Operating Hours: <strong>06:00 AM – 10:30 PM</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Car size={13} color="var(--accent-primary)" />
                <span>Clearance: <strong>Two-Wheelers & Pedestrian Members</strong></span>
              </div>
            </div>
          </div>

          {/* Gate 3 */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: 'var(--shadow-card)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Info size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Gate 3 — Service & Logistics
                  </h4>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sports Complex & Deliveries</div>
                </div>
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '99px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                DAYLIGHT ONLY
              </span>
            </div>

            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Heavy vehicle logistics, cafeteria vendor deliveries, campus maintenance, and temporary contractor entries with pass inspection.
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '11.5px',
              color: 'var(--text-muted)',
              paddingTop: '10px',
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} color="var(--accent-primary)" />
                <span>Operating Hours: <strong>08:00 AM – 07:00 PM</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Car size={13} color="var(--accent-primary)" />
                <span>Clearance: <strong>Vendor Trucks & Service Fleet</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Campus Traffic & Safety Code Grid */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          padding: '22px 26px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              🚗 Campus Speed Limit
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Strict <strong>20 km/h</strong> limit observed on all internal campus roads and pedestrian walkways.
            </div>
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              🪖 Safety Headgear & Belts
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Helmets mandatory for both rider and pillion; seatbelts enforced for four-wheelers.
            </div>
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              🅿️ Designated Parking Bays
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Park exclusively in marked Student, Faculty, or Visitor bays. Fire lanes must stay clear.
            </div>
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              🚨 24/7 Security Helpline
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Campus Security Control Desk: <strong>Ext. 100</strong> / Direct: <strong>+91 751 2409300</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION B: SELF-SERVICE QR PASS REGISTRATION HUB             */}
      {/* ============================================================ */}
      <section id="qr-pass" style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '36px 32px',
        width: '100%'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '20px',
          border: '1px solid var(--border-subtle)',
          padding: '32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '32px',
          alignItems: 'center',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* High-Contrast QR Code */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '16px',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <QRCodeSVG
              value={portalUrl || `${window.location.origin}/?tab=settings&view=form`}
              size={180}
              level="H"
              includeMargin={false}
            />
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#475569', marginTop: '10px', textTransform: 'uppercase' }}>
              Scan from Mobile Phone
            </div>
          </div>

          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#10b981',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              marginBottom: '10px'
            }}>
              <QrCode size={14} />
              <span>Instant Digital Pass Application</span>
            </div>

            <h3 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 10px' }}>
              Apply for Vehicle Gate Clearance
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 20px', maxWidth: '640px' }}>
              Students and faculty members can register their two-wheelers and cars in the campus ANPR vision database. 
              Simply scan this QR code with your mobile camera to fill out your pass request, or click below to open the application portal directly on this device.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  handleDirectLogin('student@mits.ac.in', 'Campus Student', 'user');
                }}
                style={{
                  padding: '12px 22px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-primary-text)',
                  fontSize: '13px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                <Smartphone size={16} />
                <span>Open Pass Portal on This Device</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION C: HOW CAMPUSGATE WORKS (3 CORE PILLARS)             */}
      {/* ============================================================ */}
      <section id="capabilities" style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '36px 32px 48px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: '30px', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 8px' }}>
            System Architecture & Vision AI Pipeline
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            End-to-end multi-camera vehicle identification, spatial tracking, and electronic gate barrier actuation.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            padding: '24px'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Eye size={20} />
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 8px' }}>
              1. Keyframe Harvest & YOLO Detection
            </h4>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              CCTV RTSP streams are continuously sampled at high frame rates. Hardened YOLOv11 detectors locate vehicles and license plates with 95.1% mAP50 in 1.4ms.
            </p>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            padding: '24px'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Cpu size={20} />
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 8px' }}>
              2. Indian Plate Normalizer & OCR
            </h4>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Custom OCR pipeline normalizes Indian standard and High Security Registration Plates (HSRP), resolving character ambiguities (O/0, I/1, B/8).
            </p>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            padding: '24px'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(217, 119, 6, 0.12)',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Activity size={20} />
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 8px' }}>
              3. Barrier Control & Corridor Handoff
            </h4>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Automated boom barrier unlocks instantaneously for pre-authorized vehicles. Downstream corridor cameras reconcile vehicles and alert on unlisted traffic.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION D: PROJECT CONTRIBUTORS & SUPERADMINS                */}
      {/* ============================================================ */}
      <section id="contributors" style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '36px 32px 64px',
        width: '100%'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '20px',
          border: '1px solid var(--border-subtle)',
          padding: '36px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Crown size={20} color="#d97706" />
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Project Contributors & Architectural Team
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab && onNavigateTab('developer')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '999px',
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-primary-text)',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <Code2 size={14} />
              <span>Open Developer Directory (/developer)</span>
              <ArrowRight size={14} />
            </button>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 24px' }}>
            CampusGate was conceptualized and developed at Madhav Institute of Technology & Science. The contributors below possess permanent Superadmin authorization.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle)',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 800
              }}>
                AG
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>Arin Gupta</div>
                <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 700 }}>Lead Architect & Backend</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>24cd10ar15@mitsgwl.ac.in</div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle)',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981, #047857)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 800
              }}>
                VC
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>Vivek Chaurasiya</div>
                <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 700 }}>Core Contributor & AI Pipeline</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>vivekchaurasiya943@gmail.com</div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle)',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 800
              }}>
                SB
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>Sarvesh Baghel</div>
                <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 700 }}>Core Contributor & Operations</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>sarveshsingh8462@gmail.com</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FOOTER                                                       */}
      {/* ============================================================ */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-card-subtle)',
        padding: '24px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'var(--text-muted)',
        marginTop: 'auto'
      }}>
        <div>
          © 2026 CampusGate AI • Department of Computer Science & Information Technology, MITS Gwalior.
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>YOLOv11 ANPR Model v2.4</span>
          <span>•</span>
          <span>Google Identity Services 2.0</span>
          <span>•</span>
          <span>FastAPI Real-Time WebSocket</span>
        </div>
      </footer>
    </div>
  );
}
