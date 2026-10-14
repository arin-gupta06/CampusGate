// CampusGuard API & Data Service

const API_BASE = '/api';

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
export async function getCameras() {
  try {
    const res = await fetch(`${API_BASE}/cameras`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.warn('Backend cameras offline or empty:', err.message);
  }
  // Default to empty array until cameras are configured by user
  return [];
}


export async function getEntries(limit = 20) {
  try {
    const res = await fetch(`${API_BASE}/entries?limit=${limit}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((e, idx) => ({
          id: e.id,
          plate_number: e.plate_number || 'UNKNOWN',
          confidence: e.confidence || 0.90,
          entry_status: e.entry_status,
          review_reason: e.review_reason || 'System captured',
          first_seen_at: e.first_seen_at,
          camera_name: e.entry_gate_camera_id === 'gate-cam-1' ? 'Gate 1 - Main Entry' : 'Gate 2 - Side Entry',
          vehicle_type: 'Car',
          make_model: 'Campus Vehicle',
          color: 'White',
          owner_name: 'Registered Visitor',
          associated_person: 'Campus Member',
          image_url: idx % 2 === 0 ? '/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png' : '/assets/ChatGPT Image Sep 27, 2026, 11_17_25 AM.png',
          timeline: [
            { time: new Date(e.first_seen_at).toLocaleTimeString(), location: 'Entry Gate', action: e.entry_status, status: e.entry_status.toLowerCase() }
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
          plate_number: v.plate_number,
          owner_name: v.owner_name,
          associated_person: `${v.owner_name} (${v.role})`,
          vehicle_type: v.vehicle_type || 'Car',
          status: v.is_active ? 'Active' : 'Inactive',
          valid_till: '31 Dec 2026',
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
    const res = await fetch(`${API_BASE}/authorized`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicle)
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error('Error adding authorized vehicle:', err);
  }
  return { ...vehicle, id: Date.now() };
}

// WebSocket Live Feed Connector
export function connectLiveFeed(onMessage, onStatusChange) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.hostname}:8000/ws/live-feed`;
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
