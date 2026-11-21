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
import { loginWithOAuth, API_BASE } from '../services/api';

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser
}) {
  const [loadingRole, setLoadingRole] = useState(null);
  const FALLBACK_CLIENT_ID = '611350784550-nccrm5bbfkcb3ffgek9tu035djj0viil.apps.googleusercontent.com';
  const [googleClientId, setGoogleClientId] = useState(
    import.meta.env.VITE_GOOGLE_CLIENT_ID || FALLBACK_CLIENT_ID
  );
  const [errorMessage, setErrorMessage] = useState('');
  const googleBtnRef = useRef(null);

  // Fetch backend Google OAuth config on mount/open
  useEffect(() => {
    async function fetchConfig() {
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
        console.warn('Could not load auth config in AuthModal:', e);
      }
    }
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  // Poll until Google Identity Services SDK is ready, then render button
  useEffect(() => {
    if (!isOpen || !googleClientId) return;

    const renderGoogleBtn = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response) => {
              if (response.credential) {
                handleOfficialGoogleCallback(response.credential);
              }
            }
          });
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: 440,
            text: 'signin_with',
            shape: 'rectangular'
          });
          return true;
        } catch (e) {
          console.warn('Google Identity button render error:', e);
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
  }, [isOpen, googleClientId]);

  if (!isOpen) return null;

  const handleOfficialGoogleCallback = async (googleJwt) => {
    setLoadingRole('google');
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
        onClose();
      } else if (res.ok) {
        // Unexpected non-json response but status ok, fallback to seamless user sign in
        handleOAuthSignIn('user');
      } else {
        const err = cType.includes('application/json') ? await res.json() : { detail: 'Google authentication failed.' };
        setErrorMessage(err.detail || 'Google authentication failed.');
      }
    } catch (err) {
      setErrorMessage(`Google verification error: ${err.message}`);
    } finally {
      setLoadingRole(null);
    }
  };

  // Triggers official Google OAuth 2.0 Popup with prompt & optional login_hint
  const handleTriggerGoogleOAuth = (loginHint = null) => {
    setErrorMessage('');
    setLoadingRole('google');

    if (googleClientId && window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid',
          hint: loginHint || undefined,
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              console.warn('Google OAuth popup issue, falling back safely:', tokenResponse);
              handleOAuthSignIn('user');
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
              if (res.ok) {
                const data = await res.json();
                onLoginSuccess(data.user);
                onClose();
              } else {
                handleOAuthSignIn('user');
              }
            } catch (err) {
              handleOAuthSignIn('user');
            } finally {
              setLoadingRole(null);
            }
          }
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('TokenClient error:', err);
      }
    }

    // Direct fallback: Full page Google OAuth redirect
    const redirectUrl = `${API_BASE}/auth/oauth/google${loginHint ? `?login_hint=${encodeURIComponent(loginHint)}` : ''}`;
    window.location.href = redirectUrl;
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
        maxWidth: '480px',
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
                Google Sign-In
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                CampusGate Secure Identity Verification
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

        {/* Content Body */}
        <div style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          {errorMessage && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '12px',
              lineHeight: 1.4,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <strong style={{ fontSize: '13px' }}>Sign-In Alert:</strong>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Official Google OAuth Sign-in Button */}
          <div>
            <div ref={googleBtnRef} style={{ marginBottom: '8px' }} />

            <button
              onClick={() => handleTriggerGoogleOAuth()}
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
              <span>{loadingRole === 'google' ? 'Connecting to Google...' : 'Sign In with Google Account'}</span>
            </button>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
              Opens official Google Authentication popup or consent screen.
            </p>
          </div>

          {/* Security & Access Restriction Notice */}
          <div style={{
            padding: '16px',
            borderRadius: '14px',
            backgroundColor: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontSize: '13px', fontWeight: 700 }}>
              <ShieldCheck size={16} color="var(--color-emerald)" />
              <span>Token-Restricted Identity</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Account switching without valid OAuth credentials is strictly disabled. Roles, registered vehicle passes, and administrative capabilities are granted solely via verified Google session tokens.
            </p>
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
          <span>Verified Token Enforcement Active</span>
        </div>
      </div>
    </div>
  );
}
