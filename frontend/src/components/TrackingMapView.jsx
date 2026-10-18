import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Car,
  Clock,
  CheckCircle2,
  AlertCircle,
  Camera,
  ChevronDown,
  Layers
} from 'lucide-react';

export default function TrackingMapView({ vehicle }) {
  const [selectedVehicle, setSelectedVehicle] = useState(vehicle || {
    plate_number: 'MP07AB1234',
    make_model: 'Hyundai i20',
    color: 'White',
    status: 'Verified',
    timeline: [
      { time: '10:42:15', location: 'Gate 1 - Main Entry', desc: 'Vehicle entered campus', status: 'verified' },
      { time: '10:45:32', location: 'Campus Road', desc: 'Moving towards academic block', status: 'moving' },
      { time: '10:48:10', location: 'Parking Area', desc: 'Parked (Zone A)', status: 'parked' },
      { time: '12:15:22', location: 'Parking Area', desc: 'Still parked (3h 27m)', status: 'parked' }
    ]
  });

  const [activeStep, setActiveStep] = useState(2); // Parking Area

  const snapshots = [
    { label: 'Gate 1 - 10:42 AM', image: '/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png' },
    { label: 'Campus Road - 10:45 AM', image: '/assets/ChatGPT Image Sep 27, 2026, 11_17_25 AM.png' },
    { label: 'Parking - 10:48 AM', image: '/assets/ChatGPT Image Sep 27, 2026, 11_19_51 AM.png' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Row with Vehicle Selector */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '14px',
        padding: '16px 20px',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '40px',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: '#000'
          }}>
            <img
              src="/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png"
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="plate-number" style={{ fontSize: '18px', color: 'var(--text-main)', fontWeight: 800 }}>
                {selectedVehicle.plate_number}
              </span>
              <span style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '99px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                Verified
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {selectedVehicle.make_model} • {selectedVehicle.color}
            </div>
          </div>
        </div>

        {/* Date Filter & View toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button style={{
            backgroundColor: 'var(--bg-card-subtle)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-subtle)',
            padding: '7px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>Today</span>
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Main Tracking Layout: Timeline (Left) + Campus Map (Center) + Camera Snapshots (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr 1fr',
        gap: '20px'
      }}>
        {/* Left Column: Movement Timeline */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '14px',
          padding: '20px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '18px' }}>
            Movement Timeline
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
            {selectedVehicle.timeline.map((step, idx) => {
              const isCurrent = idx === activeStep;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    cursor: 'pointer',
                    opacity: isCurrent ? 1 : 0.8
                  }}
                >
                  {/* Step Dot & Connector Line */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: '20px'
                  }}>
                    <span style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: isCurrent ? '#10b981' : idx === 3 ? '#ef4444' : '#38bdf8',
                      boxShadow: isCurrent ? '0 0 10px #10b981' : 'none'
                    }} />
                    {idx < selectedVehicle.timeline.length - 1 && (
                      <div style={{
                        width: '2px',
                        flex: 1,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        margin: '6px 0'
                      }} />
                    )}
                  </div>

                  <div style={{ flex: 1, paddingBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {step.time}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 600, marginTop: '2px' }}>
                      {step.location}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {step.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Campus Map Canvas (Top-down Interactive Visualization) */}
        <div style={{
          backgroundColor: 'var(--bg-card-subtle)',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '440px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Map Header Overlay */}
          <div style={{
            position: 'absolute',
            top: '14px',
            left: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(6px)',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Navigation size={14} color="#38bdf8" />
            <span style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 600 }}>
              Campus Geometric Topology
            </span>
          </div>

          {/* SVG Map Render */}
          <svg
            viewBox="0 0 700 450"
            style={{ width: '100%', height: '100%', flex: 1 }}
          >
            {/* Background Map Grid */}
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Campus Buildings Outline */}
            <rect x="240" y="80" width="180" height="120" rx="8" fill="#131c31" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1.5" />
            <text x="330" y="145" fill="#64748b" fontSize="12" textAnchor="middle" fontWeight="600">Academic Complex</text>

            <rect x="470" y="80" width="150" height="100" rx="8" fill="#131c31" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1.5" />
            <text x="545" y="135" fill="#64748b" fontSize="12" textAnchor="middle" fontWeight="600">Admin Block</text>

            <rect x="420" y="270" width="220" height="130" rx="8" fill="var(--bg-card-subtle)" stroke="#10b981" strokeDasharray="4" strokeWidth="1.5" />
            <text x="530" y="340" fill="#10b981" fontSize="13" textAnchor="middle" fontWeight="700">Parking Area (Zone A)</text>

            {/* Road Network Pathways */}
            <path
              d="M 120 340 L 220 340 L 320 250 L 520 250 L 520 270"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="8 4"
            />

            {/* Node 1: Gate 1 */}
            <circle cx="120" cy="340" r="16" fill="#ef4444" opacity="0.3" />
            <circle cx="120" cy="340" r="8" fill="#ef4444" />
            <text x="120" y="380" fill="#f8fafc" fontSize="12" textAnchor="middle" fontWeight="700">Gate 1</text>
            <text x="120" y="395" fill="#94a3b8" fontSize="10" textAnchor="middle">10:42 AM</text>

            {/* Node 2: Campus Road */}
            <circle cx="320" cy="250" r="14" fill="#38bdf8" opacity="0.3" />
            <circle cx="320" cy="250" r="7" fill="#38bdf8" />
            <text x="320" y="225" fill="#f8fafc" fontSize="12" textAnchor="middle" fontWeight="700">Campus Road</text>
            <text x="320" y="240" fill="#94a3b8" fontSize="10" textAnchor="middle">10:45 AM</text>

            {/* Node 3: Parking Area Pin */}
            <circle cx="520" cy="290" r="18" fill="#10b981" opacity="0.3" />
            <circle cx="520" cy="290" r="9" fill="#10b981" />
            <text x="520" y="255" fill="#10b981" fontSize="12" textAnchor="middle" fontWeight="700">Parked</text>

            {/* Active Vehicle Marker */}
            <g transform="translate(520, 290)">
              <circle r="22" fill="#10b981" opacity="0.2">
                <animate attributeName="r" values="18;28;18" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
              </circle>
            </g>
          </svg>
        </div>

        {/* Right Column: Camera Snapshots Strip */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '14px',
          padding: '20px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Camera Snapshots
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {snapshots.map((item, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ position: 'relative', height: '95px' }}>
                  <img
                    src={item.image}
                    alt={item.label}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '6px',
                    left: '8px',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-main)'
                  }}>
                    {item.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
