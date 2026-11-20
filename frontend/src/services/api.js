// CampusGuard API & Data Service

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const MOCK_HOURLY_TRAFFIC = [
  { hour: '06:00', ingress: 14, egress: 4, authorized: 12, alerts: 2 },
  { hour: '07:00', ingress: 38, egress: 8, authorized: 35, alerts: 3 },
  { hour: '08:00', ingress: 94, egress: 15, authorized: 88, alerts: 6 },
  { hour: '09:00', ingress: 142, egress: 28, authorized: 130, alerts: 12 },
  { hour: '10:00', ingress: 118, egress: 45, authorized: 110, alerts: 8 },
  { hour: '11:00', ingress: 65, egress: 52, authorized: 61, alerts: 4 },
  { hour: '12:00', ingress: 78, egress: 70, authorized: 72, alerts: 6 },
  { hour: '13:00', ingress: 89, egress: 82, authorized: 83, alerts: 6 },
  { hour: '14:00', ingress: 58, egress: 48, authorized: 55, alerts: 3 },
  { hour: '15:00', ingress: 72, egress: 65, authorized: 68, alerts: 4 },
  { hour: '16:00', ingress: 84, egress: 112, authorized: 79, alerts: 5 },
  { hour: '17:00', ingress: 45, egress: 154, authorized: 42, alerts: 3 },
  { hour: '18:00', ingress: 28, egress: 95, authorized: 26, alerts: 2 },
  { hour: '19:00', ingress: 19, egress: 42, authorized: 18, alerts: 1 }
];

export const MOCK_VEHICLE_TYPE_DISTRIBUTION = [
  { name: 'Cars / Sedans / SUVs', value: 168, color: '#3b82f6' },
  { name: 'Bikes / Two-Wheelers', value: 74, color: '#10b981' },
  { name: 'Campus Buses / Vans', value: 14, color: '#f59e0b' },
  { name: 'Emergency / Service', value: 6, color: '#8b5cf6' }
];

export const MOCK_TRANSIT_DURATION = [
  { corridor: 'Gate 1 -> Road', expectedSec: 45, actualSec: 52, status: 'Normal Flow' },
  { corridor: 'Gate 2 -> Road', expectedSec: 35, actualSec: 38, status: 'Normal Flow' },
  { corridor: 'Road -> Parking Zone A', expectedSec: 60, actualSec: 68, status: 'Normal Flow' },
  { corridor: 'Road -> Faculty Parking', expectedSec: 40, actualSec: 92, status: 'Congestion / Loitering' }
];

