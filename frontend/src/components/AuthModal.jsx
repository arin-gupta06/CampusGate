import React, { useState, useEffect, useRef } from 'react';
import Avatar from './Avatar';
import {
  ShieldCheck,
  CheckCircle2,
  X,
  LogOut,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { API_BASE } from '../services/api';

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onSignOut,
  currentUser
}) {
  const [loadingRole, setLoadingRole] = useState(null);
  const FALLBACK_CLIENT_ID = '611350784550-nccrm5bbfkcb3ffgek9tu035djj0viil.apps.googleusercontent.com';
  const [googleClientId, setGoogleClientId] = useState(
    import.meta.env.VITE_GOOGLE_CLIENT_ID || FALLBACK_CLIENT_ID
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [isSdkRendered, setIsSdkRendered] = useState(false);
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

  // Render Google Identity Services button if available
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
            width: 380,
            text: 'signin_with',
            shape: 'rectangular'
          });
          setIsSdkRendered(true);
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
      const timeout = setTimeout(() => clearInterval(interval), 5000);
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

  // Triggers official Google OAuth 2.0 Popup
  const handleTriggerGoogleOAuth = () => {
    setErrorMessage('');
    setLoadingRole('google');

    if (googleClientId && window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              setErrorMessage('Google authorization was cancelled or failed.');
              setLoadingRole(null);
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
                setErrorMessage('Unable to register session with backend.');
              }
            } catch (err) {
              setErrorMessage(`Google verification error: ${err.message}`);
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
    window.location.href = `${API_BASE}/auth/oauth/google`;
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '20px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-elevated)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-card-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-primary-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-card)'
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                {currentUser ? 'Active Account Session' : 'Institutional Sign-In'}
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                {currentUser ? 'You are currently authenticated' : 'CampusGate Identity Verification'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMessage && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#ef4444',
              fontSize: '12px',
              lineHeight: 1.4
            }}>
              <strong>Sign-In Alert:</strong> {errorMessage}
            </div>
          )}

          {/* CASE 1: User is ALREADY Logged In */}
          {currentUser ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '14px',
                backgroundColor: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)'
              }}>
                <Avatar user={currentUser} size={42} borderRadius={10} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentUser.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentUser.email}
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '10px', fontWeight: 800, color: 'var(--color-emerald)', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                    <CheckCircle2 size={11} />
                    <span>Active Clearance ({currentUser.role.toUpperCase()})</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={onClose}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-primary-text)',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Continue as {currentUser.name}
                </button>

                <button
                  onClick={handleTriggerGoogleOAuth}
                  disabled={loadingRole !== null}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={14} className={loadingRole === 'google' ? 'spin' : ''} />
                  <span>Switch to Another Google Account</span>
                </button>

                {onSignOut && (
                  <button
                    onClick={() => {
                      onSignOut();
                      onClose();
                    }}
                    style={{
                      width: '100%',
                      padding: '9px',
                      borderRadius: '10px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'var(--color-crimson)',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      marginTop: '4px'
                    }}
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* CASE 2: User is NOT Logged In - Clean Single Google Button */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
              <div
                ref={googleBtnRef}
                style={{
                  display: isSdkRendered ? 'flex' : 'none',
                  justifyContent: 'center',
                  width: '100%'
                }}
              />

              {!isSdkRendered && (
                <button
                  onClick={handleTriggerGoogleOAuth}
                  disabled={loadingRole !== null}
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    borderRadius: '12px',
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
                    boxShadow: 'var(--shadow-card)'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{loadingRole === 'google' ? 'Connecting to Google...' : 'Sign In with Google Account'}</span>
                </button>
              )}

              <p style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                margin: 0,
                textAlign: 'center',
                lineHeight: 1.4
              }}>
                🔒 Single Sign-On powered by MITS Official Google Workspace.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
