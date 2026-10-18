import React, { useState } from 'react';
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
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  MOCK_HOURLY_TRAFFIC,
  MOCK_VEHICLE_TYPE_DISTRIBUTION,
  MOCK_TRANSIT_DURATION
} from '../services/api';
import {
  TrendingUp,
  Activity,
  ShieldCheck,
  Clock,
  Download,
  Calendar,
  Filter
} from 'lucide-react';

export default function AnalyticsView() {
  const [timeRange, setTimeRange] = useState('TODAY'); // 'TODAY', 'WEEK', 'MONTH'

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '10px 14px',
          boxShadow: 'var(--shadow-elevated)',
          fontSize: '12px'
        }}>
          <p style={{ color: 'var(--text-main)', fontWeight: 700, marginBottom: '6px' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: '2px 0', display: 'flex', justifyContent: 'space-between', gap: '14px' }}>
              <span>{entry.name}:</span>
              <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header with Title and Range Picker */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Data Analytics & Traffic Insights
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Quantitative vehicle flow telemetry, peak hour metrics, and cross-camera corridor audit
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-card)',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)'
          }}>
            {['TODAY', 'LAST 7 DAYS', 'MONTHLY'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: timeRange === range ? 'var(--bg-card-subtle)' : 'transparent',
                  color: timeRange === range ? 'var(--accent-primary)' : 'var(--text-muted)'
                }}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={() => alert('Exporting Analytics Data (CSV)...')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-primary-text)',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Banner Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Peak Ingress Hour</span>
            <Activity size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            09:00 AM
          </div>
          <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '4px' }}>
            142 vehicles/hour (Morning rush)
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Flow Movements</span>
            <TrendingUp size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            1,284
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>
            ↑ 14.8% vs previous weekday
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Authorization Pass Rate</span>
            <ShieldCheck size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            94.6%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            5.4% flagged for manual check
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Avg Corridor Transit</span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            48.2s
          </div>
          <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>
            Speed threshold compliant
          </div>
        </div>
      </div>

      {/* Main Charts Row 1: Hourly Flow Curve & Vehicle Type Donut */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '20px'
      }}>
        {/* Hourly Volume Area Chart */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '22px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Hourly Vehicle Ingress & Egress Dynamics
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Vehicle volume crossing gate detection boundaries
              </p>
            </div>
          </div>

          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_HOURLY_TRAFFIC} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIngress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="ingress" name="Ingress (Entering)" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIngress)" />
                <Area type="monotone" dataKey="egress" name="Egress (Leaving)" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEgress)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vehicle Category Distribution Donut */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '22px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Vehicle Categories
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', marginBottom: '10px' }}>
            Fleet composition breakdown
          </p>

          <div style={{ width: '100%', height: 210, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MOCK_VEHICLE_TYPE_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {MOCK_VEHICLE_TYPE_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            {MOCK_VEHICLE_TYPE_DISTRIBUTION.map((cat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat.color }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{cat.name}</span>
                </div>
                <span style={{ color: 'var(--text-main)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{cat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Cross-Camera Travel Time Audit (Loitering vs Expected) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.6fr 1fr',
        gap: '20px'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '22px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Corridor Travel-Time Benchmark (Audit Engine)
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', marginBottom: '16px' }}>
            Expected travel duration vs actual detected handoff latency (flagging loitering or speeding)
          </p>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_TRANSIT_DURATION} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="corridor" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} label={{ value: 'Seconds', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="expectedSec" name="Expected Travel (sec)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actualSec" name="Actual Observed (sec)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gate Traffic Split */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '22px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Gate Utilization Comparison
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', marginBottom: '18px' }}>
              Load balance between ingress gates
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Gate 1 - Main Entry</span>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>68% (873 vehicles)</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-card-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '68%', height: '100%', backgroundColor: '#3b82f6', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Gate 2 - Side Entry</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>32% (411 vehicles)</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-card-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '32%', height: '100%', backgroundColor: '#10b981', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-card-subtle)',
            borderRadius: '10px',
            padding: '12px',
            border: '1px solid var(--border-subtle)',
            fontSize: '11px',
            color: 'var(--text-secondary)'
          }}>
            💡 <strong>AI Recommendation:</strong> Peak load at Gate 1 between 08:30–09:30 AM. Recommend diverting 20% of two-wheeler staff ingress to Gate 2.
          </div>
        </div>
      </div>
    </div>
  );
}