// Rich User Dataset: Students with vehicles, faculty, guards, admins
export const MOCK_ALL_USERS = [
  {
    id: 'usr-001',
    name: 'Arin Gupta',
    role: 'Student',
    userType: 'STUDENT',
    department: 'Computer Science & Engineering',
    rollNumber: '0101CS221045',
    email: 'arin.gupta@mits.ac.in',
    phone: '+91 98260 12345',
    vehicles: ['MP07AB1234'],
    vehicleType: 'Car (Hyundai i20)',
    passStatus: 'Active',
    validTill: '31 Dec 2026',
    semester: '7th Semester',
    lastSeen: 'Today, 10:42 AM',
    initials: 'AG'
  },
  {
    id: 'usr-002',
    name: 'Priya Sharma',
    role: 'Student',
    userType: 'STUDENT',
    department: 'Electronics & Communication',
    rollNumber: '0101EC221088',
    email: 'priya.sharma@mits.ac.in',
    phone: '+91 98261 54321',
    vehicles: ['MP07CD5678'],
    vehicleType: 'Bike (Royal Enfield 350)',
    passStatus: 'Active',
    validTill: '31 Dec 2026',
    semester: '5th Semester',
    lastSeen: 'Today, 10:41 AM',
    initials: 'PS'
  },
  {
    id: 'usr-003',
    name: 'Dr. Amit Verma',
    role: 'Faculty',
    userType: 'FACULTY',
    department: 'Mechanical Engineering',
    rollNumber: 'FAC-MECH-042',
    email: 'amit.verma@mits.ac.in',
    phone: '+91 94251 98765',
    vehicles: ['MP07EF9012'],
    vehicleType: 'Car (Maruti Suzuki Swift)',
    passStatus: 'Active',
    validTill: '31 Dec 2027',
    semester: 'Professor / HOD',
    lastSeen: 'Today, 10:40 AM',
    initials: 'AV'
  },
  {
    id: 'usr-004',
    name: 'Rohan Singh',
    role: 'Student',
    userType: 'STUDENT',
    department: 'Civil Engineering',
    rollNumber: '0101CE211019',
    email: 'rohan.singh@mits.ac.in',
    phone: '+91 97520 88990',
    vehicles: ['MP07GH3456'],
    vehicleType: 'Car (Hyundai Creta)',
    passStatus: 'Review Needed / Expired',
    validTill: '30 Jun 2026',
    semester: '8th Semester',
    lastSeen: 'Today, 10:39 AM',
    initials: 'RS'
  },
  {
    id: 'usr-005',
    name: 'Vikram Mehta',
    role: 'Staff',
    userType: 'STAFF',
    department: 'Administration & Finance',
    rollNumber: 'STF-ADM-108',
    email: 'vikram.mehta@mits.ac.in',
    phone: '+91 98930 11223',
    vehicles: ['MP07IJ7890'],
    vehicleType: 'Bike (Honda Activa 6G)',
    passStatus: 'Active',
    validTill: '31 Dec 2026',
    semester: 'Accounts Officer',
    lastSeen: 'Today, 09:15 AM',
    initials: 'VM'
  },
  {
    id: 'usr-006',
    name: 'Rajesh Singh',
    role: 'Guard',
    userType: 'GUARD',
    department: 'Campus Security Services',
    rollNumber: 'SEC-GRD-01',
    email: 'guard.gate1@mits.ac.in',
    phone: '+91 91110 55443',
    vehicles: [],
    vehicleType: 'N/A (Stationed at Gate 1)',
    passStatus: 'Active Duty',
    validTill: '31 Dec 2028',
    semester: 'Head Security Guard',
    lastSeen: 'Active Now (Gate 1 Post)',
    initials: 'RS'
  },
  {
    id: 'usr-007',
    name: 'Vivek Dubey',
    role: 'Guard',
    userType: 'GUARD',
    department: 'Campus Security Services',
    rollNumber: 'SEC-GRD-02',
    email: 'guard.gate2@mits.ac.in',
    phone: '+91 91110 55444',
    vehicles: [],
    vehicleType: 'N/A (Stationed at Gate 2)',
    passStatus: 'Active Duty',
    validTill: '31 Dec 2028',
    semester: 'Gate 2 Operator',
    lastSeen: 'Active Now (Gate 2 Post)',
    initials: 'VD'
  },
  {
    id: 'usr-008',
    name: 'System Admin (Control Room)',
    role: 'Admin',
    userType: 'ADMIN',
    department: 'Information Technology / Vision AI',
    rollNumber: 'ADM-SYS-01',
    email: 'admin.vision@mits.ac.in',
    phone: '+91 94000 00001',
    vehicles: [],
    vehicleType: 'N/A (System Operator)',
    passStatus: 'Super Admin',
    validTill: 'Permanent',
    semester: 'IT Systems Lead',
    lastSeen: 'Online Now',
    initials: 'SA'
  }
];

