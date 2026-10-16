import React, { useState, useMemo } from 'react';
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
  Check,
  Users,
  GraduationCap,
  Briefcase,
  Phone,
  Mail,
  UserCheck,
  Grid,
  List,
  Layers,
  Shield,
  Calendar,
  AlertTriangle,
  User
} from 'lucide-react';
import { MOCK_ALL_USERS } from '../services/api';

export default function VehiclesView({
  vehicles = [],
  onAddVehicle,
  onSelectVehicle,
  onUpdateVehicle,
  onDeleteVehicle
}) {
  // Navigation & View Mode
  const [viewMode, setViewMode] = useState('unified'); // 'unified' | 'vehicles' | 'members'
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'STUDENT' | 'FACULTY' | 'GUARD' | 'ADMIN'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED'
  const [search, setSearch] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserModal, setSelectedUserModal] = useState(null);

  // Add Modal Form State
  const [addCategory, setAddCategory] = useState('vehicle'); // 'vehicle' | 'member'
  const [newPlate, setNewPlate] = useState('');
  const [newName, setNewName] = useState('');
  const [isSelfOwned, setIsSelfOwned] = useState(true);
  const [newOwner, setNewOwner] = useState('');
  const [newOwnerRelation, setNewOwnerRelation] = useState('Parent / Guardian');
  const [newRole, setNewRole] = useState('Student');
  const [newRollNumber, setNewRollNumber] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+91 ');
  const [newType, setNewType] = useState('Car');
  const [newDepartment, setNewDepartment] = useState('Computer Science');
  const [newModel, setNewModel] = useState('Hyundai i20');

  // Local state for registered campus members (seeded with MOCK_ALL_USERS)
  const [membersList, setMembersList] = useState(MOCK_ALL_USERS);

  // Combine dynamic vehicles & member directory into an integrated dataset
  const combinedRoster = useMemo(() => {
    const list = [];
    const processedPlates = new Set();
    const processedMemberIds = new Set();

    // 1. First, build records from dynamic vehicles list
    (vehicles || []).forEach((v, idx) => {
      const rawPlate = v?.plate_number || v?.registration_number || '';
      const plate = String(rawPlate).toUpperCase().trim();
      if (plate) {
        processedPlates.add(plate);
      }

      // Check if a member in membersList has this plate or name
      const matchedMember = membersList.find(m =>
        (m.vehicles && m.vehicles.some(p => p && String(p).toUpperCase().trim() === plate)) ||
        (m.name && v.associated_person && String(v.associated_person).toLowerCase().includes(String(m.name).toLowerCase())) ||
        (m.name && v.owner_name && String(v.owner_name).toLowerCase().includes(String(m.name).toLowerCase()))
      );

      if (matchedMember) {
        processedMemberIds.add(matchedMember.id);
      }

      // Determine distinct display fields for Member vs Owner
      const memberName = matchedMember ? matchedMember.name : (v.associated_person || v.owner_name || 'Campus Member');
      const ownerName = v.owner_name || (matchedMember ? matchedMember.name : memberName);
      const isDifferentOwner = Boolean(ownerName && memberName && String(ownerName).toLowerCase().trim() !== String(memberName).toLowerCase().trim());

      const role = matchedMember ? matchedMember.role : (v.associated_person?.includes('Faculty') ? 'Faculty' : v.associated_person?.includes('Staff') ? 'Staff' : 'Student');
      const userType = matchedMember ? matchedMember.userType : (role === 'Faculty' || role === 'Staff' ? 'FACULTY' : 'STUDENT');
      const email = matchedMember ? matchedMember.email : `${String(memberName).toLowerCase().replace(/[^a-z0-9]/g, '.')}@mits.ac.in`;
      const phone = matchedMember ? matchedMember.phone : '+91 98260 00000';
      const rollNumber = matchedMember ? matchedMember.rollNumber : (userType === 'STUDENT' ? `0101CS221${100 + idx}` : `FAC-${idx + 10}`);
      const department = v.department || matchedMember?.department || 'Engineering';

      const initials = String(memberName)
        .split(' ')
        .filter(n => !n.startsWith('Dr.'))
        .map(n => n[0] || '')
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'CM';

      list.push({
        id: v.id || `veh-m-${idx}`,
        vehicleRef: v,
        memberRef: matchedMember || null,
        plate_number: plate,
        owner_name: ownerName,
        associated_person: v.associated_person || memberName,
        memberName,
        isDifferentOwner,
        role,
        userType,
        email,
        phone,
        rollNumber,
        department,
        initials,
        vehicle_type: v.vehicle_type || 'Car',
        model: matchedMember?.vehicleType || `${v.vehicle_type || 'Car'} Standard`,
        status: v.status || 'Active',
        valid_till: v.valid_till || '31 Dec 2026',
        hasVehicle: true
      });
    });

    // 2. Add remaining campus members (who don't have vehicles or vehicles not in list, e.g. Guards, Admins, Pedestrians)
    membersList.forEach((m) => {
      if (!processedMemberIds.has(m.id)) {
        const hasPlate = m.vehicles && m.vehicles.length > 0;
        const plate = hasPlate ? m.vehicles[0] : null;

        list.push({
          id: m.id,
          vehicleRef: hasPlate ? {
            id: m.id,
            plate_number: plate,
            owner_name: m.name,
            associated_person: m.name,
            vehicle_type: m.vehicleType?.includes('Bike') ? 'Bike' : 'Car',
            status: m.passStatus.includes('Active') ? 'Active' : 'Inactive',
            valid_till: m.validTill,
            department: m.department
          } : null,
          memberRef: m,
          plate_number: plate,
          owner_name: hasPlate ? m.name : 'N/A',
          associated_person: m.name,
          memberName: m.name,
          isDifferentOwner: false,
          role: m.role,
          userType: m.userType,
          email: m.email,
          phone: m.phone,
          rollNumber: m.rollNumber,
          department: m.department,
          initials: m.initials,
          vehicle_type: m.vehicleType?.includes('Bike') ? 'Bike' : (hasPlate ? 'Car' : 'None'),
          model: m.vehicleType || 'Pedestrian / Duty Staff',
          status: m.passStatus.includes('Active') ? 'Active' : (m.passStatus.includes('Super') ? 'Active' : 'Inactive'),
          valid_till: m.validTill,
          hasVehicle: Boolean(hasPlate)
        });
      }
    });

    return list;
  }, [vehicles, membersList]);

  // Filtering Logic
  const filteredRoster = useMemo(() => {
    return combinedRoster.filter(item => {
      // Role Filter
      let matchesRole = true;
      if (roleFilter === 'STUDENT') matchesRole = item.userType === 'STUDENT';
      else if (roleFilter === 'FACULTY') matchesRole = item.userType === 'FACULTY' || item.userType === 'STAFF';
      else if (roleFilter === 'GUARD') matchesRole = item.userType === 'GUARD';
      else if (roleFilter === 'ADMIN') matchesRole = item.userType === 'ADMIN';

      // Status Filter
      let matchesStatus = true;
      if (statusFilter === 'ACTIVE') matchesStatus = item.status === 'Active';
      else if (statusFilter === 'INACTIVE') matchesStatus = item.status === 'Inactive';
      else if (statusFilter === 'BLACKLISTED') matchesStatus = item.status === 'Blacklisted';

      // Search Query
      const q = search.toLowerCase().trim();
      const matchesSearch = !q ||
        (item.plate_number && String(item.plate_number).toLowerCase().includes(q)) ||
        (item.memberName && String(item.memberName).toLowerCase().includes(q)) ||
        (item.owner_name && String(item.owner_name).toLowerCase().includes(q)) ||
        (item.rollNumber && String(item.rollNumber).toLowerCase().includes(q)) ||
        (item.department && String(item.department).toLowerCase().includes(q)) ||
        (item.email && String(item.email).toLowerCase().includes(q));

      return matchesRole && matchesStatus && matchesSearch;
    });
  }, [combinedRoster, roleFilter, statusFilter, search]);

  // Counts for Badges
  const totalCount = combinedRoster.length;
  const vehiclesCount = combinedRoster.filter(i => i.hasVehicle).length;
  const studentCount = combinedRoster.filter(i => i.userType === 'STUDENT').length;
  const facultyCount = combinedRoster.filter(i => i.userType === 'FACULTY' || i.userType === 'STAFF').length;
  const guardCount = combinedRoster.filter(i => i.userType === 'GUARD').length;
  const adminCount = combinedRoster.filter(i => i.userType === 'ADMIN').length;
  const activeCount = combinedRoster.filter(i => i.status === 'Active').length;
  const blacklistedCount = combinedRoster.filter(i => i.status === 'Blacklisted').length;

  // Handle Add Form Submission
  const handleFormSubmit = (e) => {
    e.preventDefault();

    const actualOwner = isSelfOwned ? newName.trim() : (newOwner.trim() || newName.trim());

    if (addCategory === 'vehicle') {
      if (!newPlate || !newName) return;
      const formattedPlate = newPlate.toUpperCase().trim();

      onAddVehicle({
        id: Date.now(),
        plate_number: formattedPlate,
        owner_name: actualOwner,
        associated_person: `${newName.trim()} (${newRole})`,
        vehicle_type: newType,
        department: newDepartment,
        status: 'Active',
        valid_till: '31 Dec 2026'
      });

      // Also create member record if not exists
      const newMemberObj = {
        id: `usr-${Date.now()}`,
        name: newName.trim(),
        role: newRole,
        userType: newRole === 'Student' ? 'STUDENT' : (newRole === 'Guard' ? 'GUARD' : newRole === 'Admin' ? 'ADMIN' : 'FACULTY'),
        department: newDepartment,
        rollNumber: newRollNumber.trim() || `ID-${Math.floor(1000 + Math.random() * 9000)}`,
        email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, '.')}@mits.ac.in`,
        phone: newPhone.trim() || '+91 98260 00000',
        vehicles: [formattedPlate],
        vehicleType: `${newType} (${newModel})`,
        passStatus: 'Active',
        validTill: '31 Dec 2026',
        semester: newRole === 'Student' ? 'Enrolled' : 'Staff Member',
        lastSeen: 'Registered Today',
        initials: newName.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'UN'
      };
      setMembersList(prev => [newMemberObj, ...prev]);
    } else {
      // Member only
      if (!newName) return;
      const newMemberObj = {
        id: `usr-${Date.now()}`,
        name: newName.trim(),
        role: newRole,
        userType: newRole === 'Student' ? 'STUDENT' : (newRole === 'Guard' ? 'GUARD' : newRole === 'Admin' ? 'ADMIN' : 'FACULTY'),
        department: newDepartment,
        rollNumber: newRollNumber.trim() || `ID-${Math.floor(1000 + Math.random() * 9000)}`,
        email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, '.')}@mits.ac.in`,
        phone: newPhone.trim() || '+91 98260 00000',
        vehicles: newPlate ? [newPlate.toUpperCase().trim()] : [],
        vehicleType: newPlate ? `${newType} (${newModel})` : 'Pedestrian / Duty Staff',
        passStatus: 'Active',
        validTill: '31 Dec 2026',
        semester: newRole === 'Student' ? 'Enrolled' : 'Staff Member',
        lastSeen: 'Registered Today',
        initials: newName.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'UN'
      };
      setMembersList(prev => [newMemberObj, ...prev]);

      if (newPlate) {
        onAddVehicle({
          id: Date.now(),
          plate_number: newPlate.toUpperCase().trim(),
          owner_name: actualOwner,
          associated_person: `${newName.trim()} (${newRole})`,
          vehicle_type: newType,
          department: newDepartment,
          status: 'Active',
          valid_till: '31 Dec 2026'
        });
      }
    }

    // Reset Form
    setNewPlate('');
    setNewName('');
    setIsSelfOwned(true);
    setNewOwner('');
    setNewRollNumber('');
    setNewEmail('');
    setNewPhone('+91 ');
    setShowAddModal(false);
  };

  // Trigger vehicle inspection
  const handleInspectVehicle = (item) => {
    if (!item.hasVehicle || !onSelectVehicle) return;
    const vRef = item.vehicleRef || {
      plate_number: item.plate_number,
      owner_name: item.owner_name,
      associated_person: item.associated_person,
      vehicle_type: item.vehicle_type,
      status: item.status,
      valid_till: item.valid_till
    };
    onSelectVehicle(vRef);
  };

  // Trigger member details modal
  const handleOpenMemberModal = (item) => {
    setSelectedUserModal({
      name: item.memberName,
      initials: item.initials,
      role: item.role,
      userType: item.userType,
      department: item.department,
      rollNumber: item.rollNumber,
      email: item.email,
      phone: item.phone,
      vehicles: item.plate_number ? [item.plate_number] : [],
      vehicleType: item.model,
      passStatus: item.status === 'Active' ? 'Active Pass' : item.status,
      validTill: item.valid_till,
      ownerName: item.owner_name,
      isDifferentOwner: item.isDifferentOwner
    });
  };

  // Delete vehicle/member
  const handleDeleteItem = (item) => {
    if (item.plate_number && onDeleteVehicle) {
      if (window.confirm(`Revoke gate pass and delete record for plate "${item.plate_number}"?`)) {
        onDeleteVehicle(item.plate_number);
        setMembersList(prev => prev.filter(m => !m.vehicles?.includes(item.plate_number)));
      }
    } else {
      if (window.confirm(`Remove campus member "${item.memberName}" from roster?`)) {
        setMembersList(prev => prev.filter(m => m.id !== item.id));
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Vehicles & Users Roster
            </h2>
            <span style={{
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: '99px'
            }}>
              Unified Directory
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Integrated directory separating vehicle owners, campus drivers, gate passes, and security personnel
          </p>
        </div>

        {/* View Mode & Add Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* View Mode Switcher */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '3px'
          }}>
            <button
              onClick={() => setViewMode('unified')}
              title="Unified Master Roster"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: viewMode === 'unified' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'unified' ? 'var(--accent-primary-text)' : 'var(--text-secondary)'
              }}
            >
              <Layers size={14} />
              <span>Unified Table</span>
            </button>
            <button
              onClick={() => setViewMode('vehicles')}
              title="Vehicle-Centric Cards"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: viewMode === 'vehicles' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'vehicles' ? 'var(--accent-primary-text)' : 'var(--text-secondary)'
              }}
            >
              <Car size={14} />
              <span>Vehicles</span>
            </button>
            <button
              onClick={() => setViewMode('members')}
              title="Member-Centric Profiles"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: viewMode === 'members' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'members' ? 'var(--accent-primary-text)' : 'var(--text-secondary)'
              }}
            >
              <Users size={14} />
              <span>Members</span>
            </button>
          </div>

          {/* Add Entry Button */}
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-primary-text)',
              borderRadius: '10px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-card)',
              transition: 'opacity 0.15s ease',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
            <span>Register Entry</span>
          </button>
        </div>
      </div>

      {/* Metric Counters Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '12px'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-main)'
          }}>
            <Users size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Campus Roster
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
              {totalCount}
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-main)'
          }}>
            <Car size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Registered Vehicles
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
              {vehiclesCount}
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981'
          }}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Active Gate Passes
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>
              {activeCount}
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: blacklistedCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-card-subtle)',
            border: blacklistedCount > 0 ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: blacklistedCount > 0 ? '#ef4444' : 'var(--text-muted)'
          }}>
            <ShieldAlert size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Blacklisted / Flagged
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: blacklistedCount > 0 ? '#ef4444' : 'var(--text-main)' }}>
              {blacklistedCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        backgroundColor: 'var(--bg-card)',
        padding: '10px 14px',
        borderRadius: '14px',
        border: '1px solid var(--border-subtle)'
      }}>
        {/* Role Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginRight: '4px', textTransform: 'uppercase' }}>
            Role:
          </span>
          <button
            onClick={() => setRoleFilter('ALL')}
            style={{
              padding: '5px 11px',
              borderRadius: '7px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: roleFilter === 'ALL' ? 'var(--accent-primary)' : 'var(--bg-card-subtle)',
              color: roleFilter === 'ALL' ? 'var(--accent-primary-text)' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setRoleFilter('STUDENT')}
            style={{
              padding: '5px 11px',
              borderRadius: '7px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: roleFilter === 'STUDENT' ? 'var(--accent-primary)' : 'var(--bg-card-subtle)',
              color: roleFilter === 'STUDENT' ? 'var(--accent-primary-text)' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
          >
            Students ({studentCount})
          </button>
          <button
            onClick={() => setRoleFilter('FACULTY')}
            style={{
              padding: '5px 11px',
              borderRadius: '7px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: roleFilter === 'FACULTY' ? 'var(--accent-primary)' : 'var(--bg-card-subtle)',
              color: roleFilter === 'FACULTY' ? 'var(--accent-primary-text)' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
          >
            Faculty & Staff ({facultyCount})
          </button>
          <button
            onClick={() => setRoleFilter('GUARD')}
            style={{
              padding: '5px 11px',
              borderRadius: '7px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: roleFilter === 'GUARD' ? 'var(--accent-primary)' : 'var(--bg-card-subtle)',
              color: roleFilter === 'GUARD' ? 'var(--accent-primary-text)' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
          >
            Guards ({guardCount})
          </button>
          <button
            onClick={() => setRoleFilter('ADMIN')}
            style={{
              padding: '5px 11px',
              borderRadius: '7px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: roleFilter === 'ADMIN' ? 'var(--accent-primary)' : 'var(--bg-card-subtle)',
              color: roleFilter === 'ADMIN' ? 'var(--accent-primary-text)' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
          >
            Admins ({adminCount})
          </button>
        </div>

        {/* Status Filters & Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px', justifyContent: 'flex-end' }}>
          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              height: '36px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0 10px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-main)',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Pass Only</option>
            <option value="INACTIVE">Inactive / Expired</option>
            <option value="BLACKLISTED">Blacklisted</option>
          </select>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={14} style={{
              position: 'absolute',
              left: '11px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
            <input
              type="text"
              placeholder="Search member, owner, plate, dept..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                height: '36px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0 12px 0 34px',
                fontSize: '12px',
                color: 'var(--text-main)',
                outline: 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* MAIN VIEW MODE 1: UNIFIED MASTER TABLE */}
      {viewMode === 'unified' && (
        <div 
          className="table-scroll-container"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
            overflowX: 'auto',
            overflowY: 'hidden',
            boxShadow: 'var(--shadow-card)',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <table style={{ width: '100%', minWidth: '1280px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)'
              }}>
                <th style={{ padding: '14px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '220px' }}>
                  Campus Member / Driver
                </th>
                <th style={{ padding: '14px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '190px' }}>
                  Vehicle Title Owner
                </th>
                <th style={{ padding: '14px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '130px' }}>
                  Role & ID
                </th>
                <th style={{ padding: '14px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '150px' }}>
                  Department
                </th>
                <th style={{ padding: '14px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '210px' }}>
                  Vehicle & License Plate
                </th>
                <th style={{ padding: '14px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '120px' }}>
                  Pass Status
                </th>
                <th style={{ padding: '14px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '120px' }}>
                  Valid Till
                </th>
                <th style={{ padding: '14px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', minWidth: '200px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No matching records found for "{search || roleFilter}".
                  </td>
                </tr>
              ) : (
                filteredRoster.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      fontSize: '13px',
                      transition: 'background 0.15s ease',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* 1. SEPARATE FIELD: Campus Member (Driver / Pass Holder) */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          onClick={() => handleOpenMemberModal(item)}
                          title="Click to view full member profile"
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--bg-card-subtle)',
                            border: '1.5px solid var(--border-medium)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: 800,
                            color: 'var(--text-main)',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          {item.initials}
                        </div>
                        <div>
                          <div
                            onClick={() => handleOpenMemberModal(item)}
                            style={{
                              color: 'var(--text-main)',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {item.memberName}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                            {item.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. SEPARATE FIELD: Vehicle Title Owner */}
                    <td style={{ padding: '14px 16px' }}>
                      {item.hasVehicle ? (
                        item.isDifferentOwner ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                              {item.owner_name}
                            </div>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: '#3b82f6',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              border: '1px solid rgba(59, 130, 246, 0.25)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              width: 'fit-content'
                            }}>
                              Registered Title Holder
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                              {item.memberName}
                            </span>
                            <span style={{
                              fontSize: '10px',
                              color: 'var(--text-muted)',
                              backgroundColor: 'var(--bg-card-subtle)',
                              border: '1px solid var(--border-subtle)',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontWeight: 600
                            }}>
                              Self-Owned
                            </span>
                          </div>
                        )
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
                          — (No Vehicle)
                        </span>
                      )}
                    </td>

                    {/* 3. Role & ID */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{
                          width: 'fit-content',
                          backgroundColor:
                            item.userType === 'STUDENT' ? 'rgba(59, 130, 246, 0.12)' :
                            item.userType === 'GUARD' ? 'rgba(16, 185, 129, 0.12)' :
                            item.userType === 'ADMIN' ? 'rgba(139, 92, 246, 0.12)' :
                            'rgba(245, 158, 11, 0.12)',
                          color:
                            item.userType === 'STUDENT' ? '#3b82f6' :
                            item.userType === 'GUARD' ? '#10b981' :
                            item.userType === 'ADMIN' ? '#8b5cf6' :
                            '#d97706',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '4px'
                        }}>
                          {item.role}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {item.rollNumber}
                        </span>
                      </div>
                    </td>

                    {/* 4. Department */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {item.department}
                    </td>

                    {/* 5. Vehicle & Plate */}
                    <td style={{ padding: '14px 16px' }}>
                      {item.hasVehicle && item.plate_number ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {/* Mini Thumbnail */}
                          <div style={{
                            width: '36px',
                            height: '28px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            backgroundColor: 'var(--bg-card-subtle)',
                            border: '1px solid var(--border-subtle)',
                            flexShrink: 0
                          }}>
                            <img
                              src="/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png"
                              alt={item.plate_number}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="plate-number" style={{
                                fontSize: '12px',
                                fontWeight: 800,
                                color: 'var(--text-main)',
                                letterSpacing: '0.5px'
                              }}>
                                {item.plate_number}
                              </span>
                              {item.vehicle_type === 'Bike' ? (
                                <Bike size={13} style={{ color: 'var(--text-muted)' }} />
                              ) : (
                                <Car size={13} style={{ color: 'var(--text-muted)' }} />
                              )}
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {item.model}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
                          Pedestrian / Duty Staff
                        </span>
                      )}
                    </td>

                    {/* 6. Pass Status */}
                    <td style={{ padding: '14px 16px' }}>
                      {item.status === 'Active' ? (
                        <span style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          color: '#10b981',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '99px',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                          Active
                        </span>
                      ) : item.status === 'Blacklisted' ? (
                        <span style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.12)',
                          color: '#ef4444',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '99px',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                          Blacklisted
                        </span>
                      ) : (
                        <span style={{
                          backgroundColor: 'rgba(245, 158, 11, 0.12)',
                          color: '#d97706',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '99px',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#d97706' }} />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* 7. Valid Till */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {item.valid_till}
                    </td>

                    {/* 8. Actions */}
                    <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap', minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        {item.hasVehicle && (
                          <button
                            onClick={() => handleInspectVehicle(item)}
                            title="Inspect Vehicle & Timeline"
                            style={{
                              backgroundColor: 'var(--bg-card-subtle)',
                              color: 'var(--text-main)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '6px',
                              padding: '5px 8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <Eye size={13} />
                            <span>Inspect</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenMemberModal(item)}
                          title="View Member Profile"
                          style={{
                            backgroundColor: 'transparent',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <Users size={13} />
                          <span>Profile</span>
                        </button>

                        <button
                          onClick={() => handleDeleteItem(item)}
                          title="Revoke / Remove"
                          style={{
                            backgroundColor: 'transparent',
                            color: '#ef4444',
                            border: '1px solid transparent',
                            borderRadius: '6px',
                            padding: '5px',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MAIN VIEW MODE 2: VEHICLE CARDS PERSPECTIVE */}
      {viewMode === 'vehicles' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px'
        }}>
          {filteredRoster.filter(i => i.hasVehicle).map((item, idx) => (
            <div
              key={item.id || idx}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '14px',
                border: '1px solid var(--border-subtle)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: 'var(--shadow-card)',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '46px',
                    height: '36px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <img
                      src="/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png"
                      alt={item.plate_number}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div>
                    <span className="plate-number" style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      display: 'block'
                    }}>
                      {item.plate_number}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {item.model}
                    </span>
                  </div>
                </div>

                <span style={{
                  backgroundColor: item.status === 'Active' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: item.status === 'Active' ? '#10b981' : '#ef4444',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '99px'
                }}>
                  {item.status}
                </span>
              </div>

              {/* Explicit Separated Fields: Vehicle Title Owner vs Campus Member / Driver */}
              <div style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '8px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Vehicle Title Owner:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.owner_name}</span>
                    {item.isDifferentOwner && (
                      <span style={{ fontSize: '10px', color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '1px 5px', borderRadius: '3px' }}>
                        Title Holder
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Campus Member / Driver:</span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{item.memberName} ({item.role})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Department:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.department}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Pass Expiry:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{item.valid_till}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <button
                  onClick={() => handleInspectVehicle(item)}
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-primary-text)',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Eye size={14} />
                  <span>Inspect Vehicle</span>
                </button>
                <button
                  onClick={() => handleOpenMemberModal(item)}
                  style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Profile
                </button>
                <button
                  onClick={() => handleDeleteItem(item)}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#ef4444',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MAIN VIEW MODE 3: MEMBER PROFILES PERSPECTIVE */}
      {viewMode === 'members' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {filteredRoster.map((item, idx) => (
            <div
              key={item.id || idx}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '14px',
                border: '1px solid var(--border-subtle)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-card-subtle)',
                  border: '2px solid var(--border-medium)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: 'var(--text-main)'
                }}>
                  {item.initials}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: 'var(--text-main)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.memberName}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {item.rollNumber} • {item.role}
                  </div>
                </div>
                <span style={{
                  backgroundColor: item.status === 'Active' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  color: item.status === 'Active' ? '#10b981' : '#d97706',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '99px'
                }}>
                  {item.status}
                </span>
              </div>

              {/* Explicit Separated Fields in Member Card */}
              <div style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '8px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Department:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.department}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{item.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Linked Plate:</span>
                  <span style={{ fontWeight: 700, color: item.hasVehicle ? 'var(--text-main)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {item.plate_number || 'None (Pedestrian)'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Vehicle Owner:</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                    {item.hasVehicle ? (item.isDifferentOwner ? `${item.owner_name} (External Title)` : 'Self-Owned') : 'N/A'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleOpenMemberModal(item)}
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-primary-text)',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  View Full Profile
                </button>
                {item.hasVehicle && (
                  <button
                    onClick={() => handleInspectVehicle(item)}
                    title="Inspect Vehicle"
                    style={{
                      backgroundColor: 'var(--bg-card-subtle)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Eye size={13} />
                    <span>Car</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: REGISTER NEW ENTRY (SEPARATE CAMPUS MEMBER & VEHICLE OWNER FIELDS) */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '520px',
            maxWidth: '96vw',
            maxHeight: '92vh',
            overflowY: 'auto',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            boxShadow: 'var(--shadow-elevated)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Register New Campus Record
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                  Register vehicle authorizations with distinct owner and driver identities
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Registration Category Switcher */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              backgroundColor: 'var(--bg-surface)',
              padding: '4px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '16px'
            }}>
              <button
                type="button"
                onClick={() => setAddCategory('vehicle')}
                style={{
                  padding: '7px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  backgroundColor: addCategory === 'vehicle' ? 'var(--accent-primary)' : 'transparent',
                  color: addCategory === 'vehicle' ? 'var(--accent-primary-text)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Vehicle & Driver Pass
              </button>
              <button
                type="button"
                onClick={() => setAddCategory('member')}
                style={{
                  padding: '7px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  backgroundColor: addCategory === 'member' ? 'var(--accent-primary)' : 'transparent',
                  color: addCategory === 'member' ? 'var(--accent-primary-text)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Member Profile Only
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Field 1: Campus Member / Driver Name */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Campus Member / Authorized Driver Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arin Gupta"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '38px',
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

              {/* Field 2: Vehicle Title Owner (Explicitly separate) */}
              {addCategory === 'vehicle' && (
                <div style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '10px',
                  padding: '12px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 700 }}>
                      Vehicle Title Owner Details
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isSelfOwned}
                        onChange={(e) => setIsSelfOwned(e.target.checked)}
                      />
                      <span>Self-Owned (Driver is Owner)</span>
                    </label>
                  </div>

                  {!isSelfOwned && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                          Legal Owner Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Dr. Rajesh Gupta"
                          value={newOwner}
                          onChange={(e) => setNewOwner(e.target.value)}
                          required={!isSelfOwned}
                          style={{
                            width: '100%',
                            height: '36px',
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '6px',
                            padding: '0 10px',
                            fontSize: '12px',
                            color: 'var(--text-main)'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                          Relationship to Member
                        </label>
                        <select
                          value={newOwnerRelation}
                          onChange={(e) => setNewOwnerRelation(e.target.value)}
                          style={{
                            width: '100%',
                            height: '36px',
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '6px',
                            padding: '0 8px',
                            fontSize: '12px',
                            color: 'var(--text-main)'
                          }}
                        >
                          <option value="Parent / Guardian">Parent / Guardian</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Relative">Relative</option>
                          <option value="Company / University Lease">Company / University Lease</option>
                          <option value="Commercial Provider">Commercial Provider</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Campus Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    style={{
                      width: '100%',
                      height: '38px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0 10px',
                      fontSize: '12px',
                      color: 'var(--text-main)'
                    }}
                  >
                    <option value="Student">Student</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Staff">Staff</option>
                    <option value="Guard">Security Guard</option>
                    <option value="Admin">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Roll # / Employee ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0101CS221045"
                    value={newRollNumber}
                    onChange={(e) => setNewRollNumber(e.target.value)}
                    style={{
                      width: '100%',
                      height: '38px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0 12px',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-main)'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Department / Branch
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science & Engineering"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0 12px',
                    fontSize: '13px',
                    color: 'var(--text-main)'
                  }}
                />
              </div>

              {/* Vehicle specific fields */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  License Plate Number {addCategory === 'vehicle' ? '(Required)' : '(Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. MP07AB1234"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  required={addCategory === 'vehicle'}
                  style={{
                    width: '100%',
                    height: '38px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0 12px',
                    fontSize: '13px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-main)',
                    textTransform: 'uppercase'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Vehicle Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    style={{
                      width: '100%',
                      height: '38px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0 10px',
                      fontSize: '12px',
                      color: 'var(--text-main)'
                    }}
                  >
                    <option value="Car">Car</option>
                    <option value="Bike">Bike / Two-Wheeler</option>
                    <option value="Bus">Campus Bus / Van</option>
                    <option value="Emergency">Emergency Vehicle</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Vehicle Make / Model
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hyundai i20"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    style={{
                      width: '100%',
                      height: '38px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0 12px',
                      fontSize: '13px',
                      color: 'var(--text-main)'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--bg-card-subtle)',
                    color: 'var(--text-secondary)',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-primary-text)',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Save & Authorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: USER PROFILE DETAILS MODAL (SEPARATING OWNER & MEMBER FIELDS) */}
      {selectedUserModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          zIndex: 160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '480px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            boxShadow: 'var(--shadow-elevated)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-card-subtle)',
                border: '2px solid var(--border-medium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--text-main)'
              }}>
                {selectedUserModal.initials}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {selectedUserModal.name}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {selectedUserModal.role} • {selectedUserModal.department}
                </span>
              </div>
              <button
                onClick={() => setSelectedUserModal(null)}
                style={{ background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Campus Member / Driver:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{selectedUserModal.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vehicle Title Owner:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>
                  {selectedUserModal.ownerName ? (
                    selectedUserModal.isDifferentOwner ? (
                      <span>{selectedUserModal.ownerName} <span style={{ fontSize: '11px', color: '#3b82f6' }}>(External / Parent)</span></span>
                    ) : (
                      <span>{selectedUserModal.name} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(Self-Owned)</span></span>
                    )
                  ) : 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Roll / Employee ID:</span>
                <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{selectedUserModal.rollNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                <span style={{ color: 'var(--text-main)' }}>{selectedUserModal.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                <span style={{ color: 'var(--text-main)' }}>{selectedUserModal.phone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Registered Plate(s):</span>
                <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {selectedUserModal.vehicles?.join(', ') || 'None (Pedestrian)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vehicle Model:</span>
                <span style={{ color: 'var(--text-main)' }}>{selectedUserModal.vehicleType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pass Validity:</span>
                <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{selectedUserModal.validTill}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Gate Authorization:</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>{selectedUserModal.passStatus}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedUserModal(null)}
              style={{
                width: '100%',
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-primary-text)',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                marginTop: '20px',
                cursor: 'pointer'
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
