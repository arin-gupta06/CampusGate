import React, { useState } from 'react';
import {
  Search,
  Plus,
  Car,
  Bike,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  X,
  Check
} from 'lucide-react';

export default function VehiclesView({
  vehicles,
  onAddVehicle,
  onSelectVehicle
}) {
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'ACTIVE', 'INACTIVE', 'BLACKLISTED'
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New vehicle form state
  const [newPlate, setNewPlate] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newAssociated, setNewAssociated] = useState('');
  const [newType, setNewType] = useState('Car');
  const [newDepartment, setNewDepartment] = useState('Computer Science');

  const filteredVehicles = vehicles.filter(v => {
    const matchesFilter =
      filter === 'ALL' ||
      (filter === 'ACTIVE' && v.status === 'Active') ||
      (filter === 'INACTIVE' && v.status === 'Inactive') ||
      (filter === 'BLACKLISTED' && v.status === 'Blacklisted');

    const matchesSearch =
      v.plate_number.toLowerCase().includes(search.toLowerCase()) ||
      v.owner_name.toLowerCase().includes(search.toLowerCase()) ||
      v.associated_person.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!newPlate || !newOwner) return;

    onAddVehicle({
      plate_number: newPlate.toUpperCase().trim(),
      owner_name: newOwner.trim(),
      associated_person: newAssociated.trim() || `${newOwner} (Member)`,
      vehicle_type: newType,
      department: newDepartment,
      status: 'Active',
      valid_till: '31 Dec 2026'
    });

    // Reset form
    setNewPlate('');
    setNewOwner('');
    setNewAssociated('');
    setShowAddModal(false);
  };

  const activeCount = vehicles.filter(v => v.status === 'Active').length;
  const inactiveCount = vehicles.filter(v => v.status === 'Inactive').length;
  const blacklistedCount = vehicles.filter(v => v.status === 'Blacklisted').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            Vehicles
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Manage registered vehicles and automated gate authorizations
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            backgroundColor: '#2563eb',
            color: '#fff',
            borderRadius: '10px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
          }}
        >
          <Plus size={16} />
          <span>Add Vehicle</span>
        </button>
      </div>

      {/* Filter Chips & Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          backgroundColor: '#0f172a',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
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
            All Vehicles ({vehicles.length})
          </button>
          <button
            onClick={() => setFilter('ACTIVE')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: filter === 'ACTIVE' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: filter === 'ACTIVE' ? '#10b981' : '#94a3b8'
            }}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter('INACTIVE')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: filter === 'INACTIVE' ? '#1e293b' : 'transparent',
              color: filter === 'INACTIVE' ? '#f59e0b' : '#94a3b8'
            }}
          >
            Inactive ({inactiveCount})
          </button>
          <button
            onClick={() => setFilter('BLACKLISTED')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: filter === 'BLACKLISTED' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
              color: filter === 'BLACKLISTED' ? '#ef4444' : '#94a3b8'
            }}
          >
            Blacklisted ({blacklistedCount})
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={15} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#64748b'
          }} />
          <input
            type="text"
            placeholder="Search by registration number, owner name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              backgroundColor: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '0 12px 0 36px',
              fontSize: '12px',
              color: '#f8fafc'
            }}
          />
        </div>
      </div>

      {/* Main Table */}
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
              <th style={{ padding: '14px 18px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Registration No.</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Owner Name</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Associated Person</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Type</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Valid Till</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.map((v, idx) => (
              <tr
                key={v.id || idx}
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
                      width: '40px',
                      height: '32px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      backgroundColor: '#1e293b'
                    }}>
                      <img
                        src="/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png"
                        alt={v.plate_number}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <span className="plate-number" style={{ color: '#f8fafc', fontWeight: 700 }}>
                      {v.plate_number}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '14px 18px', color: '#e2e8f0', fontWeight: 500 }}>
                  {v.owner_name}
                </td>
                <td style={{ padding: '14px 18px', color: '#94a3b8' }}>
                  {v.associated_person}
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#94a3b8',
                    fontSize: '12px'
                  }}>
                    {v.vehicle_type === 'Bike' ? <Bike size={14} /> : <Car size={14} />}
                    {v.vehicle_type}
                  </span>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  {v.status === 'Active' ? (
                    <span style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '99px',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      Active
                    </span>
                  ) : v.status === 'Blacklisted' ? (
                    <span style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      color: '#ef4444',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '99px',
                      border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}>
                      Blacklisted
                    </span>
                  ) : (
                    <span style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      color: '#f59e0b',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '99px',
                      border: '1px solid rgba(245, 158, 11, 0.3)'
                    }}>
                      Inactive
                    </span>
                  )}
                </td>
                <td style={{ padding: '14px 18px', color: '#64748b', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                  {v.valid_till}
                </td>
                <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      onClick={() => onSelectVehicle(v)}
                      title="Inspect Vehicle"
                      style={{ background: 'none', color: '#94a3b8', padding: '4px' }}
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      title="Edit Vehicle"
                      style={{ background: 'none', color: '#94a3b8', padding: '4px' }}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      title="Remove / Revoke"
                      style={{ background: 'none', color: '#ef4444', padding: '4px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Add Vehicle */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(6px)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '480px',
            backgroundColor: '#0f172a',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Register New Vehicle
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  License Plate Number (HSRP)
                </label>
                <input
                  type="text"
                  placeholder="e.g. MP07AB1234"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '40px',
                    backgroundColor: '#111827',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '0 12px',
                    fontSize: '13px',
                    fontFamily: 'var(--font-mono)',
                    color: '#f8fafc',
                    textTransform: 'uppercase'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Owner Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Rajesh Gupta"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '40px',
                    backgroundColor: '#111827',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '0 12px',
                    fontSize: '13px',
                    color: '#f8fafc'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Associated Person / Designation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arin Gupta (Student - Roll #0101CS221045)"
                  value={newAssociated}
                  onChange={(e) => setNewAssociated(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    backgroundColor: '#111827',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '0 12px',
                    fontSize: '13px',
                    color: '#f8fafc'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Vehicle Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      backgroundColor: '#111827',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '0 12px',
                      fontSize: '13px',
                      color: '#f8fafc'
                    }}
                  >
                    <option value="Car">Car</option>
                    <option value="Bike">Bike / Two-Wheeler</option>
                    <option value="Bus">Campus Bus / Van</option>
                    <option value="Emergency">Emergency Vehicle</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      backgroundColor: '#111827',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '0 12px',
                      fontSize: '13px',
                      color: '#f8fafc'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    backgroundColor: '#1e293b',
                    color: '#94a3b8',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  Save & Authorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