export const MOCK_CAMERAS = [
  {
    id: 'gate-cam-1',
    name: 'Gate 1 - Main Entry',
    role: 'ENTRY_GATE',
    rtsp_url: 'rtsp://192.168.1.101:554/stream1',
    status: 'ONLINE',
    fps: 30,
    resolution: '1920x1080',
    lineCrossing: 'Line (0, 720) -> (1920, 720)',
    confidenceThreshold: 0.85,
    lastActive: 'Just now'
  },
  {
    id: 'gate-cam-2',
    name: 'Gate 2 - Side Entry',
    role: 'ENTRY_GATE',
    rtsp_url: 'rtsp://192.168.1.102:554/stream1',
    status: 'ONLINE',
    fps: 30,
    resolution: '1920x1080',
    lineCrossing: 'Line (0, 680) -> (1920, 680)',
    confidenceThreshold: 0.85,
    lastActive: 'Just now'
  },
  {
    id: 'road-cam-1',
    name: 'Campus Road',
    role: 'INTERNAL_CORRIDOR',
    rtsp_url: 'rtsp://192.168.1.103:554/stream1',
    status: 'ONLINE',
    fps: 25,
    resolution: '1920x1080',
    lineCrossing: 'Speed Tracking Sensor Active',
    confidenceThreshold: 0.80,
    lastActive: 'Just now'
  },
  {
    id: 'park-cam-1',
    name: 'Parking Area',
    role: 'PARKING_LOT',
    rtsp_url: 'rtsp://192.168.1.104:554/stream1',
    status: 'ONLINE',
    fps: 25,
    resolution: '1920x1080',
    lineCrossing: 'Zone Ingress / Egress Line',
    confidenceThreshold: 0.80,
    lastActive: 'Just now'
  }
];

export const MOCK_RECENT_ENTRIES = [
  {
    id: 'ent-101',
    plate_number: 'MP07AB1234',
    confidence: 0.96,
    entry_status: 'AUTHORIZED',
    review_reason: 'Regular student pass',
    first_seen_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    entry_gate_camera_id: 'gate-cam-1',
    camera_name: 'Gate 1 - Main Entry',
    vehicle_type: 'Car',
    make_model: 'Hyundai i20',
    color: 'White',
    owner_name: 'Rajesh Gupta',
    associated_person: 'Arin Gupta (Student)',
    image_url: '/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png',
    timeline: [
      { time: '10:42:15 AM', location: 'Gate 1 - Main Entry', action: 'Entry Verified', status: 'verified' },
      { time: '10:45:22 AM', location: 'Campus Road', action: 'Moving towards academic block', status: 'moving' },
      { time: '10:48:10 AM', location: 'Parking Area', action: 'Parked (Zone A)', status: 'parked' },
      { time: '12:15:22 PM', location: 'Parking Area', action: 'Still parked (3h 27m)', status: 'parked' }
    ]
  },
  {
    id: 'ent-102',
    plate_number: 'MP07CD5678',
    confidence: 0.94,
    entry_status: 'AUTHORIZED',
    review_reason: 'Faculty registered vehicle',
    first_seen_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    entry_gate_camera_id: 'gate-cam-2',
    camera_name: 'Gate 2 - Side Entry',
    vehicle_type: 'Bike',
    make_model: 'Royal Enfield Classic 350',
    color: 'Black',
    owner_name: 'Priya Sharma',
    associated_person: 'Priya Sharma (Student)',
    image_url: '/assets/ChatGPT Image Sep 27, 2026, 11_17_25 AM.png',
    timeline: [
      { time: '10:41:52 AM', location: 'Gate 2 - Side Entry', action: 'Entry Verified', status: 'verified' },
      { time: '10:43:10 AM', location: 'Two-Wheeler Parking', action: 'Parked', status: 'parked' }
    ]
  },
  {
    id: 'ent-103',
    plate_number: 'MP07XY9999',
    confidence: 0.72,
    entry_status: 'FLAGGED_UNLISTED',
    review_reason: 'Vehicle not registered in campus database',
    first_seen_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    entry_gate_camera_id: 'gate-cam-1',
    camera_name: 'Gate 1 - Main Entry',
    vehicle_type: 'Car',
    make_model: 'Honda City',
    color: 'Silver',
    owner_name: 'Unknown Visitor',
    associated_person: 'Unregistered Guest',
    image_url: '/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png',
    timeline: [
      { time: '10:41:28 AM', location: 'Gate 1 - Main Entry', action: 'Alert Sent to Guards - Intercepted', status: 'alert' }
    ]
  },
  {
    id: 'ent-104',
    plate_number: 'MP07EF9012',
    confidence: 0.98,
    entry_status: 'AUTHORIZED',
    review_reason: 'Faculty vehicle clearance',
    first_seen_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    entry_gate_camera_id: 'gate-cam-1',
    camera_name: 'Gate 1 - Main Entry',
    vehicle_type: 'Car',
    make_model: 'Maruti Suzuki Swift',
    color: 'Red',
    owner_name: 'Dr. Amit Verma',
    associated_person: 'Dr. Amit Verma (Faculty)',
    image_url: '/assets/ChatGPT Image Sep 27, 2026, 11_17_25 AM.png',
    timeline: [
      { time: '10:40:11 AM', location: 'Gate 1 - Main Entry', action: 'Entry Verified', status: 'verified' },
      { time: '10:44:05 AM', location: 'Campus Road', action: 'Moving to Admin block', status: 'moving' }
    ]
  },
  {
    id: 'ent-105',
    plate_number: 'MP07GH3456',
    confidence: 0.68,
    entry_status: 'REVIEW_NEEDED',
    review_reason: 'Plate partially obscured / Inactive pass',
    first_seen_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    entry_gate_camera_id: 'gate-cam-2',
    camera_name: 'Gate 2 - Side Entry',
    vehicle_type: 'Car',
    make_model: 'Hyundai Creta',
    color: 'Grey',
    owner_name: 'Sunita Singh',
    associated_person: 'Rohan Singh (Student - Expired Pass)',
    image_url: '/assets/ChatGPT Image Sep 27, 2026, 11_19_51 AM.png',
    timeline: [
      { time: '10:39:47 AM', location: 'Gate 2 - Side Entry', action: 'Under Check at Guard Post', status: 'suspicious' }
    ]
  }
];

