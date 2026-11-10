import React, { useState, useEffect, useRef } from 'react';
import Avatar from './Avatar';
import {
  ShieldCheck,
  Shield,
  UserCheck,
  Crown,
  Sparkles,
  CheckCircle2,
  X,
  ExternalLink,
  Code2,
  Users
} from 'lucide-react';
import { loginWithOAuth } from '../services/api';

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser
}) {
  const [loadingRole, setLoadingRole] = useState(null);
  const [customEmail, setCustomEmail] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const googleBtnRef = useRef(null);

  // Fetch backend Google OAuth config on mount/open
  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch('/api/auth/config');
        if (res.ok) {
          const data = await res.json();
          if (data.google_client_id && !data.google_client_id.includes('YOUR_GOOGLE_CLIENT_ID')) {
            setGoogleClientId(data.google_client_id);
          }
        }
      } catch (e) {
        console.warn('Could not load auth config in AuthModal:', e);
      }
    }
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  // Official Project Contributors explicitly granted Superadmin
  const CONTRIBUTORS = [
    {
      name: 'Arin Gupta',
      email: '24cd10ar15@mitsgwl.ac.in',
      role: 'admin',
      is_superadmin: true,
      title: 'Lead Architect & CV Systems',
      avatar: 'https://algo.mitsgwalior.in/assets/arin-8TawvVYl.png'
    },
    {
      name: 'Vivek Chaurasiya',
      email: 'vivekchaurasiya943@gmail.com',
      role: 'admin',
      is_superadmin: true,
      title: 'Core Contributor & AI Pipeline',
      avatar: 'https://algo.mitsgwalior.in/assets/vivek-zknvPYE4.png'
    },
    {
      name: 'Sarvesh Baghel',
      email: 'sarveshsingh8462@gmail.com',
      role: 'admin',
      is_superadmin: true,
      title: 'Core Contributor & Operations',
      avatar: '/assets/sarvesh.png'
    }
  ];

  useEffect(() => {
    // If Google Identity Services SDK is loaded, initialize official button
    if (isOpen && googleClientId && window.google?.accounts?.id && googleBtnRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            if (response.credential) {
              handleOfficialGoogleCallback(response.credential);
            }
          }
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with',
          shape: 'rectangular'
        });
      } catch (e) {
        console.warn('Google Identity initialization fallback:', e);
      }
    }
  }, [isOpen, googleClientId]);

  if (!isOpen) return null;

  const handleOfficialGoogleCallback = async (googleJwt) => {
    setLoadingRole('google');
    try {
      const res = await fetch('/api/auth/oauth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: googleJwt })
      });
      if (res.ok) {
        const data = await res.json();
        onLoginSuccess(data.user);
        onClose();
      }
    } catch (err) {
      console.error('Google verification error:', err);
    } finally {
      setLoadingRole(null);
    }
  };

  const handleOAuthSignIn = async (role = 'user', email = null, name = null) => {
    setLoadingRole(role);
    try {
      const auth = await loginWithOAuth('google', email, role);
      if (auth && auth.user) {
        if (name) auth.user.name = name;
        onLoginSuccess(auth.user);
        onClose();
      }
    } catch (err) {
      console.error('Sign-in error:', err);
    } finally {
      setLoadingRole(null);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const clean = customEmail.trim().toLowerCase();
    const isSuper = CONTRIBUTORS.some(c => c.email.toLowerCase() === clean);
    handleOAuthSignIn(isSuper ? 'admin' : 'user', clean);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '24px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-elevated)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh'
      }}>
        {/* Header */}
        <div style={{
          padding: '22px 26px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-card-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-primary-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-card)'
            }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Official Google Authentication
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                CampusGate Identity Services & Superadmin Access
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          {/* Official Google OAuth Sign-in Button */}
          <div>
            <div ref={googleBtnRef} style={{ marginBottom: '8px' }} />

            <button
              onClick={() => handleOAuthSignIn('user')}
              disabled={loadingRole !== null}
              style={{
                width: '100%',
                padding: '13px 18px',
                borderRadius: '14px',
                backgroundColor: 'var(--bg-card)',
                border: '1.5px solid var(--border-medium)',
                color: 'var(--text-main)',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-card)',
                transition: 'all 0.15s ease'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{loadingRole === 'google' ? 'Authenticating with Google...' : 'Sign In with Google Account'}</span>
            </button>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
              Standard campus accounts register automatically as Student / Resident.
            </p>
          </div>

          {/* Section Divider: Project Contributors & Superadmins */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#d97706',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <Crown size={14} />
              Project Contributors (Explicit Superadmins)
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
          </div>

          {/* Explicit Contributor Superadmin Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {CONTRIBUTORS.map((c) => (
              <div
                key={c.email}
                onClick={() => handleOAuthSignIn('admin', c.email, c.name)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--bg-card-subtle)',
                  border: '1.5px solid rgba(217, 119, 6, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar user={c} size={38} borderRadius={10} style={{ border: '2px solid #d97706' }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                        {c.name}
                      </span>
                      <Crown size={13} color="#d97706" />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {c.email}
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(217, 119, 6, 0.12)',
                  border: '1px solid rgba(217, 119, 6, 0.4)',
                  color: '#d97706',
                  fontSize: '10px',
                  fontWeight: 900,
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase'
                }}>
                  👑 SUPERADMIN
                </div>
              </div>
            ))}
          </div>

          {/* Section Divider: Gate Officer & Staff Personas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Or Switch Persona for Demo
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
          </div>

          {/* Demo Persona Shortcuts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => handleOAuthSignIn('guard', 'guard@campusgate.edu', 'Officer Rajesh')}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-main)',
                textAlign: 'left'
              }}
            >
              <ShieldCheck size={16} color="var(--color-amber)" />
              <div>
                <div>Officer Rajesh</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Gate Guard</div>
              </div>
            </button>

            <button
              onClick={() => handleOAuthSignIn('user', 'student@campusgate.edu', 'Arin Gupta')}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-main)',
                textAlign: 'left'
              }}
            >
              <UserCheck size={16} color="var(--color-emerald)" />
              <div>
                <div>Arin Gupta</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Resident / Student</div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 26px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-card-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--text-muted)'
        }}>
          <span>Official Google Identity Services</span>
          <span>Explicit Contributor RBAC Active</span>
        </div>
      </div>
    </div>
  );
}
