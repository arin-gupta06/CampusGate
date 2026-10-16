import React, { useState } from 'react';
import {
  Download,
  Search,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

// Daily Vehicle Ingress & Egress Camera Relay Audit Data
export const DAILY_VEHICLE_RELAYS = [
  {
    id: 'rel-101',
    plate_number: 'MP07AB1234',
    owner_name: 'Rajesh Gupta',
    associated_person: 'Arin Gupta (Student - CSE 7th Sem)',
    vehicle_type: 'Car (Hyundai i20 White)',
    category: 'STUDENT_PASS',
    image_url: '/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png',
    status: 'EXITED',
    dwell_time: '8h 33m',

    // Ingress (Entry)
    entry_time: '08:42 AM',
    entry_gate: 'Gate 1 - North Main Entry',
    entry_camera: 'CAM-GATE-01',
    entry_lane: 'Inbound Lane 1',

    // Egress (Exit)
    exit_time: '05:15 PM',
    exit_gate: 'Gate 2 - South Outbound Gate',
    exit_camera: 'CAM-GATE-02',
    exit_lane: 'Outbound Lane 2',

    relay_summary: 'Gate 1 ➔ Academic Road ➔ Parking Zone A ➔ Gate 2',
    relay_path: [
      {
        step: 1,
        time: '08:42:15 AM',
        camera_id: 'CAM-GATE-01',
        camera_name: 'Gate 1 - North Main Entry',
        type: 'INGRESS',
        action: 'Ingress Line Crossed',
        note: 'Plate detected with 0.96 confidence. Automated barrier lifted.'
      },
      {
        step: 2,
        time: '08:45:30 AM',
        camera_id: 'CAM-CORRIDOR-01',
        camera_name: 'Academic Road Checkpoint',
        type: 'RELAY',
        action: 'In-Transit Relay Handoff',
        note: 'Transit duration 3m 15s (Expected: 2-5m). Normal campus speed.'
      },
      {
        step: 3,
        time: '08:48:10 AM',
        camera_id: 'CAM-PARK-01',
        camera_name: 'Parking Zone A Camera',
        type: 'ZONE_INGRESS',
        action: 'Vehicle Parked',
        note: 'Slot A-14 occupied. Engine off.'
      },
      {
        step: 4,
        time: '05:08:40 PM',
        camera_id: 'CAM-ROAD-02',
        camera_name: 'Central Library Roundabout',
        type: 'RELAY',
        action: 'Outbound Corridor Relay',
        note: 'Vehicle departed parking slot, moving toward Gate 2.'
      },
      {
        step: 5,
        time: '05:15:22 PM',
        camera_id: 'CAM-GATE-02',
        camera_name: 'Gate 2 - South Outbound Gate',
        type: 'EGRESS',
        action: 'Egress Line Crossed',
        note: 'Vehicle departed campus. Journey concluded.'
      }
    ]
  },
  {
    id: 'rel-102',
    plate_number: 'MP07CD5678',
    owner_name: 'Priya Sharma',
    associated_person: 'Priya Sharma (Student - ECE 5th Sem)',
    vehicle_type: 'Bike (Royal Enfield 350 Black)',
    category: 'STUDENT_PASS',
    image_url: '/assets/ChatGPT Image Sep 27, 2026, 11_17_25 AM.png',
    status: 'ON_CAMPUS',
    dwell_time: '2h 45m (Active)',

    // Ingress (Entry)
    entry_time: '09:10 AM',
    entry_gate: 'Gate 2 - Side Entry Gate',
    entry_camera: 'CAM-GATE-02',
    entry_lane: 'Two-Wheeler Inbound Lane',

    // Egress (Exit)
    exit_time: 'Currently Inside',
    exit_gate: 'Not Yet Exited',
    exit_camera: 'Active on Campus Relay',
    exit_lane: 'N/A',

    relay_summary: 'Gate 2 ➔ Science Block Corridor ➔ Two-Wheeler Parking B',
    relay_path: [
      {
        step: 1,
        time: '09:10:04 AM',
        camera_id: 'CAM-GATE-02',
        camera_name: 'Gate 2 - Side Entry Gate',
        type: 'INGRESS',
        action: 'Ingress Line Crossed',
        note: 'Verified student pass. Helmet detected.'
      },
      {
        step: 2,
        time: '09:12:45 AM',
        camera_id: 'CAM-SCIENCE-01',
        camera_name: 'Science Block Corridor',
        type: 'RELAY',
        action: 'In-Transit Relay Handoff',
        note: 'Transit duration 2m 41s. Vehicle moving within campus speed limit.'
      },
      {
        step: 3,
        time: '09:14:20 AM',
        camera_id: 'CAM-BIKE-PARK',
        camera_name: 'Two-Wheeler Parking B',
        type: 'ZONE_INGRESS',
        action: 'Currently Parked',
        note: 'Stationary for 2h 45m. Monitored by Parking Relay.'
      }
    ]
  },
  {
    id: 'rel-103',
    plate_number: 'MP07EF9012',
    owner_name: 'Dr. Amit Verma',
    associated_person: 'Dr. Amit Verma (Faculty - HOD Mechanical)',
    vehicle_type: 'Car (Maruti Suzuki Swift Red)',
    category: 'FACULTY_PASS',
    image_url: '/assets/ChatGPT Image Sep 27, 2026, 11_17_25 AM.png',
    status: 'EXITED',
    dwell_time: '5h 15m',

    // Ingress (Entry)
    entry_time: '08:15 AM',
    entry_gate: 'Gate 1 - North Main Entry',
    entry_camera: 'CAM-GATE-01',
    entry_lane: 'VIP / Faculty Priority Lane',

    // Egress (Exit)
    exit_time: '01:30 PM',
    exit_gate: 'Gate 1 - North Main Entry',
    exit_camera: 'CAM-GATE-01',
    exit_lane: 'Outbound Lane 1',

    relay_summary: 'Gate 1 ➔ Admin Loop ➔ Faculty Parking ➔ Gate 1',
    relay_path: [
      {
        step: 1,
        time: '08:15:10 AM',
        camera_id: 'CAM-GATE-01',
        camera_name: 'Gate 1 - North Main Entry',
        type: 'INGRESS',
        action: 'Priority Ingress',
        note: 'Faculty RFID & Plate OCR matched. Instant automated lift.'
      },
      {
        step: 2,
        time: '08:18:22 AM',
        camera_id: 'CAM-ADMIN-01',
        camera_name: 'Admin Block Loop',
        type: 'RELAY',
        action: 'Internal Relay Handoff',
        note: 'En route to reserved Faculty Parking.'
      },
      {
        step: 3,
        time: '08:20:05 AM',
        camera_id: 'CAM-FAC-PARK',
        camera_name: 'Faculty Reserved Parking',
        type: 'ZONE_INGRESS',
        action: 'Parked in Slot F-04',
        note: 'Parked for 5h 05m.'
      },
      {
        step: 4,
        time: '01:30:18 PM',
        camera_id: 'CAM-GATE-01',
        camera_name: 'Gate 1 - North Main Entry',
        type: 'EGRESS',
        action: 'Egress Line Crossed',
        note: 'Outbound departure recorded.'
      }
    ]
  },
  {
    id: 'rel-104',
    plate_number: 'MP07XY9999',
    owner_name: 'Guest Driver',
    associated_person: 'Visitor (Host: Dr. Amit Verma, Mechanical)',
    vehicle_type: 'Car (Honda City Silver)',
    category: 'DAY_VISITOR_PASS',
    image_url: '/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png',
    status: 'EXITED',
    dwell_time: '47m (Short Visit)',

    // Ingress (Entry)
    entry_time: '10:41 AM',
    entry_gate: 'Gate 1 - North Main Entry',
    entry_camera: 'CAM-GATE-01',
    entry_lane: 'Visitor Verification Lane',

    // Egress (Exit)
    exit_time: '11:28 AM',
    exit_gate: 'Gate 1 - North Main Entry',
    exit_camera: 'CAM-GATE-01',
    exit_lane: 'Outbound Lane 1',

    relay_summary: 'Gate 1 ➔ Admin Reception ➔ Visitor Bay ➔ Gate 1',
    relay_path: [
      {
        step: 1,
        time: '10:41:28 AM',
        camera_id: 'CAM-GATE-01',
        camera_name: 'Gate 1 - North Main Entry',
        type: 'INGRESS',
        action: 'Visitor Pass Issued',
        note: 'Unlisted vehicle. Guard issued 1-day pass for Mechanical Dept meeting.'
      },
      {
        step: 2,
        time: '10:44:12 AM',
        camera_id: 'CAM-ADMIN-01',
        camera_name: 'Admin Block Front Bay',
        type: 'RELAY',
        action: 'Visitor Bay Parking',
        note: 'Parked at short-term visitor bay.'
      },
      {
        step: 3,
        time: '11:28:44 AM',
        camera_id: 'CAM-GATE-01',
        camera_name: 'Gate 1 - North Main Entry',
        type: 'EGRESS',
        action: 'Visitor Pass Returned & Logged Out',
        note: 'Exit clearance verified. Total campus stay: 47 minutes.'
      }
    ]
  },
  {
    id: 'rel-105',
    plate_number: 'MP07GH3456',
    owner_name: 'Sunita Singh',
    associated_person: 'Rohan Singh (Student - Civil Eng)',
    vehicle_type: 'Car (Hyundai Creta Grey)',
    category: 'STUDENT_PASS',
    image_url: '/assets/ChatGPT Image Sep 27, 2026, 11_19_51 AM.png',
    status: 'OVERSTAY_ALERT',
    dwell_time: '7h 52m (Overstay Alert)',

    // Ingress (Entry)
    entry_time: '07:45 AM',
    entry_gate: 'Gate 2 - Side Entry Gate',
    entry_camera: 'CAM-GATE-02',
    entry_lane: 'Inbound Lane 2',

    // Egress (Exit)
    exit_time: 'Currently Inside',
    exit_gate: 'Not Yet Exited',
    exit_camera: 'Workshop Camera Relay',
    exit_lane: 'N/A',

    relay_summary: 'Gate 2 ➔ Workshop Corridor ➔ Heavy Labs Yard',
    relay_path: [
      {
        step: 1,
        time: '07:45:18 AM',
        camera_id: 'CAM-GATE-02',
        camera_name: 'Gate 2 - Side Entry Gate',
        type: 'INGRESS',
        action: 'Early Morning Ingress',
        note: 'Passed Gate 2 check.'
      },
      {
        step: 2,
        time: '07:49:50 AM',
        camera_id: 'CAM-WORKSHOP-01',
        camera_name: 'Workshop & Civil Labs Corridor',
        type: 'RELAY',
        action: 'Relay Checkpoint Passed',
        note: 'Observed heading toward heavy machinery shed.'
      },
      {
        step: 3,
        time: '07:54:10 AM',
        camera_id: 'CAM-WORKSHOP-02',
        camera_name: 'Civil Labs Rear Lot',
        type: 'ZONE_INGRESS',
        action: 'Parked in Non-Standard Bay',
        note: 'Stationary for 7h 52m. Triggered campus dwell-time limit flag.'
      }
    ]
  },
  {
    id: 'rel-106',
    plate_number: 'MP07IJ7890',
    owner_name: 'Vikram Mehta',
    associated_person: 'Vikram Mehta (Staff - Accounts)',
    vehicle_type: 'Bike (Honda Activa 6G Grey)',
    category: 'STAFF_PASS',
    image_url: '/assets/ChatGPT Image Sep 27, 2026, 11_17_25 AM.png',
    status: 'EXITED',
    dwell_time: '7h 48m',

    // Ingress (Entry)
    entry_time: '09:02 AM',
    entry_gate: 'Gate 1 - North Main Entry',
    entry_camera: 'CAM-GATE-01',
    entry_lane: 'Two-Wheeler Lane',

    // Egress (Exit)
    exit_time: '04:50 PM',
    exit_gate: 'Gate 1 - North Main Entry',
    exit_camera: 'CAM-GATE-01',
    exit_lane: 'Outbound Lane 1',

    relay_summary: 'Gate 1 ➔ Admin Loop ➔ Staff Two-Wheeler Bay ➔ Gate 1',
    relay_path: [
      {
        step: 1,
        time: '09:02:11 AM',
        camera_id: 'CAM-GATE-01',
        camera_name: 'Gate 1 - North Main Entry',
        type: 'INGRESS',
        action: 'Staff Ingress Cleared',
        note: 'Pass active.'
      },
      {
        step: 2,
        time: '09:05:40 AM',
        camera_id: 'CAM-STAFF-PARK',
        camera_name: 'Staff Two-Wheeler Bay',
        type: 'ZONE_INGRESS',
        action: 'Parked for Duty Shift',
        note: 'Logged in for Accounts branch duty.'
      },
      {
        step: 3,
        time: '04:50:33 PM',
        camera_id: 'CAM-GATE-01',
        camera_name: 'Gate 1 - North Main Entry',
        type: 'EGRESS',
        action: 'Duty Shift Departure',
        note: 'Egress verified. Left campus via Gate 1.'
      }
    ]
  }
];

export default function EventsView() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState(DAILY_VEHICLE_RELAYS[0]);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter logic
  const filtered = DAILY_VEHICLE_RELAYS.filter((item) => {
    // Search match
    const matchSearch =
      searchTerm === '' ||
      item.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.associated_person.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'ON_CAMPUS') return item.status === 'ON_CAMPUS';
    if (activeFilter === 'EXITED') return item.status === 'EXITED';
    if (activeFilter === 'ALERTS') return item.status === 'OVERSTAY_ALERT';
    return true;
  });

  // Export Daily Relay Journey Log to CSV
  const handleExportCSV = () => {
    const headers = [
      'Plate Number',
      'Owner / Person',
      'Vehicle Type',
      'Entry Time',
      'Entry Gate',
      'Entry Camera Relay',
      'Exit Time',
      'Exit Gate',
      'Exit Camera Relay',
      'Total Dwell Time',
      'Status'
    ];

    const rows = DAILY_VEHICLE_RELAYS.map((r) => [
      r.plate_number,
      `"${r.associated_person}"`,
      `"${r.vehicle_type}"`,
      r.entry_time,
      `"${r.entry_gate}"`,
      r.entry_camera,
      r.exit_time,
      `"${r.exit_gate}"`,
      r.exit_camera,
      r.dwell_time,
      r.status
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `campus_gate_daily_ingress_egress_relays_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header & Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Daily Vehicle Ingress & Egress Relay Audit
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Multi-camera tracking records: entry timestamps, entry gate relays, outbound departure logs, and dwell time.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-medium)',
            padding: '9px 16px',
            borderRadius: '9px',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <Download size={15} />
          <span>Export Daily Relay Log (.CSV)</span>
        </button>
      </div>

      {/* 2. Filter Pills & Live Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Filter Pills */}
        <div style={{
          display: 'flex',
          gap: '8px',
          backgroundColor: 'var(--bg-card-subtle)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          width: 'fit-content'
        }}>
          <button
            onClick={() => setActiveFilter('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: activeFilter === 'ALL' ? 'var(--accent-primary)' : 'transparent',
              color: activeFilter === 'ALL' ? 'var(--accent-primary-text)' : 'var(--text-secondary)'
            }}
          >
            All Journeys ({DAILY_VEHICLE_RELAYS.length})
          </button>
          <button
            onClick={() => setActiveFilter('ON_CAMPUS')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: activeFilter === 'ON_CAMPUS' ? 'var(--accent-primary)' : 'transparent',
              color: activeFilter === 'ON_CAMPUS' ? 'var(--accent-primary-text)' : 'var(--text-secondary)'
            }}
          >
            Inside Campus Now
          </button>
          <button
            onClick={() => setActiveFilter('EXITED')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: activeFilter === 'EXITED' ? 'var(--accent-primary)' : 'transparent',
              color: activeFilter === 'EXITED' ? 'var(--accent-primary-text)' : 'var(--text-secondary)'
            }}
          >
            Departed / Exited
          </button>
          <button
            onClick={() => setActiveFilter('ALERTS')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: activeFilter === 'ALERTS' ? 'var(--accent-primary)' : 'transparent',
              color: activeFilter === 'ALERTS' ? 'var(--accent-primary-text)' : 'var(--text-secondary)'
            }}
          >
            Overstay Alerts
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={15} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }} />
          <input
            type="text"
            placeholder="Search plate number, person, roll no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0 12px 0 36px',
              fontSize: '12px',
              color: 'var(--text-main)'
            }}
          />
        </div>
      </div>

      {/* 3. Main 2-Column Structure: Table (Left) + Relay Path Dossier (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.45fr 1fr',
        gap: '20px'
      }}>
        {/* Left Column: Daily Ingress / Egress Relay Table */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-card-subtle)'
              }}>
                <th style={{ padding: '14px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Vehicle Plate</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Owner / Member</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Entry Relay</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Exit Relay</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Status & Stay</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, textAlign: 'right' }}>Relay</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const isSelected = selectedRecord?.id === item.id;
                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedRecord(item)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      fontSize: '12px',
                      backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {/* Plate */}
                    <td style={{ padding: '12px 16px' }}>
                      <span className="plate-number" style={{ fontSize: '12px' }}>
                        {item.plate_number}
                      </span>
                    </td>

                    {/* Owner / Member */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '12.5px' }}>
                        {item.owner_name}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                        {item.associated_person}
                      </div>
                    </td>

                    {/* Entry Relay */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-emerald)', fontWeight: 700 }}>
                        <ArrowDownLeft size={13} />
                        <span>{item.entry_time}</span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                        {item.entry_camera} ({item.entry_gate.split('-')[0]})
                      </div>
                    </td>

                    {/* Exit Relay */}
                    <td style={{ padding: '12px 16px' }}>
                      {item.status === 'ON_CAMPUS' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-main)', fontWeight: 700 }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--color-emerald)' }} />
                          <span>Inside Campus</span>
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-main)', fontWeight: 700 }}>
                            <ArrowUpRight size={13} />
                            <span>{item.exit_time}</span>
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                            {item.exit_camera} ({item.exit_gate.split('-')[0]})
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Status & Stay */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '2px 8px',
                        borderRadius: '99px',
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: item.status === 'ON_CAMPUS' ? 'var(--color-emerald-bg)' : item.status === 'OVERSTAY_ALERT' ? 'var(--color-crimson-bg)' : 'var(--bg-card-subtle)',
                        color: item.status === 'ON_CAMPUS' ? 'var(--color-emerald)' : item.status === 'OVERSTAY_ALERT' ? 'var(--color-crimson)' : 'var(--text-main)',
                        border: `1px solid ${item.status === 'ON_CAMPUS' ? 'var(--color-emerald-border)' : item.status === 'OVERSTAY_ALERT' ? 'var(--color-crimson-border)' : 'var(--border-subtle)'}`
                      }}>
                        {item.status === 'ON_CAMPUS' ? 'PARKED (INSIDE)' : item.status === 'OVERSTAY_ALERT' ? 'OVERSTAY FLAG' : 'EXITED'}
                      </span>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '3px', fontWeight: 600 }}>
                        {item.dwell_time}
                      </div>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <span style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '11px' }}>
                        View Relay →
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right Column: Full Camera Relay Trajectory & Ingress/Egress Dossier */}
        {selectedRecord && (
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Dossier Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Transit Trajectory Dossier
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span className="plate-number" style={{ fontSize: '15px' }}>
                    {selectedRecord.plate_number}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {selectedRecord.vehicle_type}
                  </span>
                </div>
              </div>

              <span style={{
                padding: '3px 9px',
                borderRadius: '99px',
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: selectedRecord.status === 'ON_CAMPUS' ? 'var(--color-emerald-bg)' : 'var(--bg-card-subtle)',
                color: selectedRecord.status === 'ON_CAMPUS' ? 'var(--color-emerald)' : 'var(--text-main)',
                border: '1px solid var(--border-subtle)'
              }}>
                {selectedRecord.status === 'ON_CAMPUS' ? 'Active Inside' : 'Completed Trip'}
              </span>
            </div>

            {/* Ingress & Egress Relay Cards Pair */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {/* Ingress Card */}
              <div style={{
                backgroundColor: 'var(--bg-card-subtle)',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, color: 'var(--color-emerald)' }}>
                  <ArrowDownLeft size={14} />
                  <span>ENTRY (INGRESS)</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                  {selectedRecord.entry_time}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {selectedRecord.entry_gate}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                  Camera: {selectedRecord.entry_camera}
                </div>
              </div>

              {/* Egress Card */}
              <div style={{
                backgroundColor: 'var(--bg-card-subtle)',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, color: 'var(--text-main)' }}>
                  <ArrowUpRight size={14} />
                  <span>EXIT (EGRESS)</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                  {selectedRecord.exit_time}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {selectedRecord.exit_gate}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                  Camera: {selectedRecord.exit_camera}
                </div>
              </div>
            </div>

            {/* Dwell Stay & Summary Strip */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              backgroundColor: 'var(--bg-card-subtle)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              fontSize: '12px'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Registered Member: </span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{selectedRecord.associated_person}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Total Stay: </span>
                <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{selectedRecord.dwell_time}</span>
              </div>
            </div>

            {/* Step-by-Step Camera Relay Trajectory Path */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Multi-Camera Relay Checkpoints Path:
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                position: 'relative'
              }}>
                {selectedRecord.relay_path.map((node, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '10px 12px',
                      backgroundColor: 'var(--bg-card-subtle)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      position: 'relative'
                    }}
                  >
                    {/* Node step badge */}
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: node.type === 'INGRESS' ? 'var(--color-emerald-bg)' : node.type === 'EGRESS' ? 'var(--accent-primary)' : 'var(--bg-card)',
                      color: node.type === 'INGRESS' ? 'var(--color-emerald)' : node.type === 'EGRESS' ? 'var(--accent-primary-text)' : 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800,
                      flexShrink: 0
                    }}>
                      {node.step}
                    </div>

                    {/* Node Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '12.5px' }}>
                          {node.camera_name}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {node.time}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {node.action} • <span style={{ fontFamily: 'var(--font-mono)' }}>{node.camera_id}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {node.note}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Relay Path String */}
            <div style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '10px'
            }}>
              <strong>Full Relay Chain:</strong> {selectedRecord.relay_summary}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