export const MOCK_REGISTERED_VEHICLES = [
  {
    id: 1,
    plate_number: 'MP07AB1234',
    owner_name: 'Rajesh Gupta',
    associated_person: 'Arin Gupta (Student)',
    vehicle_type: 'Car',
    status: 'Active',
    valid_till: '31 Dec 2026',
    department: 'Computer Science',
    passes_issued: 1
  },
  {
    id: 2,
    plate_number: 'MP07CD5678',
    owner_name: 'Priya Sharma',
    associated_person: 'Priya Sharma (Student)',
    vehicle_type: 'Bike',
    status: 'Active',
    valid_till: '31 Dec 2026',
    department: 'Electronics',
    passes_issued: 1
  },
  {
    id: 3,
    plate_number: 'MP07EF9012',
    owner_name: 'Dr. Amit Verma',
    associated_person: 'Amit Verma (Faculty)',
    vehicle_type: 'Car',
    status: 'Active',
    valid_till: '31 Dec 2027',
    department: 'Mechanical Eng.',
    passes_issued: 2
  },
  {
    id: 4,
    plate_number: 'MP07GH3456',
    owner_name: 'Sunita Singh',
    associated_person: 'Rohan Singh (Student)',
    vehicle_type: 'Car',
    status: 'Inactive',
    valid_till: '30 Jun 2026',
    department: 'Civil Eng.',
    passes_issued: 1
  },
  {
    id: 5,
    plate_number: 'MP07IJ7890',
    owner_name: 'Vikram Mehta',
    associated_person: 'Vikram Mehta (Staff)',
    vehicle_type: 'Bike',
    status: 'Active',
    valid_till: '31 Dec 2026',
    department: 'Administration',
    passes_issued: 1
  },
  {
    id: 6,
    plate_number: 'MP07KL3210',
    owner_name: 'Ramesh Chander',
    associated_person: 'Suspended Member',
    vehicle_type: 'Car',
    status: 'Blacklisted',
    valid_till: 'Expired',
    department: 'External',
    passes_issued: 0
  }
];

