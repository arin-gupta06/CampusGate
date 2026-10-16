import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  PlusCircle,
  Edit3,
  ArrowLeft,
  ShieldCheck,
  User,
  Car,
  CheckCircle2,
  Scan,
  Sparkles,
  Zap
} from 'lucide-react';

export default function SettingsView({
  vehicles = [],
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  initialView = 'overview' // 'overview' (QR only) or 'form'
}) {
  const [currentView, setCurrentView] = useState(initialView);
  const [copied, setCopied] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Active Path in Form: 'NEW_REGISTRATION' vs 'UPDATE_DELETE'
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

    setSuccessToast(`Vehicle ${newPlate.toUpperCase()} successfully registered in campus database!`);
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

    setSuccessToast(`Record for ${selectedPlate} updated in campus database!`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // Submit Path 2: Delete Existing Vehicle
  const handleDeleteExistingVehicle = () => {
    if (!selectedPlate) return;
    if (window.confirm(`Permanently revoke and delete vehicle ${selectedPlate} from the campus database?`)) {
      if (onDeleteVehicle) {
        onDeleteVehicle(selectedPlate);
      }
      setSuccessToast(`Vehicle ${selectedPlate} deleted from campus database.`);
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
  // (Launched by scanning the QR code or clicking "Open Portal Form")
  // ============================================================
  if (currentView === 'form') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxWidth: '820px',
        margin: '0 auto'
      }}>
        {/* Top Header & Back Navigation to QR */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '14px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => setCurrentView('overview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={15} />
            <span>Back to QR Code Hub</span>
          </button>

          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Campus Gate Security Management System
          </span>
        </div>

        {/* Success Alert Banner */}
        {successToast && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
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
          backgroundColor: 'var(--bg-card)',
          borderRadius: '18px',
          border: '1px solid var(--border-subtle)',
          padding: '28px',
          boxShadow: 'var(--shadow-elevated)'
        }}>
          {/* Two-Path Mode Switcher (Mutually Exclusive) */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              marginBottom: '10px'
            }}>
              Select Operation Mode
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              backgroundColor: 'var(--bg-surface)',
              padding: '6px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)'
            }}>
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
                  backgroundColor: activePath === 'NEW_REGISTRATION' ? 'var(--accent-primary)' : 'transparent',
                  color: activePath === 'NEW_REGISTRATION' ? 'var(--accent-primary-text)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <PlusCircle size={16} />
                <span>1. New Vehicle Registration</span>
              </button>

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
                  backgroundColor: activePath === 'UPDATE_DELETE' ? 'var(--accent-primary)' : 'transparent',
                  color: activePath === 'UPDATE_DELETE' ? 'var(--accent-primary-text)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <Edit3 size={16} />
                <span>2. Update & Deletion Path</span>
              </button>
            </div>
          </div>

          {/* PATH A: NEW VEHICLE REGISTRATION */}
          {activePath === 'NEW_REGISTRATION' && (
            <form onSubmit={handleRegisterNewVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                backgroundColor: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                ℹ️ <strong>New Vehicle Registration:</strong> Enter student/faculty credentials and vehicle specifications to issue a new automated gate entry pass.
              </div>

              {/* Section 1: User Details */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} />
                  <span>Applicant / User Details</span>
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
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
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '0 12px',
                        fontSize: '13px',
                        color: 'var(--text-main)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                      Roll No. / Employee ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 0101CS221045"
                      value={newRollNo}
                      onChange={(e) => setNewRollNo(e.target.value)}
                      style={{
                        width: '100%',
                        height: '40px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '0 12px',
                        fontSize: '13px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-main)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
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
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '0 12px',
                        fontSize: '13px',
                        color: 'var(--text-main)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98260 12345"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      style={{
                        width: '100%',
                        height: '40px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '0 12px',
                        fontSize: '13px',
                        color: 'var(--text-main)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                      Branch / Department
                    </label>
                    <input
                      type="text"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      style={{
                        width: '100%',
                        height: '40px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '0 12px',
                        fontSize: '13px',
                        color: 'var(--text-main)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                      User Category
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      style={{
                        width: '100%',
                        height: '40px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '0 12px',
                        fontSize: '13px',
                        color: 'var(--text-main)'
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
              <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Car size={16} />
                  <span>Vehicle Specifications</span>
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
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
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '0 12px',
                        fontSize: '14px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        textTransform: 'uppercase',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                      Vehicle Classification
                    </label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      style={{
                        width: '100%',
                        height: '40px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '0 12px',
                        fontSize: '13px',
                        color: 'var(--text-main)'
                      }}
                    >
                      <option value="Car">Car / Sedan / SUV</option>
                      <option value="Bike">Two-Wheeler / Motorcycle</option>
                      <option value="Bus">Campus Bus / Van</option>
                      <option value="Commercial">Commercial / Delivery</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
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
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '0 12px',
                        fontSize: '13px',
                        color: 'var(--text-main)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
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
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '0 12px',
                        fontSize: '13px',
                        color: 'var(--text-main)',
                        outline: 'none'
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
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-primary-text)',
                    padding: '13px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: 'var(--shadow-card)',
                    cursor: 'pointer'
                  }}
                >
                  <PlusCircle size={18} />
                  <span>Register Vehicle in Campus Database</span>
                </button>
              </div>
            </form>
          )}

          {/* PATH B: UPDATE & DELETION */}
          {activePath === 'UPDATE_DELETE' && (
            <form onSubmit={handleUpdateExistingVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                backgroundColor: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                ✏️ <strong>Update & Deletion Path:</strong> Lookup any existing registered vehicle to update owner contact, pass validity, or revoke/delete vehicle records.
              </div>

              {/* Step 1: Select Registered Vehicle from DB */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  1. Select Registered Vehicle Plate
                </label>
                <select
                  value={selectedPlate}
                  onChange={(e) => handleSelectPlate(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    padding: '0 12px',
                    fontSize: '14px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-main)',
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
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Owner Full Name
                  </label>
                  <input
                    type="text"
                    value={editOwner}
                    onChange={(e) => setEditOwner(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0 12px',
                      fontSize: '13px',
                      color: 'var(--text-main)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Roll No / Designation / Note
                  </label>
                  <input
                    type="text"
                    value={editRollNo}
                    onChange={(e) => setEditRollNo(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0 12px',
                      fontSize: '13px',
                      color: 'var(--text-main)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Branch / Department
                  </label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0 12px',
                      fontSize: '13px',
                      color: 'var(--text-main)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Vehicle Type
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0 12px',
                      fontSize: '13px',
                      color: 'var(--text-main)'
                    }}
                  >
                    <option value="Car">Car / Sedan / SUV</option>
                    <option value="Bike">Two-Wheeler / Bike</option>
                    <option value="Bus">Campus Bus / Shuttle</option>
                    <option value="Commercial">Commercial / Delivery</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Gate Pass Authorization Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
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
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Pass Expiry Validity Date
                  </label>
                  <input
                    type="text"
                    value={editValidTill}
                    onChange={(e) => setEditValidTill(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0 12px',
                      fontSize: '13px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-main)'
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
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-primary-text)',
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
                  <Edit3 size={16} />
                  <span>Save & Update Existing Record</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeleteExistingVehicle}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
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
  // VIEW 2: THE SETTINGS QR-ONLY HUB (CLEAN, NO REDUNDANT FORM)
  // (Both Admin, Guard, and Public users see only the QR Hub here)
  // ============================================================
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      maxWidth: '740px',
      margin: '0 auto',
      width: '100%'
    }}>
      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          Vehicle Pass QR Registration & Access Hub
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
          Scan the official campus QR code to register a vehicle pass, update ownership, or review automated gate clearance
        </p>
      </div>

      {successToast && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
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

      {/* Main QR Code Center Card (Redundant Form Removed Completely) */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '36px 32px',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        boxShadow: 'var(--shadow-elevated)'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-subtle)',
          padding: '4px 12px',
          borderRadius: '99px',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--text-main)',
          marginBottom: '16px'
        }}>
          <Smartphone size={14} />
          <span>Mobile Self-Service Pass Hub</span>
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 8px' }}>
          Scan to Access Registration & Pass Updates
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '480px', marginBottom: '24px', lineHeight: 1.5 }}>
          Point any smartphone camera at this official QR code to open the self-service portal for new vehicle pass applications, ownership transfers, and status updates.
        </p>

        {/* High-Resolution QR Code Container */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '20px',
          borderRadius: '20px',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.08)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <QRCodeSVG
            value={portalUrl}
            size={220}
            level="H"
            includeMargin={false}
          />
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card-subtle)',
          padding: '6px 14px',
          borderRadius: '8px',
          fontSize: '11px',
          color: 'var(--text-main)',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          marginBottom: '24px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Scan size={14} />
          <span>POINT SMARTPHONE CAMERA TO SCAN</span>
        </div>

        {/* Direct Action Button to Launch the Mobile Form */}
        <button
          onClick={() => setCurrentView('form')}
          style={{
            width: '100%',
            maxWidth: '440px',
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--accent-primary-text)',
            padding: '13px 20px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-card)',
            marginBottom: '14px',
            cursor: 'pointer'
          }}
        >
          <ExternalLink size={16} />
          <span>Open Application & Update Portal Directly</span>
        </button>

        {/* Shareable Link Input with One-Click Copy */}
        <div style={{
          width: '100%',
          maxWidth: '440px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          padding: '5px 10px'
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
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              outline: 'none'
            }}
          />
          <button
            onClick={handleCopyLink}
            style={{
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
              color: copied ? '#10b981' : 'var(--text-main)',
              borderRadius: '6px',
              padding: '5px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* 3 Step Workflow Information Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '14px'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Step 1
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
            Instant Camera Scan
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Scan with any native iOS or Android camera app to launch the verified campus portal without installing any app.
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Step 2
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
            Register or Update Pass
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Submit new vehicle details or lookup existing passes to update driver affiliation and renew validity dates.
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Step 3
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
            Instant Gate Clearance
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Database synchronization is instant. Registered plates are recognized immediately at Gate 1 and Gate 2 ANPR cameras.
          </div>
        </div>
      </div>
    </div>
  );
}
