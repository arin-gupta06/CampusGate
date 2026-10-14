import React, { useState } from 'react';
import {
  AlertTriangle,
  Filter,
  Eye,
  ShieldAlert,
  Clock,
  CheckCircle,
  Radio,
  Camera,
  XCircle,
  BellRing
} from 'lucide-react';

export default function EventsView({ events, onResolveEvent }) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState(events[0] || null);

  const filtered = events.filter(e => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'ALERTS') return e.severity === 'high' || e.severity === 'critical';
    if (activeFilter === 'UNKNOWN') return e.type === 'Unknown';
    if (activeFilter === 'SUSPICIOUS') return e.type === 'Suspicious';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
          Alerts & Security Events
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
          Real-time incident audit and unlisted vehicle intercept log
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          backgroundColor: '#0f172a',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            onClick={() => setActiveFilter('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: activeFilter === 'ALL' ? '#1e293b' : 'transparent',
              color: activeFilter === 'ALL' ? '#38bdf8' : '#94a3b8'
            }}
          >
            All Events ({events.length})
          </button>
          <button
            onClick={() => setActiveFilter('ALERTS')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: activeFilter === 'ALERTS' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
              color: activeFilter === 'ALERTS' ? '#ef4444' : '#94a3b8'
            }}
          >
            Alerts
          </button>
          <button
            onClick={() => setActiveFilter('UNKNOWN')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: activeFilter === 'UNKNOWN' ? '#1e293b' : 'transparent',
              color: activeFilter === 'UNKNOWN' ? '#f59e0b' : '#94a3b8'
            }}
          >
            Unknown Vehicles
          </button>
          <button
            onClick={() => setActiveFilter('SUSPICIOUS')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: activeFilter === 'SUSPICIOUS' ? '#1e293b' : 'transparent',
              color: activeFilter === 'SUSPICIOUS' ? '#f59e0b' : '#94a3b8'
            }}
          >
            Suspicious
          </button>
        </div>
      </div>

      {/* Main Grid: Table (Left) + Event Preview Drawer (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.6fr 1fr',
        gap: '20px'
      }}>
        {/* Table of Events */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: '#0c1220'
              }}>
                <th style={{ padding: '14px 16px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Time</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Vehicle No.</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Camera</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Image</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((evt) => {
                const isSelected = selectedEvent?.id === evt.id;
                return (
                  <tr
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      fontSize: '12px',
                      backgroundColor: isSelected ? '#162238' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                      {evt.time}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                      {evt.vehicle_no}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        backgroundColor: evt.type === 'Blacklisted' ? 'rgba(239, 68, 68, 0.2)' : evt.type === 'Unknown' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                        color: evt.type === 'Blacklisted' ? '#ef4444' : evt.type === 'Unknown' ? '#f59e0b' : '#a5b4fc',
                        padding: '2px 8px',
                        borderRadius: '99px',
                        fontSize: '10px',
                        fontWeight: 700
                      }}>
                        {evt.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                      {evt.camera}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        color: evt.status === 'Open' ? '#10b981' : evt.status === 'Blocked' ? '#ef4444' : '#f59e0b',
                        fontWeight: 600
                      }}>
                        {evt.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{
                        width: '38px',
                        height: '28px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        backgroundColor: '#1e293b'
                      }}>
                        <img src={evt.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <span style={{ color: '#38bdf8', fontWeight: 600, fontSize: '11px' }}>
                        View
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Event Preview Sidebar */}
        {selectedEvent && (
          <div style={{
            backgroundColor: '#0f172a',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
              Event Preview
            </div>

            {/* Photo Crop */}
            <div style={{
              borderRadius: '10px',
              overflow: 'hidden',
              backgroundColor: '#000',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative',
              aspectRatio: '16/10'
            }}>
              <img
                src={selectedEvent.image_url}
                alt={selectedEvent.vehicle_no}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.9)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '4px',
                letterSpacing: '0.4px'
              }}>
                {selectedEvent.type.toUpperCase()} VEHICLE
              </div>
            </div>

            {/* Event Specs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{
                fontSize: '20px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                color: '#f8fafc',
                letterSpacing: '1px',
                marginTop: '4px'
              }}>
                {selectedEvent.vehicle_no}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Time</span>
                <span style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>{selectedEvent.time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Camera</span>
                <span style={{ color: '#e2e8f0' }}>{selectedEvent.camera}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Current Status</span>
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>{selectedEvent.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Action Taken</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>{selectedEvent.action_taken}</span>
              </div>
            </div>

            {/* Quick Operator Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              <button
                onClick={() => onResolveEvent(selectedEvent.id, 'ALLOW')}
                style={{
                  backgroundColor: '#10b981',
                  color: '#000',
                  padding: '9px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle size={15} />
                <span>Verify & Allow Entry</span>
              </button>

              <button
                onClick={() => onResolveEvent(selectedEvent.id, 'ALERT')}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  padding: '9px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <BellRing size={15} />
                <span>Dispatch Security Intercept</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
