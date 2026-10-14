import React, { useState } from 'react';
import {
  X,
  ArrowLeft,
  Car,
  ShieldCheck,
  AlertTriangle,
  Clock,
  MapPin,
  User,
  CheckCircle,
  FileText,
  Camera,
  ExternalLink
} from 'lucide-react';

export default function VehicleDetailsModal({ vehicle, onClose, onTrackOnMap }) {
  const [activeTab, setActiveTab] = useState('movement'); // 'movement', 'images', 'audit'

  if (!vehicle) return null;

  const isVerified = vehicle.entry_status === 'AUTHORIZED';
  const isAlert = vehicle.entry_status === 'FLAGGED_UNLISTED' || vehicle.entry_status === 'BLACKLISTED';

  const snapshots = [
    { camera: 'Gate 1 - Main Entry', time: '10:42:15 AM', image: '/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png' },
    { camera: 'Campus Road', time: '10:45:22 AM', image: '/assets/ChatGPT Image Sep 27, 2026, 11_17_25 AM.png' },
    { camera: 'Parking Area', time: '10:48:10 AM', image: '/assets/ChatGPT Image Sep 27, 2026, 11_19_51 AM.png' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '1080px',
        maxWidth: '96vw',
        maxHeight: '92vh',
        backgroundColor: '#0a0f1d',
        borderRadius: '18px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Top Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0c1324'
        }}>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'transparent',
              color: '#94a3b8',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Live View</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Vehicle ID:</span>
            <span style={{ fontSize: '13px', color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>{vehicle.id}</span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              color: '#94a3b8',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '24px'
        }}>
          {/* Left: High-Res Crop with Bounding Box Overlay */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              position: 'relative',
              borderRadius: '14px',
              overflow: 'hidden',
              backgroundColor: '#000',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              aspectRatio: '4/3'
            }}>
              <img
                src={vehicle.image_url}
                alt={vehicle.plate_number}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />

              {/* Glowing Green Plate Bounding Box */}
              <div style={{
                position: 'absolute',
                bottom: '26%',
                left: '38%',
                width: '24%',
                height: '12%',
                border: '2px solid #10b981',
                borderRadius: '6px',
                boxShadow: '0 0 16px rgba(16, 185, 129, 0.6), inset 0 0 8px rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{
                  backgroundColor: 'rgba(0,0,0,0.85)',
                  color: '#10b981',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '3px',
                  letterSpacing: '1px',
                  border: '1px solid #10b981'
                }}>
                  {vehicle.plate_number}
                </span>
              </div>

              {/* Timestamp Badge */}
              <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: '#fff'
              }}>
                Captured: {new Date(vehicle.first_seen_at).toLocaleTimeString()}
              </div>
            </div>

            {/* Captured Multi-Camera Snapshots Row */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '10px' }}>
                Captured CCTV Snapshots
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {snapshots.map((snap, i) => (
                  <div key={i} style={{
                    backgroundColor: '#111827',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <img src={snap.image} alt={snap.camera} style={{ width: '100%', height: '70px', objectFit: 'cover' }} />
                    <div style={{ padding: '6px 8px', fontSize: '11px' }}>
                      <div style={{ color: '#f1f5f9', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {snap.camera}
                      </div>
                      <div style={{ color: '#64748b', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                        {snap.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Vehicle Details & Specification Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              backgroundColor: '#0f172a',
              borderRadius: '14px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              {/* Status Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                {isVerified ? (
                  <span style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '99px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <ShieldCheck size={14} />
                    VERIFIED
                  </span>
                ) : (
                  <span style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '99px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <AlertTriangle size={14} />
                    ALERT / UNLISTED
                  </span>
                )}

                <span style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Car size={15} />
                  {vehicle.vehicle_type || 'Car'}
                </span>
              </div>

              {/* Giant Plate Header */}
              <div style={{
                fontSize: '28px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                color: '#f8fafc',
                letterSpacing: '2px',
                marginBottom: '18px'
              }}>
                {vehicle.plate_number}
              </div>

              {/* Data Table */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontSize: '13px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Owner Name</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{vehicle.owner_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Associated With</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{vehicle.associated_person}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Make / Model</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{vehicle.make_model}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Color</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{vehicle.color}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Entry Time</span>
                  <span style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>10:42:15 AM</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Gate</span>
                  <span style={{ color: '#e2e8f0' }}>{vehicle.camera_name || 'Gate 1 - Main Entry'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
                  <span style={{ color: '#64748b' }}>Status</span>
                  <span style={{ color: isVerified ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                    {isVerified ? 'Authorized' : 'Review Needed'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    onTrackOnMap(vehicle);
                    onClose();
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <MapPin size={15} />
                  <span>View Full Movement</span>
                </button>
              </div>
            </div>

            {/* Movement Timeline Card */}
            <div style={{
              backgroundColor: '#0f172a',
              borderRadius: '14px',
              padding: '18px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
                Reconciled Movement History
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {vehicle.timeline?.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      backgroundColor: idx === 0 ? '#10b981' : '#38bdf8',
                      marginTop: '4px',
                      boxShadow: `0 0 8px ${idx === 0 ? '#10b981' : '#38bdf8'}`
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: '#f8fafc', fontWeight: 600 }}>{step.location}</span>
                        <span style={{ color: '#64748b', fontFamily: 'var(--font-mono)' }}>{step.time}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        {step.action}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