export const MOCK_SECURITY_EVENTS = [
  {
    id: 'evt-201',
    time: '10:41:28 AM',
    vehicle_no: 'MP07XY9999',
    type: 'Unknown',
    camera: 'Gate 1',
    status: 'Open',
    severity: 'high',
    action_taken: 'Alert Sent to Guards',
    image_url: '/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png'
  },
  {
    id: 'evt-202',
    time: '10:39:47 AM',
    vehicle_no: 'MP07GH3456',
    type: 'Suspicious',
    camera: 'Gate 2',
    status: 'Under Check',
    severity: 'medium',
    action_taken: 'Physical Inspection in Progress',
    image_url: '/assets/ChatGPT Image Sep 27, 2026, 11_19_51 AM.png'
  },
  {
    id: 'evt-203',
    time: '10:35:12 AM',
    vehicle_no: 'Not Detected',
    type: 'No Plate',
    camera: 'Campus Road',
    status: 'Open',
    severity: 'high',
    action_taken: 'CCTV Operator Alerted',
    image_url: '/assets/ChatGPT Image Sep 27, 2026, 11_17_25 AM.png'
  },
  {
    id: 'evt-204',
    time: '10:31:05 AM',
    vehicle_no: 'MP07KL3210',
    type: 'Blacklisted',
    camera: 'Gate 1',
    status: 'Blocked',
    severity: 'critical',
    action_taken: 'Barrier Locked Down & Siren Triggered',
    image_url: '/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png'
  },
  {
    id: 'evt-205',
    time: '10:28:19 AM',
    vehicle_no: 'MP07MN6543',
    type: 'Unknown',
    camera: 'Parking',
    status: 'Open',
    severity: 'medium',
    action_taken: 'Patrol dispatched',
    image_url: '/assets/ChatGPT Image Sep 27, 2026, 11_17_25 AM.png'
  }
];

// Real API Fetch Helpers
export async function getEntriesSummary() {
  try {
    const res = await fetch(`${API_BASE}/entries/summary`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend summary offline, using fallback:', err.message);
  }
  return {
    total_entries: 142,
    authorized_count: 128,
    unauthorized_count: 10,
    review_required_count: 4,
    unresolved_count: 0,
    handoff_pending_count: 0
  };
}

export async function getCameras() {
  try {
    const res = await fetch(`${API_BASE}/cameras`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn('Backend cameras offline or empty:', err.message);
  }
  return MOCK_CAMERAS;
}

export async function testCameraConnection(streamUrl, timeout = 3.0) {
  try {
    const token = getStoredAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/cameras/test-connection`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ stream_url: streamUrl, timeout })
    });
    if (res.ok) return await res.json();
    const errData = await res.json().catch(() => null);
    return {
      success: false,
      error: (errData && errData.detail) || `Server error (${res.status})`,
      diagnostics: ['Ensure camera IP or RTSP credentials are correct and port 554/HTTP is open.']
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Network connection failed',
      diagnostics: ['Backend server is offline or unreachable from browser.']
    };
  }
}

export async function addCamera(cam) {
  try {
    const token = getStoredAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/cameras`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: cam.id,
        name: cam.name,
        stream_url: cam.stream_url || cam.rtsp_url,
        physical_role: cam.physical_role || cam.role || 'ENTRY',
        location_description: cam.location_description || cam.name,
        is_active: cam.is_active !== undefined ? cam.is_active : true
      })
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error('Error adding camera:', err);
  }
  return cam;
}

