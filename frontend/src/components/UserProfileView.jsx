import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
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
  Sparkles,
  BarChart3,
  TrendingUp,
  Clock,
  Compass,
  Zap,
  Activity,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Layers,
  Bike
} from 'lucide-react';
import { MOCK_ALL_USERS, fetchUserMonthlyStats } from '../services/api';

export default function UserProfileView({
  currentUser: propUser,
  onBackToHome,
  onNavigateToSettings
}) {
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [activeSection, setActiveSection] = useState('analytics'); // 'analytics', 'vehicles', 'pass', 'history'
  const [statsData, setStatsData] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

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

  // Fetch live stats from backend or build deterministic fallback
  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      setIsLoadingStats(true);
      try {
        const data = await fetchUserMonthlyStats();
        if (isMounted && data) {
          setStatsData(data);
          setIsLoadingStats(false);
          return;
        }
      } catch (e) {
        console.warn('Using offline stats fallback:', e);
      }

      // Offline / Local Fallback Generator
      if (isMounted) {
        const now = new Date();
        const currentDay = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const monthStr = now.toLocaleString('default', { month: 'short' });

        const days = [];
        let total = 0;
        let activeDays = 0;
        const seed = currentUser.email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        for (let d = 1; d <= daysInMonth; d++) {
          const dateObj = new Date(now.getFullYear(), now.getMonth(), d);
          const dayOfWeek = dateObj.getDay(); // 0 is Sun
          let trips = 0;
          if (d <= currentDay) {
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
              trips = (d + seed) % 5 !== 0 ? 2 : (d % 3 === 0 ? 3 : 1);
            } else if (dayOfWeek === 6) {
              trips = (d + seed) % 2 === 0 ? 1 : 0;
            }
            total += trips;
            if (trips > 0) activeDays++;
          }
          days.push({
            day: d,
            date: `${monthStr} ${d < 10 ? '0' + d : d}`,
            trips: trips,
            weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
            isPastOrToday: d <= currentDay
          });
        }

        const registeredVehicles = [
          {
            registration_number: currentUser.vehicles?.[0] || 'MP07AB1234',
            vehicle_type: 'CAR',
            owner_name: currentUser.name,
            owner_role: currentUser.userType,
            department: currentUser.department,
            status: 'Active Clearance',
            valid_until: '31 Dec 2026',
            tag_type: 'RFID + YOLOv11 OCR',
            permit_class: 'Primary Registered Commuter Vehicle',
            is_active: true
          },
          {
            registration_number: 'MP07XY8899',
            vehicle_type: 'MOTORCYCLE',
            owner_name: currentUser.name,
            owner_role: currentUser.userType,
            department: currentUser.department,
            status: 'Active Clearance',
            valid_until: '31 Dec 2026',
            tag_type: 'RFID Tag #9921',
            permit_class: 'Secondary Two-Wheeler Permit',
            is_active: true
          }
        ];

        setStatsData({
          summary: {
            total_trips_this_month: total,
            registered_vehicles_count: registeredVehicles.length,
            days_active_this_month: activeDays,
            weekly_travel_frequency: `${(activeDays / Math.max(0.5, currentDay / 7)).toFixed(1)} days / week`,
            peak_travel_window: '08:30 AM - 09:15 AM',
            avg_daily_trips: (total / Math.max(1, activeDays)).toFixed(1),
            on_time_ingress_rate: '98.4%',
            avg_barrier_lift_ms: '180 ms',
            most_frequent_gate: 'Main North Entry Gate'
          },
          registered_vehicles: registeredVehicles,
          daily_ingress_trend: days,
          hourly_distribution: [
            { slot: 'Morning Rush (07:00 - 10:00)', shortSlot: '07-10 AM', trips: Math.round(total * 0.58), pct: 58, color: '#3b82f6' },
            { slot: 'Mid-day Transit (11:00 - 14:00)', shortSlot: '11-02 PM', trips: Math.round(total * 0.22), pct: 22, color: '#10b981' },
            { slot: 'Evening Return (15:00 - 18:00)', shortSlot: '03-06 PM', trips: Math.round(total * 0.15), pct: 15, color: '#f59e0b' },
            { slot: 'Night Access (19:00 - 22:00)', shortSlot: '07-10 PM', trips: Math.max(1, total - Math.round(total * 0.95)), pct: 5, color: '#8b5cf6' }
          ],
          gate_distribution: [
            { gate: 'Main North Entry Gate (CAM-GATE-01)', name: 'Main North Gate', trips: Math.round(total * 0.72), color: '#3b82f6' },
            { gate: 'Academic South Gate (CAM-GATE-02)', name: 'South Corridor', trips: Math.round(total * 0.23), color: '#10b981' },
            { gate: 'Residential Express Lane (CAM-GATE-03)', name: 'Express Lane', trips: Math.max(1, Math.round(total * 0.05)), color: '#6366f1' }
          ],
          recent_entries: [
            {
              id: 'trip-01',
              timestamp: 'Today, 08:34 AM',
              gate: 'Main North Entry Gate (CAM-GATE-01)',
              plate: currentUser.vehicles?.[0] || 'MP07AB1234',
              vehicle_type: 'Car',
              barrier_status: 'LIFTED_AUTOMATIC',
              clearance_ms: 175,
              verification_method: 'YOLOv11 ANPR + RFID',
              status: 'AUTHORIZED'
            },
            {
              id: 'trip-02',
              timestamp: 'Yesterday, 05:22 PM',
              gate: 'Academic South Gate (CAM-GATE-02)',
              plate: currentUser.vehicles?.[0] || 'MP07AB1234',
              vehicle_type: 'Car',
              barrier_status: 'LIFTED_AUTOMATIC',
              clearance_ms: 188,
              verification_method: 'YOLOv11 ANPR + RFID',
              status: 'AUTHORIZED'
            },
            {
              id: 'trip-03',
              timestamp: 'Yesterday, 08:41 AM',
              gate: 'Main North Entry Gate (CAM-GATE-01)',
              plate: 'MP07XY8899',
              vehicle_type: 'Motorcycle',
              barrier_status: 'LIFTED_AUTOMATIC',
              clearance_ms: 162,
              verification_method: 'RFID FastPass',
              status: 'AUTHORIZED'
            },
            {
              id: 'trip-04',
              timestamp: '2 days ago, 08:29 AM',
              gate: 'Main North Entry Gate (CAM-GATE-01)',
              plate: currentUser.vehicles?.[0] || 'MP07AB1234',
              vehicle_type: 'Car',
              barrier_status: 'LIFTED_AUTOMATIC',
              clearance_ms: 180,
              verification_method: 'YOLOv11 ANPR + RFID',
              status: 'AUTHORIZED'
            },
            {
              id: 'trip-05',
              timestamp: '3 days ago, 05:14 PM',
              gate: 'Academic South Gate (CAM-GATE-02)',
              plate: currentUser.vehicles?.[0] || 'MP07AB1234',
              vehicle_type: 'Car',
              barrier_status: 'LIFTED_AUTOMATIC',
              clearance_ms: 192,
              verification_method: 'YOLOv11 ANPR + RFID',
              status: 'AUTHORIZED'
            }
          ]
        });
        setIsLoadingStats(false);
      }
    }

    loadStats();
    return () => { isMounted = false; };
  }, [currentUser.email, currentUser.name, selectedUserIndex]);

  const summary = statsData?.summary || {
    total_trips_this_month: 32,
    registered_vehicles_count: (statsData?.registered_vehicles || []).length || 2,
    days_active_this_month: 16,
    weekly_travel_frequency: '5.2 days / week',
    peak_travel_window: '08:30 AM - 09:15 AM',
    avg_daily_trips: '2.0',
    on_time_ingress_rate: '98.4%',
    avg_barrier_lift_ms: '180 ms',
    most_frequent_gate: 'Main North Entry Gate'
  };

  const registeredVehiclesList = statsData?.registered_vehicles || [
    {
      registration_number: currentUser.vehicles?.[0] || 'MP07AB1234',
      vehicle_type: 'CAR',
      owner_name: currentUser.name,
      owner_role: currentUser.userType,
      department: currentUser.department,
      status: 'Active Clearance',
      valid_until: '31 Dec 2026',
      tag_type: 'RFID + YOLOv11 OCR',
      permit_class: 'Primary Registered Commuter Vehicle',
      is_active: true
    }
  ];

  const dailyTrendData = statsData?.daily_ingress_trend || [];
  const hourlyData = statsData?.hourly_distribution || [];
  const gateData = statsData?.gate_distribution || [];
  const recentEntriesList = statsData?.recent_entries || [];

  const qrDataPayload = JSON.stringify({
    passId: `CG-PASS-${currentUser.rollNumber}`,
    name: currentUser.name,
    plate: registeredVehiclesList[0]?.registration_number || 'MP07AB1234',
    status: 'AUTHORIZED',
    validTill: currentUser.validTill,
    issuedBy: 'CampusGate Security Council'
  });

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '10px 14px',
          boxShadow: 'var(--shadow-elevated)',
          fontSize: '12px'
        }}>
          <div style={{ color: 'var(--text-main)', fontWeight: 800, marginBottom: '4px' }}>
            {dataPoint.date} ({dataPoint.weekday})
          </div>
          <div style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
            <Activity size={14} />
            <span>Campus Trips: {dataPoint.trips}</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
            Status: {dataPoint.trips > 0 ? 'Gate Ingress Verified' : 'No Travel Recorded'}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      maxWidth: '1080px',
      margin: '0 auto',
      padding: '24px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <button
          onClick={onBackToHome}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>

        {!propUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Demo Persona:</span>
            <select
              value={selectedUserIndex}
              onChange={(e) => setSelectedUserIndex(parseInt(e.target.value))}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                color: 'var(--text-main)',
                fontWeight: 600
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
          USER PROFILE HERO & MONTHLY KPI HIGHLIGHT CARDS
         ========================================================= */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '20px',
        border: '1px solid var(--border-subtle)',
        padding: '24px 28px',
        boxShadow: 'var(--shadow-elevated)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* User Identity Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 800,
              color: '#ffffff',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)'
            }}>
              {currentUser.initials}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {currentUser.name}
                </h1>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--color-emerald)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '3px 10px',
                  borderRadius: '99px',
                  textTransform: 'uppercase'
                }}>
                  {currentUser.passStatus}
                </span>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {currentUser.role} • {currentUser.department}
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                Campus ID: {currentUser.rollNumber} • {currentUser.email}
              </div>
            </div>
          </div>

          <button
            onClick={onNavigateToSettings}
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-primary-text)',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 18px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}
          >
            <PlusCircle size={15} />
            <span>Register New Vehicle</span>
          </button>
        </div>

        {/* 4 Interactive Monthly Summary Metric Tiles */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
          paddingTop: '8px'
        }}>
          {/* Card 1: Total Trips This Month */}
          <div style={{
            backgroundColor: 'var(--bg-card-subtle)',
            borderRadius: '14px',
            padding: '16px 18px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>
              <span>Monthly Campus Trips</span>
              <Activity size={16} color="#3b82f6" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
              {summary.total_trips_this_month}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-emerald)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={12} />
              <span>{summary.days_active_this_month} active days this month</span>
            </div>
          </div>

          {/* Card 2: Registered Vehicles */}
          <div style={{
            backgroundColor: 'var(--bg-card-subtle)',
            borderRadius: '14px',
            padding: '16px 18px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>
              <span>Registered Vehicles</span>
              <Car size={16} color="#10b981" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
              {summary.registered_vehicles_count}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {registeredVehiclesList.map(v => v.registration_number).join(', ') || 'MP07AB1234'}
            </div>
          </div>

          {/* Card 3: Travel Frequency */}
          <div style={{
            backgroundColor: 'var(--bg-card-subtle)',
            borderRadius: '14px',
            padding: '16px 18px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>
              <span>Travel Frequency</span>
              <Calendar size={16} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)' }}>
              {summary.weekly_travel_frequency}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Avg: {summary.avg_daily_trips} trips / commute day
            </div>
          </div>

          {/* Card 4: FastPass Clearance Speed */}
          <div style={{
            backgroundColor: 'var(--bg-card-subtle)',
            borderRadius: '14px',
            padding: '16px 18px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>
              <span>Gate Clearance</span>
              <Zap size={16} color="#8b5cf6" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{summary.avg_barrier_lift_ms}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {summary.on_time_ingress_rate} Instant Boom Lift
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          SECTION NAVIGATION BAR (ANALYTICS, VEHICLES, PASS, LOG)
         ========================================================= */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '12px',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveSection('analytics')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeSection === 'analytics' ? '1px solid var(--accent-primary)' : '1px solid transparent',
            backgroundColor: activeSection === 'analytics' ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
            color: activeSection === 'analytics' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <BarChart3 size={16} />
          <span>Monthly Travel Analytics & Visual Graphs</span>
        </button>

        <button
          onClick={() => setActiveSection('vehicles')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeSection === 'vehicles' ? '1px solid var(--accent-primary)' : '1px solid transparent',
            backgroundColor: activeSection === 'vehicles' ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
            color: activeSection === 'vehicles' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Car size={16} />
          <span>My Registered Vehicles ({registeredVehiclesList.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('pass')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeSection === 'pass' ? '1px solid var(--accent-primary)' : '1px solid transparent',
            backgroundColor: activeSection === 'pass' ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
            color: activeSection === 'pass' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <QrCode size={16} />
          <span>Digital Gate Pass (QR)</span>
        </button>

        <button
          onClick={() => setActiveSection('history')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeSection === 'history' ? '1px solid var(--accent-primary)' : '1px solid transparent',
            backgroundColor: activeSection === 'history' ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
            color: activeSection === 'history' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Clock size={16} />
          <span>Ingress Gate Logs ({recentEntriesList.length})</span>
        </button>
      </div>

      {/* =========================================================
          TAB 1: MONTHLY TRAVEL STATS & VISUAL GRAPHS / CHARTS
         ========================================================= */}
      {activeSection === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Main Chart 1: Daily Ingress Travel Frequency Area Chart */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '18px',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            boxShadow: 'var(--shadow-elevated)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} color="#3b82f6" />
                  <span>Daily Campus Ingress Trend (Current Month)</span>
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Track how frequently you drive or commute through campus barrier checkpoints day-by-day.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  color: '#3b82f6',
                  padding: '5px 12px',
                  borderRadius: '99px'
                }}>
                  Peak Travel: {summary.peak_travel_window}
                </div>
              </div>
            </div>

            {/* Daily Ingress Area Chart */}
            <div style={{ width: '100%', height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="userIngressGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                  <XAxis
                    dataKey="date"
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickLine={false}
                    interval={2}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="trips"
                    name="Trips"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#userIngressGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Footer Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginTop: '18px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Most Used Gate:</span>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                  {summary.most_frequent_gate}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Active Commute Rate:</span>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-emerald)', marginTop: '2px' }}>
                  {summary.days_active_this_month} Active Days / Month
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>FastPass OCR Reliability:</span>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '2px' }}>
                  99.8% Sub-Millisecond Clearance
                </div>
              </div>
            </div>
          </div>

          {/* Dual Visual Charts: Time-of-Day Distribution & Gate Ingress Matrix */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '20px'
          }}>
            {/* Chart 2: Time-of-Day Frequency (BarChart) */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '18px',
              border: '1px solid var(--border-subtle)',
              padding: '22px',
              boxShadow: 'var(--shadow-elevated)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={17} color="#10b981" />
                <span>Time-of-Day Travel Frequency</span>
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
                Breakdown of when you enter the campus throughout the day.
              </p>

              <div style={{ width: '100%', height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                    <XAxis dataKey="shortSlot" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      formatter={(val, name, item) => [`${val} Trips (${item.payload.pct}%)`, 'Ingress Frequency']}
                      contentStyle={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="trips" radius={[6, 6, 0, 0]}>
                      {hourlyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Hourly Stats breakdown badges */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '14px' }}>
                {hourlyData.map(h => (
                  <div key={h.slot} style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{h.shortSlot}</span>
                    <span style={{ fontWeight: 800, color: h.color }}>{h.trips} ({h.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 3: Gate Distribution */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '18px',
              border: '1px solid var(--border-subtle)',
              padding: '22px',
              boxShadow: 'var(--shadow-elevated)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Compass size={17} color="#f59e0b" />
                  <span>Campus Gate Checkpoint Distribution</span>
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
                  Which gates you use most frequently when arriving at college.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {gateData.map((g) => {
                    const pct = Math.round((g.trips / Math.max(1, summary.total_trips_this_month)) * 100);
                    return (
                      <div key={g.gate}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{g.name}</span>
                          <span style={{ fontWeight: 800, color: g.color }}>{g.trips} trips ({pct}%)</span>
                        </div>
                        <div style={{
                          height: '8px',
                          backgroundColor: 'var(--bg-card-subtle)',
                          borderRadius: '99px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${pct}%`,
                            height: '100%',
                            backgroundColor: g.color,
                            borderRadius: '99px',
                            transition: 'width 0.4s ease'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gate Efficiency Callout */}
              <div style={{
                marginTop: '20px',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Zap size={18} color="#3b82f6" />
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-main)' }}>Smart Corridor Sweeper:</strong> Handoff telemetry between Gate 1 & Academic corridor tracks your car arrival in real-time.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: REGISTERED VEHICLES LIST & MANAGEMENT
         ========================================================= */}
      {activeSection === 'vehicles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Vehicles Registered to {currentUser.name}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                All registered vehicles are configured for instant barrier lift via YOLOv11 ANPR and RFID FastPass.
              </p>
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
              <PlusCircle size={15} />
              <span>Add Vehicle</span>
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '18px'
          }}>
            {registeredVehiclesList.map((v, idx) => (
              <div
                key={v.registration_number || idx}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '16px',
                  border: '1px solid var(--border-subtle)',
                  padding: '22px',
                  boxShadow: 'var(--shadow-elevated)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative'
                }}
              >
                {/* Header: Vehicle Type & Tag Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      color: 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {v.vehicle_type === 'MOTORCYCLE' || v.vehicle_type === 'TWO_WHEELER' ? (
                        <Bike size={22} />
                      ) : (
                        <Car size={22} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                        {v.vehicle_type || 'CAR'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {v.permit_class || 'Resident Permitted Vehicle'}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: 'var(--color-emerald)',
                    padding: '4px 10px',
                    borderRadius: '99px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <CheckCircle2 size={12} />
                    <span>{v.status || 'Active'}</span>
                  </span>
                </div>

                {/* Big License Plate Badge */}
                <div style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderRadius: '10px',
                  padding: '12px',
                  textAlign: 'center',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Registered License Plate
                  </div>
                  <div className="plate-number" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                    {v.registration_number}
                  </div>
                </div>

                {/* Metadata Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Permit Expiry:</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                      {v.valid_until || '31 Dec 2026'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Ingress Tag:</span>
                    <div style={{ fontWeight: 700, color: 'var(--accent-primary)', marginTop: '2px' }}>
                      {v.tag_type || 'RFID + OCR Linked'}
                    </div>
                  </div>
                </div>

                {/* Vehicle Action Button */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Gate FastPass: <strong style={{ color: 'var(--color-emerald)' }}>Sub-200ms Active</strong>
                  </span>
                  <button
                    onClick={onNavigateToSettings}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-primary)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>Update Permit</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 3: DIGITAL SMART GATE PASS (QR BADGE CARD)
         ========================================================= */}
      {activeSection === 'pass' && (
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
                    {registeredVehiclesList[0]?.registration_number || 'MP07AB1234'}
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
              padding: '20px',
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0'
            }}>
              <QRCodeSVG
                value={qrDataPayload}
                size={170}
                level="H"
                includeMargin={false}
              />
              <div style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#475569',
                marginTop: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                textAlign: 'center'
              }}>
                Scan at Gate Barrier Scanner
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
      )}

      {/* =========================================================
          TAB 4: RECENT INGRESS GATE LOG
         ========================================================= */}
      {activeSection === 'history' && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '18px',
          border: '1px solid var(--border-subtle)',
          padding: '24px',
          boxShadow: 'var(--shadow-elevated)'
        }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="#3b82f6" />
            <span>Recent Personal Gate Ingress Logs</span>
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 18px 0' }}>
            Audit trail of your recent entries into the campus gates with verification speed and checkpoint details.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 14px' }}>Time & Date</th>
                  <th style={{ padding: '10px 14px' }}>Gate Checkpoint</th>
                  <th style={{ padding: '10px 14px' }}>Vehicle Plate</th>
                  <th style={{ padding: '10px 14px' }}>Verification Method</th>
                  <th style={{ padding: '10px 14px' }}>Barrier Response</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentEntriesList.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {entry.timestamp}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {entry.gate}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="plate-number" style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-primary)' }}>
                        {entry.plate}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {entry.verification_method}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ color: 'var(--color-emerald)', fontWeight: 700 }}>
                        {entry.barrier_status} ({entry.clearance_ms}ms)
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        color: 'var(--color-emerald)',
                        padding: '3px 8px',
                        borderRadius: '6px'
                      }}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
