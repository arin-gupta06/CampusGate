import React, { useState } from 'react';
import {
  ArrowLeft,
  Car,
  Bike,
  ShieldCheck,
  Calendar,
  Building,
  GraduationCap,
  Clock,
  Phone,
  Mail,
  CheckCircle,
  FileText,
  Edit3
} from 'lucide-react';
import { MOCK_ALL_USERS } from '../services/api';

export default function UserProfileView({ onBackToHome, onNavigateToSettings }) {
  // Allow user to select from available profiles or default to Arin Gupta
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const currentUser = MOCK_ALL_USERS[selectedUserIndex] || MOCK_ALL_USERS[0];

  return (
    <div style={{
      maxWidth: '960px',
      margin: '0 auto',
      padding: '30px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Navigation Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onBackToHome}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            color: '#94a3b8',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>

        {/* Profile Switcher for demo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Switch Demo Profile:</span>
          <select
            value={selectedUserIndex}
            onChange={(e) => setSelectedUserIndex(parseInt(e.target.value))}
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              color: '#f8fafc'
            }}
          >
            {MOCK_ALL_USERS.map((u, i) => (
              <option key={u.id} value={i}>
                {u.name} ({u.role} — {u.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div style={{
        backgroundColor: '#0f172a',
        borderRadius: '20px',
        padding: '28px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 800,
            color: '#fff',
            boxShadow: '0 0 24px rgba(37, 99, 235, 0.4)'
          }}>
            {currentUser.initials}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                {currentUser.name}
              </h2>
              <span style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: '99px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <ShieldCheck size={14} />
                {currentUser.passStatus}
              </span>
            </div>

            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              {currentUser.role} • {currentUser.semester} • Roll: <strong style={{ color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{currentUser.rollNumber}</strong>
            </div>
          </div>
        </div>

        <button
          onClick={onNavigateToSettings}
          style={{
            backgroundColor: '#1e293b',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '10px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Edit3 size={15} />
          <span>Update Vehicle / Details</span>
        </button>
      </div>

      {/* User Details Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px'
      }}>
        {/* Branch / Department */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
            <Building size={16} color="#3b82f6" />
            <span>Branch / Department</span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
            {currentUser.department}
          </div>
        </div>

        {/* Number of Vehicles */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
            <Car size={16} color="#10b981" />
            <span>Registered Vehicles</span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
            {currentUser.vehicles?.length || 0} Registered Pass
          </div>
        </div>

        {/* Vehicle License Plate */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
            <ShieldCheck size={16} color="#38bdf8" />
            <span>Vehicle Number (Plate)</span>
          </div>
          <div className="plate-number" style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8' }}>
            {currentUser.vehicles?.join(', ') || 'No vehicle registered'}
          </div>
        </div>

        {/* Vehicle Type & Model */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
            <Car size={16} color="#f59e0b" />
            <span>Vehicle Model / Type</span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
            {currentUser.vehicleType}
          </div>
        </div>

        {/* Contact Email & Phone */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
            <Mail size={16} color="#8b5cf6" />
            <span>Email & Phone</span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
            {currentUser.email}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {currentUser.phone}
          </div>
        </div>

        {/* Pass Validity Expiry */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
            <Calendar size={16} color="#10b981" />
            <span>Pass Expiry Validity</span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
            {currentUser.validTill}
          </div>
        </div>
      </div>

      {/* Recent Entry Audit History For This Profile */}
      <div style={{
        backgroundColor: '#0f172a',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            Recent Gate Activity for {currentUser.vehicles?.[0] || 'Member'}
          </h3>
          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
            ● RFID / Vision AI Active
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            backgroundColor: '#111827',
            borderRadius: '10px',
            padding: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981'
              }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                  Gate 1 - Main Entry (Ingress)
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Camera #1 line-crossing triggered • Barrier auto-lifted
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>
                Today, 10:42:15 AM
              </div>
              <span style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                AUTHORIZED
              </span>
            </div>
          </div>

          <div style={{
            backgroundColor: '#111827',
            borderRadius: '10px',
            padding: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                boxShadow: '0 0 8px #3b82f6'
              }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                  Campus Road Corridor (Transit)
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Handoff verified in 42 seconds (speed: 24 km/h)
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>
                Today, 10:45:22 AM
              </div>
              <span style={{
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                NORMAL TRANSIT
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