export async function deleteCamera(cameraId) {
  try {
    const token = getStoredAuthToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/cameras/${encodeURIComponent(cameraId)}`, {
      method: 'DELETE',
      headers
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error('Error deleting camera:', err);
  }
  return { status: 'deleted', id: cameraId };
}

export async function getEntries(limit = 30) {
  try {
    const res = await fetch(`${API_BASE}/entries?limit=${limit}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((e, idx) => ({
          id: e.id,
          plate_number: e.registration_number || e.plate_number || 'UNKNOWN',
          confidence: e.confidence || 0.95,
          entry_status: e.authorization_state || e.entry_status || 'AUTHORIZED',
          review_reason: e.review_notes || e.review_reason || 'Campus Gate Ingress Verified',
          first_seen_at: e.first_observed_at || e.first_seen_at || new Date().toISOString(),
          camera_name: e.primary_camera_id === 'gate-cam-2' ? 'Gate 2 - Side Entry' : 'Gate 1 - Main Entry',
          vehicle_type: 'Car',
          make_model: 'Campus Vehicle',
          color: 'White',
          owner_name: 'Registered Member',
          associated_person: 'Campus Resident',
          image_url: idx % 2 === 0 ? '/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png' : '/assets/ChatGPT Image Sep 27, 2026, 11_17_25 AM.png',
          timeline: [
            { time: new Date(e.first_observed_at || e.first_seen_at || Date.now()).toLocaleTimeString(), location: 'Entry Gate', action: e.authorization_state || 'AUTHORIZED', status: (e.authorization_state || 'authorized').toLowerCase() }
          ]
        }));
      }
    }
  } catch (err) {
    console.warn('Backend entries offline, using mock entries:', err.message);
  }
  return MOCK_RECENT_ENTRIES;
}

export async function getAuthorizedVehicles() {
  try {
    const res = await fetch(`${API_BASE}/authorized`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map(v => ({
          id: v.id,
          plate_number: v.registration_number || v.plate_number || 'UNKNOWN',
          owner_name: v.owner_name || 'Campus Member',
          associated_person: `${v.owner_name || 'Member'} (${v.owner_role || v.role || 'Member'})`,
          vehicle_type: v.vehicle_type || 'Car',
          status: v.is_active ? 'Active' : 'Inactive',
          valid_till: v.valid_until ? new Date(v.valid_until).toLocaleDateString() : '31 Dec 2026',
          department: v.department || 'Campus',
          passes_issued: 1
        }));
      }
    }
  } catch (err) {
    console.warn('Backend authorized offline, using mock list:', err.message);
  }
  return MOCK_REGISTERED_VEHICLES;
}

