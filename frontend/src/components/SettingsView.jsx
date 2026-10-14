import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  Search,
  Save,
  Trash2,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Edit3,
  ArrowLeft,
  ShieldCheck,
  User,
  Car,
  CheckCircle2
} from 'lucide-react';

export default function SettingsView({
  vehicles = [],
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  initialView = 'overview' // 'overview' or 'form'
}) {
  const [currentView, setCurrentView] = useState(initialView);
  const [copied, setCopied] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Active Path in Form: 'NEW_REGISTRATION' vs 'UPDATE_DELETE' (Mutually Exclusive)
  const [activePath, setActivePath] = useState('NEW_REGISTRATION');

  // QR Code URL pointing to application environment form
  const portalUrl = `${window.location.origin}/?tab=settings&view=form`;

  // Path 1 (New Registration) Form State
  const [newName, setNewName] = useState('');
  const [newRollNo, setNewRollNo] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDepartment, setNewDepartment] = useState('Computer Science & Engineering');
  const [newRole, setNewRole] = useState('Student');
  const [newPlate, setNewPlate] = useState('');
  const [newType, setNewType] = useState('Car');
  const [newModel, setNewModel] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newValidTill, setNewValidTill] = useState('31 Dec 2026');

  // Path 2 (Update / Deletion) Form State
  const [selectedPlate, setSelectedPlate] = useState(vehicles[0]?.plate_number || '');
  const [editOwner, setEditOwner] = useState(vehicles[0]?.owner_name || '');
  const [editRollNo, setEditRollNo] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDepartment, setEditDepartment] = useState(vehicles[0]?.department || 'Computer Science');
  const [editType, setEditType] = useState(vehicles[0]?.vehicle_type || 'Car');
  const [editStatus, setEditStatus] = useState(vehicles[0]?.status || 'Active');
  const [editValidTill, setEditValidTill] = useState(vehicles[0]?.valid_till || '31 Dec 2026');

  // Sync when initialView prop changes
  useEffect(() => {
    if (initialView) {
      setCurrentView(initialView);
    }
  }, [initialView]);

  // Sync selected vehicle in Path 2
  const handleSelectPlate = (plate) => {
    setSelectedPlate(plate);
    const found = vehicles.find(v => v.plate_number === plate);
    if (found) {
      setEditOwner(found.owner_name || '');
      setEditRollNo(found.associated_person || '');
      setEditDepartment(found.department || 'Computer Science');
      setEditType(found.vehicle_type || 'Car');
      setEditStatus(found.status || 'Active');
      setEditValidTill(found.valid_till || '31 Dec 2026');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Submit Path 1: New Vehicle Registration
  const handleRegisterNewVehicle = (e) => {
    e.preventDefault();
    if (!newPlate.trim() || !newName.trim()) return;

    if (onAddVehicle) {
      onAddVehicle({
        plate_number: newPlate.toUpperCase().trim(),
        owner_name: newName.trim(),
        associated_person: `${newName.trim()} (${newRole}${newRollNo ? ` - ${newRollNo.trim()}` : ''})`,
        department: newDepartment,
        vehicle_type: newType,
        make_model: newModel.trim() || `${newType}`,
        color: newColor.trim() || 'White',
        status: 'Active',
        valid_till: newValidTill,
        email: newEmail.trim(),
        phone: newPhone.trim()
      });
    }

    setSuccessToast(`Vehicle ${newPlate.toUpperCase()} registered into college database!`);
    // Clear new registration form
    setNewName('');
    setNewRollNo('');
    setNewEmail('');
    setNewPhone('');
    setNewPlate('');
    setNewModel('');
    setNewColor('');
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // Submit Path 2: Update Existing Vehicle
  const handleUpdateExistingVehicle = (e) => {
    e.preventDefault();
    if (!selectedPlate) return;

    if (onUpdateVehicle) {
      onUpdateVehicle({
        plate_number: selectedPlate,
        owner_name: editOwner,
        associated_person: editRollNo,
        department: editDepartment,
        vehicle_type: editType,
        status: editStatus,
        valid_till: editValidTill,
        phone: editPhone
      });
    }

    setSuccessToast(`Record for ${selectedPlate} updated in college database!`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // Submit Path 2: Delete Existing Vehicle
  const handleDeleteExistingVehicle = () => {
    if (!selectedPlate) return;
    if (window.confirm(`Permanently revoke and delete vehicle ${selectedPlate} from the college database?`)) {
      if (onDeleteVehicle) {
        onDeleteVehicle(selectedPlate);
      }
      setSuccessToast(`Vehicle ${selectedPlate} deleted from college database.`);
      const remaining = vehicles.filter(v => v.plate_number !== selectedPlate);
      if (remaining.length > 0) {
        handleSelectPlate(remaining[0].plate_number);
      } else {
        setSelectedPlate('');
        setEditOwner('');
      }
      setTimeout(() => setSuccessToast(''), 4000);
    }
  };

  // ============================================================
  // VIEW 1: THE DEDICATED APPLICATION FORM VIEW
  // (Sidebar and Navbar remain intact; no background clutter seen)
  // ============================================================
  if (currentView === 'form') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxWidth: '860px',
        margin: '0 auto'
      }}>
        {/* Top Header & Back Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            onClick={() => setCurrentView('overview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#1e293b',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={15} />
            <span>Back to Settings & QR Overview</span>
          </button>

          <span style={{ fontSize: '12px', color: '#64748b' }}>
            College Vehicle Access Management System
          </span>
        </div>

        {/* Success Alert Banner */}
        {successToast && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            color: '#10b981',
            borderRadius: '10px',
            padding: '12px 18px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={18} />
            <span>{successToast}</span>
          </div>
        )}

        {/* Form Main Card */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '28px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          {/* Two-Path Mode Switcher (Mutually Exclusive: Only one enabled at a time!) */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              fontSize: '12px',
              color: '#94a3b8',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              marginBottom: '10px'
            }}>
              Select Operation Mode (Mutually Exclusive)
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              backgroundColor: '#070b14',
              padding: '6px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              {/* Path A Button */}
              <button
                type="button"
                onClick={() => setActivePath('NEW_REGISTRATION')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  backgroundColor: activePath === 'NEW_REGISTRATION' ? '#2563eb' : 'transparent',
                  color: activePath === 'NEW_REGISTRATION' ? '#ffffff' : '#64748b',
                  boxShadow: activePath === 'NEW_REGISTRATION' ? '0 4px 14px rgba(37, 99, 235, 0.4)' : 'none',
                  cursor: 'pointer'
                }}
              >
                <PlusCircle size={16} />
                <span>1. New Vehicle Registration</span>
              </button>

              {/* Path B Button */}
              <button
                type="button"
                onClick={() => setActivePath('UPDATE_DELETE')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  backgroundColor: activePath === 'UPDATE_DELETE' ? '#334155' : 'transparent',
                  color: activePath === 'UPDATE_DELETE' ? '#38bdf8' : '#64748b',
                  boxShadow: activePath === 'UPDATE_DELETE' ? '0 4px 14px rgba(0, 0, 0, 0.4)' : 'none',
                  cursor: 'pointer'
                }}
              >
                <Edit3 size={16} />
                <span>2. Update & Deletion Path</span>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* PATH A: NEW VEHICLE REGISTRATION (Enabled when Path A active) */}
          {/* ======================================================== */}
          {activePath === 'NEW_REGISTRATION' && (
            <form onSubmit={handleRegisterNewVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#93c5fd'
              }}>
                ℹ️ <strong>New Vehicle Registration Enabled:</strong> Enter student/faculty credentials and vehicle specifications to issue a new automated gate entry pass into the college database.
              </div>

              {/* Section 1: User Details */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} color="#3b82f6" />
                  <span>Applicant / User Details</span>
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Arin Gupta"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
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
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                      Student Roll No. / Employee ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 0101CS221045"
                      value={newRollNo}
                      onChange={(e) => setNewRollNo(e.target.value)}
                      style={{
                        width: '100%',
                        height: '40px',
                        backgroundColor: '#111827',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '0 12px',
                        fontSize: '13px',
                        fontFamily: 'var(--font-mono)',
                        color: '#f8fafc'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                      College Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. arin.gupta@mits.ac.in"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
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
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                      Phone / Mobile Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98260 12345"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
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
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                      Branch / Department
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

                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                      User Category
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
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
                      <option value="Student">Student</option>
                      <option value="Faculty">Faculty</option>
                      <option value="Staff">Administrative Staff</option>
                      <option value="Visitor">Official Guest / Visitor</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Vehicle Details */}
              <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Car size={16} color="#10b981" />
                  <span>Vehicle Specifications</span>
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                      License Plate Number (HSRP) *
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
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        borderRadius: '8px',
                        padding: '0 12px',
                        fontSize: '14px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: '#38bdf8',
                        textTransform: 'uppercase'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                      Vehicle Classification
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
                      <option value="Car">Car / Sedan / SUV</option>
                      <option value="Bike">Two-Wheeler / Motorcycle</option>
                      <option value="Bus">Campus Bus / Van</option>
                      <option value="Commercial">Commercial / Delivery</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                      Vehicle Make & Model
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hyundai i20 / Royal Enfield"
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
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
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                      Vehicle Color
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. White / Black / Silver"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
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
              </div>

              {/* Action Button for Path A */}
              <div style={{ marginTop: '10px' }}>
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    padding: '13px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                    cursor: 'pointer'
                  }}
                >
                  <PlusCircle size={18} />
                  <span>Register Vehicle in College Database</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* PATH B: UPDATE & DELETION (Enabled when Path B active)   */}
          {/* ======================================================== */}
          {activePath === 'UPDATE_DELETE' && (
            <form onSubmit={handleUpdateExistingVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#fde68a'
              }}>
                ✏️ <strong>Update & Deletion Path Enabled:</strong> Lookup any existing registered vehicle to update owner contact, pass validity, or revoke/delete vehicle records from the college database.
              </div>

              {/* Step 1: Select Registered Vehicle from College DB */}
              <div>
                <label style={{ fontSize: '12px', color: '#f8fafc', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  1. Select Registered Vehicle Plate from College Database
                </label>
                <select
                  value={selectedPlate}
                  onChange={(e) => handleSelectPlate(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    backgroundColor: '#111827',
                    border: '1px solid #38bdf8',
                    borderRadius: '8px',
                    padding: '0 12px',
                    fontSize: '14px',
                    fontFamily: 'var(--font-mono)',
                    color: '#38bdf8',
                    fontWeight: 700
                  }}
                >
                  {vehicles.map(v => (
                    <option key={v.plate_number} value={v.plate_number}>
                      {v.plate_number} — {v.owner_name} ({v.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Editable User and Vehicle Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Owner Full Name
                  </label>
                  <input
                    type="text"
                    value={editOwner}
                    onChange={(e) => setEditOwner(e.target.value)}
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
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Roll No / Designation / Note
                  </label>
                  <input
                    type="text"
                    value={editRollNo}
                    onChange={(e) => setEditRollNo(e.target.value)}
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
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Branch / Department
                  </label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
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
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Vehicle Type
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
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
                    <option value="Car">Car / Sedan / SUV</option>
                    <option value="Bike">Two-Wheeler / Bike</option>
                    <option value="Bus">Campus Bus / Van</option>
                    <option value="Commercial">Commercial / Delivery</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Gate Pass Authorization Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      backgroundColor: '#111827',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '0 12px',
                      fontSize: '13px',
                      color: editStatus === 'Active' ? '#10b981' : editStatus === 'Blacklisted' ? '#ef4444' : '#f59e0b',
                      fontWeight: 700
                    }}
                  >
                    <option value="Active">🟢 Active (Clearance Auto-Granted)</option>
                    <option value="Inactive">🟡 Inactive / Review Required</option>
                    <option value="Blacklisted">🔴 Blacklisted (Gate Siren / Block)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Pass Expiry Validity Date
                  </label>
                  <input
                    type="text"
                    value={editValidTill}
                    onChange={(e) => setEditValidTill(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      backgroundColor: '#111827',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '0 12px',
                      fontSize: '13px',
                      fontFamily: 'var(--font-mono)',
                      color: '#f8fafc'
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons for Path B */}
              <div style={{ display: 'flex', gap: '14px', marginTop: '10px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1.5,
                    backgroundColor: '#10b981',
                    color: '#000',
                    padding: '13px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Save size={16} />
                  <span>Save & Update Existing Record</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeleteExistingVehicle}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    padding: '13px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={16} />
                  <span>Revoke / Delete Vehicle</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // VIEW 2: THE SETTINGS SPLIT VIEW (QR CODE + QUICK ACTIONS)
  // ============================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
          Settings & Vehicle Pass Administration
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
          Self-service mobile QR registration and direct vehicle database CRUD console
        </p>
      </div>

      {successToast && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          color: '#10b981',
          borderRadius: '10px',
          padding: '12px 18px',
          fontSize: '13px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Split View Container */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.25fr',
        gap: '24px'
      }}>
        {/* LEFT PANEL: Custom QR Code Registration Hub */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          padding: '26px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px'
          }}>
            <Smartphone size={20} color="#3b82f6" />
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Mobile Self-Service QR Access
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '380px', marginBottom: '20px', lineHeight: 1.5 }}>
            Scan this QR code with any phone camera to launch the custom registration & update form right in the application.
          </p>

          {/* QR Code Container */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '16px',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(59, 130, 246, 0.25)',
            marginBottom: '20px'
          }}>
            <QRCodeSVG
              value={portalUrl}
              size={180}
              level="H"
              includeMargin={false}
            />
          </div>

          <div style={{
            backgroundColor: '#0a0f1d',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#10b981',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            marginBottom: '16px',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            SCAN WITH PHONE CAMERA
          </div>

          {/* Direct Launch Button into the Application Form */}
          <button
            onClick={() => setCurrentView('form')}
            style={{
              width: '100%',
              backgroundColor: '#2563eb',
              color: '#fff',
              padding: '12px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              marginBottom: '12px',
              cursor: 'pointer'
            }}
          >
            <ExternalLink size={16} />
            <span>Open Application Registration Form</span>
          </button>

          {/* Shareable Link Input with Copy */}
          <div style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#111827',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '4px 8px'
          }}>
            <input
              type="text"
              readOnly
              value={portalUrl}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                fontSize: '11px',
                color: '#94a3b8',
                fontFamily: 'var(--font-mono)'
              }}
            />
            <button
              onClick={handleCopyLink}
              style={{
                background: 'none',
                color: copied ? '#10b981' : '#38bdf8',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: Quick CRUD Overview Console */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          padding: '26px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Quick Vehicle Update & Deletion Console
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Lookup existing records to modify authorization or remove vehicle passes
            </p>
          </div>

          <form onSubmit={handleUpdateExistingVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Select Vehicle Registration Number
              </label>
              <select
                value={selectedPlate}
                onChange={(e) => handleSelectPlate(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  backgroundColor: '#111827',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: '8px',
                  padding: '0 12px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  color: '#f8fafc',
                  fontWeight: 700
                }}
              >
                {vehicles.map(v => (
                  <option key={v.plate_number} value={v.plate_number}>
                    {v.plate_number} — {v.owner_name} ({v.status})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Owner Full Name
                </label>
                <input
                  type="text"
                  value={editOwner}
                  onChange={(e) => setEditOwner(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
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
                  Associated Roll No / Designation
                </label>
                <input
                  type="text"
                  value={editRollNo}
                  onChange={(e) => setEditRollNo(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Branch / Department
                </label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
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
                  Vehicle Type
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    backgroundColor: '#111827',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '0 10px',
                    fontSize: '13px',
                    color: '#f8fafc'
                  }}
                >
                  <option value="Car">Car / SUV</option>
                  <option value="Bike">Bike / Two-Wheeler</option>
                  <option value="Bus">Campus Bus / Shuttle</option>
                  <option value="Commercial">Commercial / Delivery</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Pass Authorization Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    backgroundColor: '#111827',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '0 10px',
                    fontSize: '13px',
                    color: editStatus === 'Active' ? '#10b981' : editStatus === 'Blacklisted' ? '#ef4444' : '#f59e0b',
                    fontWeight: 600
                  }}
                >
                  <option value="Active">🟢 Active (Gate Access Granted)</option>
                  <option value="Inactive">🟡 Inactive / Review Needed</option>
                  <option value="Blacklisted">🔴 Blacklisted (Gate Intercept)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Pass Expiry Date
                </label>
                <input
                  type="text"
                  value={editValidTill}
                  onChange={(e) => setEditValidTill(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    backgroundColor: '#111827',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '0 12px',
                    fontSize: '13px',
                    fontFamily: 'var(--font-mono)',
                    color: '#f8fafc'
                  }}
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                style={{
                  flex: 1.5,
                  backgroundColor: '#10b981',
                  color: '#000',
                  padding: '11px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Save size={16} />
                <span>Save & Update Database</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteExistingVehicle}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  padding: '11px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={16} />
                <span>Delete Vehicle</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
