import React, { useState } from 'react';
import { Plus, Users, Search, Car, Bike, Shield, GraduationCap, Briefcase, Eye, Phone, Mail, Award } from 'lucide-react';
import { MOCK_ALL_USERS } from '../services/api';

export default function UsersView() {
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'STUDENT', 'FACULTY', 'GUARD', 'ADMIN'
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const filtered = MOCK_ALL_USERS.filter(u => {
    const matchesFilter =
      filter === 'ALL' ||
      (filter === 'STUDENT' && u.userType === 'STUDENT') ||
      (filter === 'FACULTY' && (u.userType === 'FACULTY' || u.userType === 'STAFF')) ||
      (filter === 'GUARD' && u.userType === 'GUARD') ||
      (filter === 'ADMIN' && u.userType === 'ADMIN');

    const query = search.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(query) ||
      u.department.toLowerCase().includes(query) ||
      (u.rollNumber && u.rollNumber.toLowerCase().includes(query)) ||
      (u.vehicles && u.vehicles.some(v => v.toLowerCase().includes(query)));

    return matchesFilter && matchesSearch;
  });

  const studentCount = MOCK_ALL_USERS.filter(u => u.userType === 'STUDENT').length;
  const facultyCount = MOCK_ALL_USERS.filter(u => u.userType === 'FACULTY' || u.userType === 'STAFF').length;
  const guardCount = MOCK_ALL_USERS.filter(u => u.userType === 'GUARD').length;
  const adminCount = MOCK_ALL_USERS.filter(u => u.userType === 'ADMIN').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            User Management & Vehicle Pass Roster
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Comprehensive directory of students with registered vehicles, faculty, guards, and system administrators
          </p>
        </div>

        <button style={{
          backgroundColor: 'var(--accent-primary)',
          color: 'var(--accent-primary-text)',
          borderRadius: '10px',
          padding: '10px 18px',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: 'var(--shadow-elevated)'
        }}>
          <Plus size={16} />
          <span>Add New User</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{
          display: 'flex',
          gap: '6px',
          backgroundColor: 'var(--bg-card)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => setFilter('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: filter === 'ALL' ? '#1e293b' : 'transparent',
              color: filter === 'ALL' ? '#38bdf8' : '#94a3b8'
            }}
          >
            All Users ({MOCK_ALL_USERS.length})
          </button>
          <button
            onClick={() => setFilter('STUDENT')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: filter === 'STUDENT' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: filter === 'STUDENT' ? '#60a5fa' : '#94a3b8'
            }}
          >
            Students ({studentCount})
          </button>
          <button
            onClick={() => setFilter('FACULTY')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: filter === 'FACULTY' ? '#1e293b' : 'transparent',
              color: filter === 'FACULTY' ? '#38bdf8' : '#94a3b8'
            }}
          >
            Faculty & Staff ({facultyCount})
          </button>
          <button
            onClick={() => setFilter('GUARD')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: filter === 'GUARD' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: filter === 'GUARD' ? '#10b981' : '#94a3b8'
            }}
          >
            Guards ({guardCount})
          </button>
          <button
            onClick={() => setFilter('ADMIN')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: filter === 'ADMIN' ? '#1e293b' : 'transparent',
              color: filter === 'ADMIN' ? '#a5b4fc' : '#94a3b8'
            }}
          >
            Admins ({adminCount})
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={15} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }} />
          <input
            type="text"
            placeholder="Search student, roll #, department, plate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

      {/* Users Data Table */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '14px',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-card-subtle)'
            }}>
              <th style={{ padding: '14px 18px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Member Profile</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Role & ID</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Branch / Department</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Linked Vehicle(s)</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Pass Status</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Valid Till</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.id}
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  fontSize: '13px',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#131d33'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-card-subtle)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--text-main)'
                    }}>
                      {u.initials}
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-main)', fontWeight: 700 }}>{u.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{u.email}</div>
                    </div>
                  </div>
                </td>

                <td style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <span style={{
                      width: 'fit-content',
                      backgroundColor: u.userType === 'STUDENT' ? 'rgba(59, 130, 246, 0.15)' : u.userType === 'GUARD' ? 'rgba(16, 185, 129, 0.15)' : u.userType === 'ADMIN' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: u.userType === 'STUDENT' ? '#60a5fa' : u.userType === 'GUARD' ? '#10b981' : u.userType === 'ADMIN' ? '#c084fc' : '#f59e0b',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '4px'
                    }}>
                      {u.role}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {u.rollNumber}
                    </span>
                  </div>
                </td>

                <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                  {u.department}
                </td>

                <td style={{ padding: '14px 18px' }}>
                  {u.vehicles && u.vehicles.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span className="plate-number" style={{
                        color: 'var(--accent-primary)',
                        fontWeight: 700,
                        fontSize: '12px'
                      }}>
                        {u.vehicles.join(', ')}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                        {u.vehicleType}
                      </span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>None (Personnel)</span>
                  )}
                </td>

                <td style={{ padding: '14px 18px' }}>
                  <span style={{
                    backgroundColor: u.passStatus.includes('Active') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: u.passStatus.includes('Active') ? '#10b981' : '#f59e0b',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '99px'
                  }}>
                    {u.passStatus}
                  </span>
                </td>

                <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                  {u.validTill}
                </td>

                <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                  <button
                    onClick={() => setSelectedUser(u)}
                    style={{
                      background: 'none',
                      color: 'var(--accent-primary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Eye size={14} />
                    <span>View</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(6px)',
          zIndex: 160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '460px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-card-subtle)',
                border: '2px solid #3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--accent-primary-text)'
              }}>
                {selectedUser.initials}
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {selectedUser.name}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  {selectedUser.role} • {selectedUser.department}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Roll / Employee ID:</span>
                <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{selectedUser.rollNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                <span style={{ color: 'var(--text-main)' }}>{selectedUser.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                <span style={{ color: 'var(--text-main)' }}>{selectedUser.phone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Registered Plate(s):</span>
                <span style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {selectedUser.vehicles?.join(', ') || 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vehicle Model:</span>
                <span style={{ color: 'var(--text-main)' }}>{selectedUser.vehicleType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Gate Pass Status:</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>{selectedUser.passStatus}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-card-subtle)',
                color: 'var(--text-main)',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                marginTop: '20px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