export async function addAuthorizedVehicle(vehicle) {
  try {
    const payload = {
      registration_number: vehicle.registration_number || vehicle.plate_number,
      plate_number: vehicle.registration_number || vehicle.plate_number,
      owner_name: vehicle.owner_name || 'Campus Member',
      owner_role: vehicle.owner_role || (vehicle.associated_person?.includes('Faculty') ? 'FACULTY' : 'STUDENT'),
      department: vehicle.department || 'Campus Community',
      vehicle_type: vehicle.vehicle_type || 'CAR',
      is_active: vehicle.status !== 'Inactive'
    };
    const res = await fetch(`${API_BASE}/authorized`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error('Error adding authorized vehicle:', err);
  }
  return { ...vehicle, id: Date.now() };
}

export async function updateAuthorizedVehicle(plate, data) {
  try {
    const res = await fetch(`${API_BASE}/authorized/${encodeURIComponent(plate)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error('Error updating authorized vehicle:', err);
  }
  return { plate_number: plate, ...data };
}

export async function deleteAuthorizedVehicle(plate) {
  try {
    const res = await fetch(`${API_BASE}/authorized/${encodeURIComponent(plate)}`, {
      method: 'DELETE'
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error('Error deleting authorized vehicle:', err);
  }
  return { status: 'deleted', plate };
}

export async function checkPlateAuthorization(plate) {
  try {
    const res = await fetch(`${API_BASE}/authorized/check/${encodeURIComponent(plate)}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Backend check offline:', err);
  }
  return null;
}

export async function triggerSimulation(payload = {}) {
  try {
    const res = await fetch(`${API_BASE}/vision/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      return data.entry;
    }
  } catch (err) {
    console.warn('Backend simulation offline, using local simulation:', err.message);
  }
  return null;
}

export async function controlBarrier(action = 'OPEN', gateId = 'Gate 1 - Main Ingress', plate = null) {
  try {
    const token = getStoredAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/gate/barrier`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, gate_id: gateId, plate })
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Backend barrier control offline:', err.message);
  }
  return { status: 'success', action, gate_id: gateId };
}

export async function resolveEntryReview(entryId, decision = 'APPROVED', notes = '') {
  try {
    const res = await fetch(`${API_BASE}/entries/reviews/${encodeURIComponent(entryId)}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_decision: decision, notes })
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error('Error resolving entry review:', err);
  }
  return { entry_id: entryId, review_decision: decision };
}

// WebSocket Live Feed Connector
export function connectLiveFeed(onMessage, onStatusChange) {
  const envWs = import.meta.env.VITE_WS_URL;
  let wsUrl;
  if (envWs) {
    wsUrl = envWs.endsWith('/ws/live-feed') ? envWs : `${envWs.replace(/\/$/, '')}/ws/live-feed`;
  } else {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    wsUrl = `${protocol}//${window.location.hostname}:8000/ws/live-feed`;
  }
  let socket = null;
  let retryTimer = null;
  let isClosed = false;

  function connect() {
    try {
      socket = new WebSocket(wsUrl);
      if (onStatusChange) onStatusChange('CONNECTING');

      socket.onopen = () => {
        if (onStatusChange) onStatusChange('CONNECTED');
        console.log('✅ Connected to CampusGuard Live WebSocket Feed');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) onMessage(data);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      socket.onerror = (err) => {
        if (onStatusChange) onStatusChange('ERROR');
      };

      socket.onclose = () => {
        if (onStatusChange) onStatusChange('DISCONNECTED');
        if (!isClosed) {
          retryTimer = setTimeout(connect, 3000);
        }
      };
    } catch (err) {
      if (onStatusChange) onStatusChange('ERROR');
      if (!isClosed) {
        retryTimer = setTimeout(connect, 4000);
      }
    }
  }

  connect();

  return () => {
    isClosed = true;
    if (retryTimer) clearTimeout(retryTimer);
    if (socket) socket.close();
  };
}

// =========================================================================
// OAuth & Authentication Client
// =========================================================================

export function getStoredAuthToken() {
  return localStorage.getItem('campusgate_jwt') || null;
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('campusgate_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredAuth(token, user) {
  if (token) localStorage.setItem('campusgate_jwt', token);
  if (user) localStorage.setItem('campusgate_user', JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem('campusgate_jwt');
  localStorage.removeItem('campusgate_user');
}

export async function fetchAuthPersonas() {
  try {
    const res = await fetch(`${API_BASE}/auth/personas`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Using fallback personas:', e);
  }
  return [
    {
      id: 'usr-student-01',
      email: 'student@campusgate.edu',
      name: 'Arin Gupta',
      role: 'user',
      department: 'Computer Science (Batch 2026)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      vehicles: ['MP07AB1234']
    },
    {
      id: 'usr-guard-01',
      email: 'guard@campusgate.edu',
      name: 'Officer Rajesh Sharma',
      role: 'guard',
      department: 'Main Ingress Gate Security',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      vehicles: []
    },
    {
      id: 'usr-admin-01',
      email: 'admin@campusgate.edu',
      name: 'Dr. Sarah Mitchell',
      role: 'admin',
      department: 'Campus Security & Infrastructure',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      vehicles: ['MP07CD5678']
    }
  ];
}

export async function loginWithOAuth(provider = 'google', personaEmail = null, targetRole = null) {
  try {
    const res = await fetch(`${API_BASE}/auth/oauth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: personaEmail,
        role: targetRole,
        credential: 'mock-oauth-google-token'
      })
    });
    if (res.ok) {
      const data = await res.json();
      setStoredAuth(data.access_token, data.user);
      return data;
    }
  } catch (e) {
    console.error('OAuth request failed:', e);
  }

  // Graceful local offline fallback
  const personas = await fetchAuthPersonas();
  const matched = personas.find(p => p.role === (targetRole || 'user')) || personas[0];
  const fallbackData = {
    access_token: 'mock-jwt-token-campusgate',
    user: matched
  };
  setStoredAuth(fallbackData.access_token, fallbackData.user);
  return fallbackData;
}

export async function fetchUserMonthlyStats() {
  const token = localStorage.getItem('campusgate_jwt');
  try {
    const res = await fetch(`${API_BASE}/auth/me/stats`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Could not fetch user monthly stats:', e);
  }
  return null;
}


