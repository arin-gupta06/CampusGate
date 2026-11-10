import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  Car,
  ShieldCheck,
  Calendar,
  Building,
  Mail,
  Edit3,
  QrCode,
  Download,
  Share2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { MOCK_ALL_USERS } from '../services/api';

export default function UserProfileView({
  currentUser: propUser,
  onBackToHome,
  onNavigateToSettings
}) {
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);

  // If a real logged-in user is provided, build their official profile, otherwise allow demo switching
  const currentUser = propUser ? {
    id: propUser.id || 'usr-me',
    name: propUser.name || 'Campus Member',
    role: propUser.role === 'admin' ? 'Security Administrator' : propUser.role === 'guard' ? 'Gate Security Officer' : 'Campus Resident',
    userType: propUser.role === 'admin' ? 'ADMIN' : propUser.role === 'guard' ? 'GUARD' : 'STUDENT',
    department: propUser.department || 'Computer Science & Engineering',
    email: propUser.email || 'user@mits.ac.in',
    phone: propUser.phone || '+91 98260 12345',
    vehicles: propUser.vehicles && propUser.vehicles.length > 0 ? propUser.vehicles : ['MP07AB1234'],
    vehicleType: 'Car (Pass Cleared)',
    passStatus: 'Active Clearance',
    validTill: '31 Dec 2026',
    semester: propUser.is_superadmin ? 'Superadmin Operator' : 'Verified Resident Permit',
    rollNumber: propUser.google_id ? `GID-${String(propUser.google_id).slice(-6)}` : '0101CS221045',
    initials: (propUser.name || 'CR').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  } : (MOCK_ALL_USERS[selectedUserIndex] || MOCK_ALL_USERS[0]);

  const qrDataPayload = JSON.stringify({
    passId: `CG-PASS-${currentUser.rollNumber}`,
    name: currentUser.name,
    plate: currentUser.vehicles?.[0] || 'MP07AB1234',
    status: 'AUTHORIZED',
    validTill: currentUser.validTill,
    issuedBy: 'CampusGate Security Council'
  });

  return (
    <div style={{
      maxWidth: '860px',
      margin: '0 auto',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onBackToHome}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>

        {!propUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Demo Profile:</span>
            <select
              value={selectedUserIndex}
              onChange={(e) => setSelectedUserIndex(parseInt(e.target.value))}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                color: 'var(--text-main)'
              }}
            >
              {MOCK_ALL_USERS.map((u, i) => (
                <option key={u.id} value={i}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* =========================================================
          OFFICIAL DIGITAL SMART GATE PASS (QR BADGE CARD)
         ========================================================= */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '20px',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-elevated)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Pass Top Ribbon */}
        <div style={{
          backgroundColor: 'var(--accent-primary)',
          color: 'var(--accent-primary-text)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={22} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                CampusGate Official Digital Pass
              </div>
              <div style={{ fontSize: '11px', opacity: 0.85 }}>
                Madhav Institute of Technology & Science • Security Division
              </div>
            </div>
          </div>

          <div style={{
            fontSize: '11px',
            fontWeight: 800,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            padding: '4px 10px',
            borderRadius: '99px',
            textTransform: 'uppercase',
            letterSpacing: '0.4px'
          }}>
            RFID & OCR Linked
          </div>
        </div>

        {/* Pass Content Body: Split Left (Details) & Right (Large QR Code) */}
        <div style={{
          padding: '28px',
          display: 'grid',
          gridTemplateColumns: '1fr 220px',
          gap: '28px',
          alignItems: 'center'
        }}>
          {/* Left Details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 800,
                color: '#fff',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}>
                {currentUser.initials}
              </div>

              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {currentUser.name}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {currentUser.role} • {currentUser.department}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  ID: {currentUser.rollNumber}
                </div>
              </div>
            </div>

            {/* Quick Badge Metadata Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              backgroundColor: 'var(--bg-card-subtle)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Vehicle License Plate</div>
                <div className="plate-number" style={{ fontSize: '15px', color: 'var(--accent-primary)', marginTop: '2px' }}>
                  {currentUser.vehicles?.[0] || 'MP07AB1234'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Clearance Status</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-emerald)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={14} />
                  <span>{currentUser.passStatus}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Valid Until</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                  {currentUser.validTill}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Permit Category</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                  {currentUser.semester}
                </div>
              </div>
            </div>
          </div>

          {/* Right: High-Res Scannable QR Pass */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            padding: '18px',
            borderRadius: '16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0'
          }}>
            <QRCodeSVG
              value={qrDataPayload}
              size={160}
              level="H"
              includeMargin={false}
            />
            <div style={{
              fontSize: '10px',
              fontWeight: 800,
              color: '#475569',
              marginTop: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              textAlign: 'center'
            }}>
              Scan at Gate Scanner
            </div>
            <div style={{
              fontSize: '9px',
              color: '#94a3b8',
              fontFamily: 'monospace',
              marginTop: '2px'
            }}>
              ID: {currentUser.rollNumber}
            </div>
          </div>
        </div>

        {/* Pass Footer Action */}
        <div style={{
          backgroundColor: 'var(--bg-card-subtle)',
          padding: '14px 28px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Need to register a new vehicle or update pass validity?
          </div>
          <button
            onClick={onNavigateToSettings}
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-primary-text)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Edit3 size={14} />
            <span>Apply / Update Vehicle Pass</span>
          </button>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '14px'
      }}>
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
            <Building size={14} color="#3b82f6" />
            <span>Department</span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
            {currentUser.department}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
            <Car size={14} color="#10b981" />
            <span>Permit Type</span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
            {currentUser.vehicleType}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
            <Mail size={14} color="#8b5cf6" />
            <span>Verified Email</span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentUser.email}
          </div>
        </div>
      </div>
    </div>
  );
}
