import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';

// ==========================================
// MODELS & INTERFACES
// ==========================================

export interface Site {
  _id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  organizationId: string;
  createdAt: string;
}

export interface Organization {
  _id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'superadmin';
  organizationId?: string;
  organizationName?: string;
  isActive: boolean;
  createdAt: string;
}

export interface User {
  _id: string;
  name: string;
  mobile: string;
  employeeId: string;
  email?: string;
  isActive: boolean;
  assignedSite: Site;
  organization: Organization;
  organizationId: string;
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo: string;
  assignedUserName?: string;
  site: Site;
  organizationId: string;
  updatedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  _id: string;
  userId: string;
  userName: string;
  employeeId: string;
  organizationId: string;
  siteId: string;
  siteName: string;
  signInTime: string;
  signOutTime: string | null;
  latitude: number;
  longitude: number;
  photo?: string;
  signOutLatitude?: number;
  signOutLongitude?: number;
  signOutPhoto?: string;
  status: 'active' | 'completed';
}

export interface SupportTicket {
  _id: string;
  userId: string;
  userName: string;
  organizationId: string;
  message: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-review' | 'resolved';
  assignedTo?: string;
  resolutionNote?: string;
}

export interface LiveLocation {
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: number | string;
  organizationId: string;
}

export interface ShareLink {
  token: string;
  organizationId: string;
  organizationName: string;
  name: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

// ==========================================
// HAVERSINE DISTANCE HELPER
// ==========================================
function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ==========================================
// SEED DATA INITIALIZATION
// ==========================================
const nowIso = new Date().toISOString();

const org1: Organization = {
  _id: 'org1',
  name: 'Acme Enterprise',
  code: 'ACME',
  isActive: true,
  createdAt: '2026-01-10T08:00:00.000Z'
};

const org2: Organization = {
  _id: 'org2',
  name: 'Logistics Prime Global',
  code: 'LPG',
  isActive: true,
  createdAt: '2026-02-15T09:30:00.000Z'
};

const site1: Site = {
  _id: 'site1',
  name: 'HQ Operations - New Delhi',
  latitude: 28.6139,
  longitude: 77.209,
  radiusMeters: 100,
  organizationId: 'org1',
  createdAt: '2026-01-12T10:00:00.000Z'
};

const site2: Site = {
  _id: 'site2',
  name: 'Central Logistics Warehouse - Mumbai',
  latitude: 19.076,
  longitude: 72.8777,
  radiusMeters: 150,
  organizationId: 'org1',
  createdAt: '2026-01-14T11:00:00.000Z'
};

const site3: Site = {
  _id: 'site3',
  name: 'Tech Hub Park - Bengaluru',
  latitude: 12.9716,
  longitude: 77.5946,
  radiusMeters: 120,
  organizationId: 'org2',
  createdAt: '2026-02-18T10:00:00.000Z'
};

const initialAdmins: AdminUser[] = [
  {
    _id: 'adm1',
    name: 'Sarah Jenkins',
    email: 'admin@acme.com',
    password: 'admin123',
    role: 'admin',
    organizationId: 'org1',
    organizationName: 'Acme Enterprise',
    isActive: true,
    createdAt: '2026-01-11T09:00:00.000Z'
  },
  {
    _id: 'adm2',
    name: 'Chief Operations Overseer',
    email: 'superadmin@geotask.com',
    password: 'super123',
    role: 'superadmin',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    _id: 'adm3',
    name: 'Vikram Malhotra',
    email: 'manager@logistics.com',
    password: 'admin123',
    role: 'admin',
    organizationId: 'org2',
    organizationName: 'Logistics Prime Global',
    isActive: true,
    createdAt: '2026-02-16T09:00:00.000Z'
  }
];

const initialUsers: User[] = [
  {
    _id: 'u1',
    name: 'Ravi Kumar',
    mobile: '9990001111',
    employeeId: 'EMP001',
    email: 'ravi.kumar@acme.com',
    isActive: true,
    assignedSite: site1,
    organization: org1,
    organizationId: 'org1',
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    _id: 'u2',
    name: 'Priya Shah',
    mobile: '9990002222',
    employeeId: 'EMP002',
    email: 'priya.shah@acme.com',
    isActive: true,
    assignedSite: site2,
    organization: org1,
    organizationId: 'org1',
    createdAt: '2026-01-16T08:30:00.000Z'
  },
  {
    _id: 'u3',
    name: 'Amit Patel',
    mobile: '9990003333',
    employeeId: 'EMP003',
    email: 'amit.patel@logistics.com',
    isActive: true,
    assignedSite: site3,
    organization: org2,
    organizationId: 'org2',
    createdAt: '2026-02-20T08:30:00.000Z'
  }
];

const initialTasks: Task[] = [
  {
    _id: 't1',
    title: 'Daily Morning Equipment Safety Check',
    description: 'Inspect emergency fire exits, electrical distribution panels, and high-voltage breaker locks.',
    status: 'pending',
    assignedTo: 'u1',
    assignedUserName: 'Ravi Kumar',
    site: site1,
    organizationId: 'org1',
    createdAt: '2026-03-01T06:00:00.000Z'
  },
  {
    _id: 't2',
    title: 'Server Room Climate & Backup Power Audit',
    description: 'Verify dual redundant AC airflow units and log battery UPS load percentages.',
    status: 'pending',
    assignedTo: 'u1',
    assignedUserName: 'Ravi Kumar',
    site: site1,
    organizationId: 'org1',
    createdAt: '2026-03-01T07:00:00.000Z'
  },
  {
    _id: 't3',
    title: 'Inventory Receiving & Pallet Barcode Scan',
    description: 'Receive incoming freight shipment, verify shipping manifest, and log inventory batches.',
    status: 'pending',
    assignedTo: 'u2',
    assignedUserName: 'Priya Shah',
    site: site2,
    organizationId: 'org1',
    createdAt: '2026-03-01T08:00:00.000Z'
  },
  {
    _id: 't4',
    title: 'Dock Forklift Safety Inspection',
    description: 'Check hydraulic pressure, horn, steering, and emergency braking systems on forklift #3.',
    status: 'pending',
    assignedTo: 'u2',
    assignedUserName: 'Priya Shah',
    site: site2,
    organizationId: 'org1',
    createdAt: '2026-03-01T09:00:00.000Z'
  }
];

const initialShareLinks: ShareLink[] = [
  {
    token: 'DEMO-TRACK-2026',
    organizationId: 'org1',
    organizationName: 'Acme Enterprise',
    name: 'Executive Field Oversight Link',
    createdAt: '2026-03-01T00:00:00.000Z',
    expiresAt: '2026-12-31T23:59:59.000Z',
    isActive: true
  }
];

const initialTickets: SupportTicket[] = [
  {
    _id: 'ticket_demo_1',
    userId: 'u1',
    userName: 'Ravi Kumar',
    organizationId: 'org1',
    message: 'Gate sensor #2 intermittent connection upon facility check-in.',
    latitude: 28.614,
    longitude: 77.2091,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    priority: 'high',
    status: 'open',
    assignedTo: 'Sarah Jenkins'
  }
];

// In-Memory Storage Arrays
let organizations: Organization[] = JSON.parse(JSON.stringify([org1, org2]));
let admins: AdminUser[] = JSON.parse(JSON.stringify(initialAdmins));
let sites: Site[] = JSON.parse(JSON.stringify([site1, site2, site3]));
let users: User[] = JSON.parse(JSON.stringify(initialUsers));
let tasks: Task[] = JSON.parse(JSON.stringify(initialTasks));
let attendanceRecords: AttendanceRecord[] = [];
let supportTickets: SupportTicket[] = JSON.parse(JSON.stringify(initialTickets));
let shareLinks: ShareLink[] = JSON.parse(JSON.stringify(initialShareLinks));
const liveLocations = new Map<string, LiveLocation>();
const pendingOtps = new Map<string, { otp: string; requestedAt: Date }>();

export function resetInMemoryData() {
  organizations = JSON.parse(JSON.stringify([org1, org2]));
  admins = JSON.parse(JSON.stringify(initialAdmins));
  sites = JSON.parse(JSON.stringify([site1, site2, site3]));
  users = JSON.parse(JSON.stringify(initialUsers));
  tasks = JSON.parse(JSON.stringify(initialTasks));
  attendanceRecords = [];
  supportTickets = JSON.parse(JSON.stringify(initialTickets));
  shareLinks = JSON.parse(JSON.stringify(initialShareLinks));
  liveLocations.clear();
  pendingOtps.clear();
}

// ==========================================
// EXPRESS & SOCKET.IO CONFIGURATION
// ==========================================
const app = express();
const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Helper to resolve orgId from query, header, or body
function getOrgId(req: express.Request): string {
  return (
    (req.headers['x-org-id'] as string) ||
    (req.query.orgId as string) ||
    (req.body && (req.body.orgId || req.body.organizationId)) ||
    'org1'
  );
}

// Built-in Geocode Dictionary & Presets for instant, offline-capable lookup
const GEO_PRESETS = [
  { name: 'Connaught Place, New Delhi', display_name: 'Connaught Place, Central Delhi, Delhi, India', lat: 28.6315, lon: 77.2167 },
  { name: 'HQ Operations - New Delhi', display_name: 'HQ Operations, India Gate / Central Secretariat, New Delhi, India', lat: 28.6139, lon: 77.2090 },
  { name: 'Central Logistics Warehouse - Mumbai', display_name: 'Central Logistics Port, Bandra Kurla Complex, Mumbai, Maharashtra, India', lat: 19.0760, lon: 72.8777 },
  { name: 'Tech Park Campus - Bengaluru', display_name: 'Electronic City Tech Hub, Bengaluru, Karnataka, India', lat: 12.9716, lon: 77.5946 },
  { name: 'HITEC City Tech Park - Hyderabad', display_name: 'HITEC City Logistics, Hyderabad, Telangana, India', lat: 17.4474, lon: 78.3762 },
  { name: 'Indira Gandhi International Airport (DEL)', display_name: 'IGI Airport Terminal 3, New Delhi, India', lat: 28.5562, lon: 77.1000 },
  { name: 'Chhatrapati Shivaji Maharaj Airport (BOM)', display_name: 'CSM International Airport, Mumbai, India', lat: 19.0896, lon: 72.8656 },
  { name: 'Bandra Kurla Complex (BKC) Mumbai', display_name: 'Bandra Kurla Complex, G Block, Mumbai, India', lat: 19.0664, lon: 72.8687 },
  { name: 'Cyber City - Gurugram', display_name: 'DLF Cyber City, Sector 24, Gurugram, Haryana, India', lat: 28.4950, lon: 77.0895 },
  { name: 'Times Square, New York', display_name: 'Times Square, Manhattan, New York, NY 10036, USA', lat: 40.7580, lon: -73.9855 },
  { name: 'Central Distribution Center - New York', display_name: 'Manhattan Distribution Terminal, New York, NY, USA', lat: 40.7128, lon: -74.0060 },
  { name: 'San Francisco Tech Hub', display_name: 'Market Street Depot, San Francisco, CA, USA', lat: 37.7749, lon: -122.4194 },
  { name: 'London Central Depot', display_name: 'Trafalgar Square & West End Hub, London, UK', lat: 51.5074, lon: -0.1278 },
  { name: 'Heathrow Cargo Terminal - London', display_name: 'Heathrow Airport Cargo Centre, Hounslow, London, UK', lat: 51.4700, lon: -0.4543 },
  { name: 'Dubai Downtown Logistics Hub', display_name: 'Business Bay & Downtown Logistics, Dubai, United Arab Emirates', lat: 25.2048, lon: 55.2708 },
  { name: 'Jebel Ali Port - Dubai', display_name: 'Jebel Ali Free Zone, Dubai, UAE', lat: 24.9857, lon: 55.0740 },
  { name: 'Singapore Changi Air Freight Center', display_name: 'Changi Airport Airfreight Centre, Singapore', lat: 1.3644, lon: 103.9915 },
  { name: 'Tokyo Distribution Hub', display_name: 'Tokyo Bay Logistics Center, Tokyo, Japan', lat: 35.6762, lon: 139.6503 },
  { name: 'Sydney Port Botany Logistics', display_name: 'Port Botany Industrial Depot, Sydney, NSW, Australia', lat: -33.9712, lon: 151.2185 },
  { name: 'Berlin Distribution Center', display_name: 'Mitte Industrial Facility, Berlin, Germany', lat: 52.5200, lon: 13.4050 }
];

// Geocoding Proxy Route — queries OpenStreetMap Nominatim with fast presets fallback
app.get('/api/geocode', async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (!query) {
    return res.json(GEO_PRESETS.slice(0, 6).map((p) => ({
      name: p.name,
      display_name: p.display_name,
      latitude: p.lat,
      longitude: p.lon
    })));
  }

  const queryLower = query.toLowerCase();

  // 1. Check local presets first
  const matchedPresets = GEO_PRESETS.filter(
    (p) => p.name.toLowerCase().includes(queryLower) || p.display_name.toLowerCase().includes(queryLower)
  ).map((p) => ({
    name: p.name,
    display_name: p.display_name,
    latitude: p.lat,
    longitude: p.lon
  }));

  // 2. Fetch from OpenStreetMap Nominatim with strict timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`;
    const osmRes = await fetch(osmUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'GeoTaskEnterpriseDemoApp/1.0 (internal-demo-tool; contact@geotask.local)',
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);

    if (osmRes.ok) {
      const data = (await osmRes.json()) as any[];
      if (Array.isArray(data) && data.length > 0) {
        const osmResults = data.map((item) => ({
          name: item.name || (item.display_name ? item.display_name.split(',')[0] : query),
          display_name: item.display_name || item.name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon)
        })).filter((r) => !isNaN(r.latitude) && !isNaN(r.longitude));

        // Combine presets with OSM results, removing duplicate coordinates
        const combined = [...osmResults];
        matchedPresets.forEach((mp) => {
          if (!combined.some((c) => Math.abs(c.latitude - mp.latitude) < 0.001 && Math.abs(c.longitude - mp.longitude) < 0.001)) {
            combined.push(mp);
          }
        });

        return res.json(combined);
      }
    }
  } catch (err: any) {
    console.warn(`[Geocode Proxy] OSM lookup failed or timed out for "${query}":`, err.message);
  }

  // If OSM returned no items or failed, return matched presets
  if (matchedPresets.length > 0) {
    return res.json(matchedPresets);
  }

  // Fallback: return any presets that partially match words
  const words = queryLower.split(/\s+/).filter(Boolean);
  const fuzzy = GEO_PRESETS.filter((p) => words.some((w) => p.display_name.toLowerCase().includes(w)))
    .map((p) => ({
      name: p.name,
      display_name: p.display_name,
      latitude: p.lat,
      longitude: p.lon
    }));

  return res.json(fuzzy.length > 0 ? fuzzy : GEO_PRESETS.slice(0, 4).map((p) => ({
    name: p.name,
    display_name: p.display_name,
    latitude: p.lat,
    longitude: p.lon
  })));
});

// Reverse Geocode Proxy Route
app.get('/api/geocode/reverse', async (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'Valid lat and lon query params required' });
  }

  // Check preset proximity (within 400m)
  for (const preset of GEO_PRESETS) {
    const dist = calculateHaversineDistanceMeters(lat, lon, preset.lat, preset.lon);
    if (dist < 400) {
      return res.json({
        name: preset.name,
        display_name: preset.display_name
      });
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const osmUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const osmRes = await fetch(osmUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'GeoTaskEnterpriseDemoApp/1.0 (internal-demo-tool; contact@geotask.local)',
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);

    if (osmRes.ok) {
      const data = (await osmRes.json()) as any;
      if (data && (data.display_name || data.name)) {
        const name = data.name || (data.display_name ? data.display_name.split(',')[0] : `Site @ ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        return res.json({
          name,
          display_name: data.display_name || name
        });
      }
    }
  } catch (err: any) {
    console.warn(`[Reverse Geocode Proxy] Lookup failed:`, err.message);
  }

  return res.json({
    name: `Site (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
    display_name: `Location coordinates: ${lat.toFixed(6)}° N, ${lon.toFixed(6)}° E`
  });
});

// Socket.IO Handlers
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Connected: ${socket.id}`);

  // Employee live location beacon
  socket.on('location:update', (data: LiveLocation) => {
    if (!data || !data.userId) return;
    liveLocations.set(data.userId, {
      ...data,
      timestamp: data.timestamp || Date.now()
    });
    io.emit('employee:location', data);
  });

  socket.on('location:stop', (data: { userId: string; organizationId?: string }) => {
    if (!data || !data.userId) return;
    liveLocations.delete(data.userId);
    io.emit('employee:offline', { userId: data.userId });
  });

  socket.on('admin:request-locations', () => {
    socket.emit('admin:all-locations', Array.from(liveLocations.values()));
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Disconnected: ${socket.id}`);
  });
});

// ==========================================
// 1. PUBLIC AUTH & SELF-SERVICE SIGNUP
// ==========================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'geo-task-enterprise-be',
    totalOrgs: organizations.length,
    activeUsersCount: users.length,
    activeLiveLocations: liveLocations.size,
    timestamp: new Date().toISOString()
  });
});

// POST /api/auth/send-otp
app.post('/api/auth/send-otp', (req, res) => {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ error: 'Mobile number is required' });

  const cleanMobile = String(mobile).replace(/\D/g, '');
  const user = users.find((u) => u.mobile.replace(/\D/g, '') === cleanMobile && u.isActive);

  if (!user) {
    return res.status(404).json({ error: 'User not registered with this mobile number or inactive' });
  }

  const otp = '1111';
  pendingOtps.set(user.mobile, { otp, requestedAt: new Date() });
  console.log(`[AUTH] >>> Test OTP for ${user.name} (${user.mobile}): ${otp} <<<`);

  return res.json({
    success: true,
    message: 'OTP sent successfully (Demo OTP: 1111)',
    mobile: user.mobile
  });
});

// POST /api/auth/verify-otp
app.post('/api/auth/verify-otp', (req, res) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp) return res.status(400).json({ error: 'Mobile and OTP are required' });

  const cleanMobile = String(mobile).replace(/\D/g, '');
  const user = users.find((u) => u.mobile.replace(/\D/g, '') === cleanMobile);

  if (!user) return res.status(404).json({ error: 'User not found' });
  if (String(otp).trim() !== '1111') {
    return res.status(400).json({ error: 'Invalid OTP. For prototype demo, enter 1111.' });
  }

  pendingOtps.delete(user.mobile);
  return res.json({
    success: true,
    user
  });
});

// POST /api/admin/login
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const admin = admins.find(
    (a) => a.email.toLowerCase() === String(email).toLowerCase() && a.password === password && a.isActive
  );

  if (!admin) {
    return res.status(401).json({ error: 'Invalid admin credentials or inactive account' });
  }

  return res.json({
    success: true,
    token: `jwt_admin_${admin._id}_${Date.now()}`,
    admin: {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      organizationId: admin.organizationId,
      organizationName: admin.organizationName
    }
  });
});

// POST /api/superadmin/login
app.post('/api/superadmin/login', (req, res) => {
  const { email, password } = req.body;
  const superAdmin = admins.find(
    (a) => a.role === 'superadmin' && a.email.toLowerCase() === String(email).toLowerCase() && a.password === password
  );

  if (!superAdmin) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Super Admin credentials' });
  }

  return res.json({
    success: true,
    token: `jwt_superadmin_${Date.now()}`,
    superAdmin: {
      _id: superAdmin._id,
      name: superAdmin.name,
      email: superAdmin.email,
      role: 'superadmin'
    }
  });
});

// POST /api/signup (Self-Service Org Registration)
app.post('/api/signup', (req, res) => {
  const { orgName, adminName, email, password, mobile, siteName, latitude, longitude, radiusMeters } = req.body;
  if (!orgName || !adminName || !email || !password) {
    return res.status(400).json({ error: 'Organization name, admin name, email, and password are required' });
  }

  const existingAdmin = admins.find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (existingAdmin) {
    return res.status(400).json({ error: 'An admin account with this email already exists' });
  }

  const orgId = `org_${Date.now()}`;
  const newOrg: Organization = {
    _id: orgId,
    name: String(orgName).trim(),
    code: String(orgName).slice(0, 4).toUpperCase(),
    isActive: true,
    createdAt: new Date().toISOString()
  };
  organizations.push(newOrg);

  const newAdmin: AdminUser = {
    _id: `adm_${Date.now()}`,
    name: adminName,
    email: email.toLowerCase(),
    password,
    role: 'admin',
    organizationId: orgId,
    organizationName: newOrg.name,
    isActive: true,
    createdAt: new Date().toISOString()
  };
  admins.push(newAdmin);

  // Auto-create initial default site
  const siteLat = Number(latitude) || 28.6139;
  const siteLng = Number(longitude) || 77.209;
  const newSite: Site = {
    _id: `site_${Date.now()}`,
    name: siteName || `${newOrg.name} Primary Site`,
    latitude: siteLat,
    longitude: siteLng,
    radiusMeters: Number(radiusMeters) || 120,
    organizationId: orgId,
    createdAt: new Date().toISOString()
  };
  sites.push(newSite);

  // Auto-create initial employee account for immediate mobile test
  const newEmp: User = {
    _id: `u_${Date.now()}`,
    name: `${adminName} (Field User)`,
    mobile: mobile || '9998887777',
    employeeId: 'EMP100',
    email,
    isActive: true,
    assignedSite: newSite,
    organization: newOrg,
    organizationId: orgId,
    createdAt: new Date().toISOString()
  };
  users.push(newEmp);

  console.log(`[SIGNUP] Registered organization "${newOrg.name}" with admin "${newAdmin.name}"`);

  return res.json({
    success: true,
    organization: newOrg,
    admin: newAdmin,
    site: newSite,
    initialUser: newEmp,
    token: `jwt_admin_${newAdmin._id}_${Date.now()}`
  });
});

// ==========================================
// 2. EMPLOYEE ATTENDANCE & STATUS
// ==========================================

// POST /api/attendance/sign-in
app.post('/api/attendance/sign-in', (req, res) => {
  const { userId, latitude, longitude, photo } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const user = users.find((u) => u._id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const existingActive = attendanceRecords.find((rec) => rec.userId === userId && !rec.signOutTime);
  if (existingActive) {
    return res.status(400).json({
      error: 'Already signed in',
      activeSession: existingActive
    });
  }

  const signInTime = new Date().toISOString();
  const record: AttendanceRecord = {
    _id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    userName: user.name,
    employeeId: user.employeeId,
    organizationId: user.organizationId || user.organization._id,
    siteId: user.assignedSite._id,
    siteName: user.assignedSite.name,
    signInTime,
    signOutTime: null,
    latitude: Number(latitude) || user.assignedSite.latitude,
    longitude: Number(longitude) || user.assignedSite.longitude,
    photo: photo || '',
    status: 'active'
  };

  attendanceRecords.unshift(record);
  io.emit('attendance:sign-in', record);
  console.log(`[ATTENDANCE] Sign-in recorded for ${user.name} at ${record.siteName}`);

  return res.json({
    success: true,
    signInTime,
    record
  });
});

// POST /api/attendance/sign-out
app.post('/api/attendance/sign-out', (req, res) => {
  const { userId, latitude, longitude, photo } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const activeRecord = attendanceRecords.find((rec) => rec.userId === userId && !rec.signOutTime);
  if (!activeRecord) {
    return res.status(400).json({ error: 'No active sign-in session found to sign out from' });
  }

  const signOutTime = new Date().toISOString();
  activeRecord.signOutTime = signOutTime;
  activeRecord.signOutLatitude = Number(latitude) || activeRecord.latitude;
  activeRecord.signOutLongitude = Number(longitude) || activeRecord.longitude;
  if (photo) activeRecord.signOutPhoto = photo;
  activeRecord.status = 'completed';

  io.emit('attendance:sign-out', activeRecord);
  console.log(`[ATTENDANCE] Sign-out recorded for ${activeRecord.userName}`);

  return res.json({
    success: true,
    signOutTime,
    record: activeRecord
  });
});

// GET /api/attendance/status/:userId
app.get('/api/attendance/status/:userId', (req, res) => {
  const openRecord = attendanceRecords.find((rec) => rec.userId === req.params.userId && !rec.signOutTime);
  return res.json({ activeSession: openRecord || null });
});

// GET /api/attendance/history/:userId (read last 30 records)
app.get('/api/attendance/history/:userId', (req, res) => {
  const history = attendanceRecords
    .filter((r) => r.userId === req.params.userId)
    .slice(0, 30);
  return res.json(history);
});

// ==========================================
// 3. EMPLOYEE USER, TASKS & ACTIVITY
// ==========================================

// GET /api/user/:userId
app.get('/api/user/:userId', (req, res) => {
  const user = users.find((u) => u._id === req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json(user);
});

// GET /api/user/:userId/tasks
app.get('/api/user/:userId/tasks', (req, res) => {
  const userTasks = tasks.filter((t) => t.assignedTo === req.params.userId);
  return res.json(userTasks);
});

// PUT /api/user/tasks/:taskId/status (GEO-FENCE ENFORCED SERVER-SIDE!)
app.put('/api/user/tasks/:taskId/status', (req, res) => {
  const { taskId } = req.params;
  const { status, latitude, longitude } = req.body;

  if (!status || !['pending', 'in-progress', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Valid status ("pending" | "in-progress" | "completed") is required' });
  }

  const task = tasks.find((t) => t._id === taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const assignedUser = users.find((u) => u._id === task.assignedTo);
  const targetSite = task.site || assignedUser?.assignedSite;

  // SERVER-SIDE GEOFENCE ENFORCEMENT
  if (targetSite && latitude !== undefined && longitude !== undefined) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      const distance = calculateHaversineDistanceMeters(lat, lng, targetSite.latitude, targetSite.longitude);
      if (distance > targetSite.radiusMeters) {
        console.warn(`[GEOFENCE REJECTED] Task ${task._id} blocked: ${Math.round(distance)}m > ${targetSite.radiusMeters}m`);
        return res.status(403).json({
          error: `Geofence Violation: You are ${Math.round(distance)}m from ${targetSite.name}. Must be within ${targetSite.radiusMeters}m perimeter to start or complete this task.`
        });
      }
    }
  }

  task.status = status;
  task.updatedAt = new Date().toISOString();
  if (status === 'completed') {
    task.completedAt = new Date().toISOString();
  }

  io.emit('task:update', task);
  console.log(`[TASKS] Task ${task._id} updated to "${status}"`);
  return res.json(task);
});

// GET /api/user/:userId/activity
app.get('/api/user/:userId/activity', (req, res) => {
  const { userId } = req.params;
  const targetDate = (req.query.date as string) || new Date().toISOString().slice(0, 10);

  const userAttendance = attendanceRecords.filter((rec) => {
    if (rec.userId !== userId) return false;
    return rec.signInTime.slice(0, 10) === targetDate;
  });

  const userTasks = tasks.filter((t) => t.assignedTo === userId);

  return res.json({
    userId,
    date: targetDate,
    attendance: userAttendance,
    tasks: userTasks,
    summary: {
      totalAttendanceSessions: userAttendance.length,
      activeSession: userAttendance.find((rec) => !rec.signOutTime) || null,
      completedTasks: userTasks.filter((t) => t.status === 'completed').length,
      inProgressTasks: userTasks.filter((t) => t.status === 'in-progress').length,
      pendingTasks: userTasks.filter((t) => t.status === 'pending').length
    }
  });
});

// POST /api/tickets (Employee Create Ticket)
app.post('/api/tickets', (req, res) => {
  const { userId, message, latitude, longitude, priority } = req.body;
  if (!userId || !message) {
    return res.status(400).json({ error: 'userId and message are required' });
  }

  const user = users.find((u) => u._id === userId);
  const ticket: SupportTicket = {
    _id: `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    userName: user ? user.name : 'Unknown Employee',
    organizationId: user ? user.organizationId || 'org1' : 'org1',
    message: String(message).trim(),
    latitude: Number(latitude) || 0,
    longitude: Number(longitude) || 0,
    createdAt: new Date().toISOString(),
    priority: priority || 'medium',
    status: 'open'
  };

  supportTickets.unshift(ticket);
  io.emit('ticket:new', ticket);
  console.log(`[TICKETS] New ticket lodged by ${ticket.userName}: "${ticket.message.slice(0, 30)}..."`);

  return res.json({ success: true, ticket });
});

// GET /api/tickets/user/:userId
app.get('/api/tickets/user/:userId', (req, res) => {
  const userTickets = supportTickets.filter((t) => t.userId === req.params.userId);
  return res.json(userTickets);
});

// ==========================================
// 4. ADMIN — SITES (Full CRUD, Org-Scoped)
// ==========================================
app.get('/api/admin/sites', (req, res) => {
  const orgId = getOrgId(req);
  const orgSites = sites.filter((s) => s.organizationId === orgId);
  return res.json(orgSites);
});

app.post('/api/admin/sites', (req, res) => {
  const orgId = getOrgId(req);
  const { name, latitude, longitude, radiusMeters } = req.body;

  const trimmedName = String(name || '').trim();
  const numLat = Number(latitude);
  const numLng = Number(longitude);
  const numRadius = Math.max(10, Number(radiusMeters) || 100);

  if (!trimmedName || isNaN(numLat) || isNaN(numLng)) {
    return res.status(400).json({ error: 'Valid site name, latitude, and longitude numbers are required' });
  }

  const newSite: Site = {
    _id: `site_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: trimmedName,
    latitude: numLat,
    longitude: numLng,
    radiusMeters: numRadius,
    organizationId: orgId,
    createdAt: new Date().toISOString()
  };

  sites.push(newSite);
  io.emit('site:new', newSite);
  return res.status(201).json(newSite);
});

app.put('/api/admin/sites/:id', (req, res) => {
  const orgId = getOrgId(req);
  const site = sites.find((s) => s._id === req.params.id && s.organizationId === orgId);
  if (!site) return res.status(404).json({ error: 'Site not found in this organization' });

  const { name, latitude, longitude, radiusMeters } = req.body;
  if (name !== undefined && String(name).trim()) site.name = String(name).trim();
  if (latitude !== undefined && !isNaN(Number(latitude))) site.latitude = Number(latitude);
  if (longitude !== undefined && !isNaN(Number(longitude))) site.longitude = Number(longitude);
  if (radiusMeters !== undefined && !isNaN(Number(radiusMeters))) site.radiusMeters = Math.max(10, Number(radiusMeters));

  io.emit('site:update', site);
  return res.json(site);
});

app.delete('/api/admin/sites/:id', (req, res) => {
  const orgId = getOrgId(req);
  const index = sites.findIndex((s) => s._id === req.params.id && s.organizationId === orgId);
  if (index === -1) return res.status(404).json({ error: 'Site not found in this organization' });

  const deleted = sites.splice(index, 1)[0];
  io.emit('site:delete', { siteId: req.params.id, organizationId: orgId });
  return res.json({ success: true, deletedSite: deleted });
});

// ==========================================
// 5. ADMIN — USERS (Full CRUD, Org-Scoped)
// ==========================================
app.get('/api/admin/users', (req, res) => {
  const orgId = getOrgId(req);
  const orgUsers = users.filter((u) => u.organizationId === orgId);
  return res.json(orgUsers);
});

app.post('/api/admin/users', (req, res) => {
  const orgId = getOrgId(req);
  const { name, mobile, employeeId, email, assignedSiteId } = req.body;
  if (!name || !mobile) {
    return res.status(400).json({ error: 'name and mobile are required' });
  }

  const org = organizations.find((o) => o._id === orgId) || org1;
  const site = sites.find((s) => s._id === assignedSiteId && s.organizationId === orgId) || sites[0];

  const newUser: User = {
    _id: `u_${Date.now()}`,
    name: String(name).trim(),
    mobile: String(mobile).replace(/\D/g, ''),
    employeeId: employeeId || `EMP${Math.floor(100 + Math.random() * 900)}`,
    email: email || '',
    isActive: true,
    assignedSite: site,
    organization: org,
    organizationId: orgId,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  return res.status(201).json(newUser);
});

app.put('/api/admin/users/:id', (req, res) => {
  const orgId = getOrgId(req);
  const user = users.find((u) => u._id === req.params.id && u.organizationId === orgId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { name, mobile, employeeId, email, assignedSiteId, isActive } = req.body;
  if (name !== undefined) user.name = String(name).trim();
  if (mobile !== undefined) user.mobile = String(mobile).replace(/\D/g, '');
  if (employeeId !== undefined) user.employeeId = String(employeeId).trim();
  if (email !== undefined) user.email = String(email).trim();
  if (isActive !== undefined) user.isActive = Boolean(isActive);

  if (assignedSiteId) {
    const site = sites.find((s) => s._id === assignedSiteId);
    if (site) user.assignedSite = site;
  }

  return res.json(user);
});

app.delete('/api/admin/users/:id', (req, res) => {
  const orgId = getOrgId(req);
  const index = users.findIndex((u) => u._id === req.params.id && u.organizationId === orgId);
  if (index === -1) return res.status(404).json({ error: 'User not found' });

  const deleted = users.splice(index, 1)[0];
  // Remove user's live location if active
  liveLocations.delete(deleted._id);
  return res.json({ success: true, deletedUser: deleted });
});

// GET /api/admin/users/:userId/report
app.get('/api/admin/users/:userId/report', (req, res) => {
  const user = users.find((u) => u._id === req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const history = attendanceRecords.filter((a) => a.userId === user._id);
  const userTasks = tasks.filter((t) => t.assignedTo === user._id);
  const userTickets = supportTickets.filter((t) => t.userId === user._id);

  let totalHoursWorked = 0;
  history.forEach((rec) => {
    if (rec.signOutTime) {
      const diffMs = new Date(rec.signOutTime).getTime() - new Date(rec.signInTime).getTime();
      totalHoursWorked += Math.max(0, diffMs / 3600000);
    }
  });

  return res.json({
    user,
    totalAttendanceSessions: history.length,
    totalHoursWorked: Number(totalHoursWorked.toFixed(1)),
    completedTasksCount: userTasks.filter((t) => t.status === 'completed').length,
    pendingTasksCount: userTasks.filter((t) => t.status === 'pending').length,
    attendanceHistory: history,
    assignedTasks: userTasks,
    submittedTickets: userTickets
  });
});

// ==========================================
// 6. ADMIN — TASKS (Full CRUD, Org-Scoped)
// ==========================================
app.get('/api/admin/tasks', (req, res) => {
  const orgId = getOrgId(req);
  const { userId } = req.query;

  let orgTasks = tasks.filter((t) => t.organizationId === orgId);
  if (userId) {
    orgTasks = orgTasks.filter((t) => t.assignedTo === String(userId));
  }
  return res.json(orgTasks);
});

app.post('/api/admin/tasks', (req, res) => {
  const orgId = getOrgId(req);
  const { title, description, assignedTo, siteId } = req.body;
  if (!title || !assignedTo) {
    return res.status(400).json({ error: 'title and assignedTo are required' });
  }

  const assignedUser = users.find((u) => u._id === assignedTo);
  const targetSite = siteId ? sites.find((s) => s._id === siteId) : assignedUser?.assignedSite || sites[0];

  const newTask: Task = {
    _id: `t_${Date.now()}`,
    title: String(title).trim(),
    description: description || '',
    status: 'pending',
    assignedTo,
    assignedUserName: assignedUser ? assignedUser.name : 'Unknown',
    site: targetSite || sites[0],
    organizationId: orgId,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  io.emit('task:update', newTask);
  return res.status(201).json(newTask);
});

app.put('/api/admin/tasks/:id', (req, res) => {
  const orgId = getOrgId(req);
  const task = tasks.find((t) => t._id === req.params.id && t.organizationId === orgId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { title, description, status, assignedTo, siteId } = req.body;
  if (title !== undefined) task.title = String(title).trim();
  if (description !== undefined) task.description = String(description).trim();
  if (status !== undefined) task.status = status;
  if (assignedTo !== undefined) {
    task.assignedTo = assignedTo;
    const u = users.find((item) => item._id === assignedTo);
    if (u) task.assignedUserName = u.name;
  }
  if (siteId) {
    const s = sites.find((item) => item._id === siteId);
    if (s) task.site = s;
  }
  task.updatedAt = new Date().toISOString();

  io.emit('task:update', task);
  return res.json(task);
});

app.delete('/api/admin/tasks/:id', (req, res) => {
  const orgId = getOrgId(req);
  const index = tasks.findIndex((t) => t._id === req.params.id && t.organizationId === orgId);
  if (index === -1) return res.status(404).json({ error: 'Task not found' });

  const deleted = tasks.splice(index, 1)[0];
  return res.json({ success: true, deletedTask: deleted });
});

// ==========================================
// 7. ADMIN — ATTENDANCE & PHOTOS
// ==========================================
app.get('/api/admin/attendance', (req, res) => {
  const orgId = getOrgId(req);
  const { userId, date } = req.query;

  let records = attendanceRecords.filter((r) => r.organizationId === orgId);
  if (userId) {
    records = records.filter((r) => r.userId === String(userId));
  }
  if (date) {
    records = records.filter((r) => r.signInTime.slice(0, 10) === String(date));
  }
  return res.json(records);
});

app.get('/api/admin/attendance/:id/photos', (req, res) => {
  const record = attendanceRecords.find((r) => r._id === req.params.id);
  if (!record) return res.status(404).json({ error: 'Attendance record not found' });

  return res.json({
    _id: record._id,
    userName: record.userName,
    signInPhoto: record.photo || null,
    signOutPhoto: record.signOutPhoto || null
  });
});

app.delete('/api/admin/attendance/:id/photo/:type', (req, res) => {
  const { id, type } = req.params;
  const record = attendanceRecords.find((r) => r._id === id);
  if (!record) return res.status(404).json({ error: 'Attendance record not found' });

  if (type === 'sign-in' || type === 'photo') {
    delete record.photo;
  } else if (type === 'sign-out' || type === 'signOutPhoto') {
    delete record.signOutPhoto;
  } else {
    return res.status(400).json({ error: 'type must be "sign-in" or "sign-out"' });
  }

  return res.json({ success: true, message: `Photo removed for ${record._id}` });
});

// ==========================================
// 8. ADMIN — DASHBOARD & SHARE LINKS
// ==========================================
app.get('/api/admin/dashboard', (req, res) => {
  const orgId = getOrgId(req);
  const orgUsers = users.filter((u) => u.organizationId === orgId);
  const orgTasks = tasks.filter((t) => t.organizationId === orgId);
  const orgTickets = supportTickets.filter((t) => t.organizationId === orgId);
  const orgSites = sites.filter((s) => s.organizationId === orgId);
  const activeLinks = shareLinks.filter((l) => l.organizationId === orgId && l.isActive);

  // Active in field count
  const activeInField = Array.from(liveLocations.values()).filter((l) => l.organizationId === orgId).length;

  return res.json({
    totalEmployees: orgUsers.length,
    activeInField,
    tasksPending: orgTasks.filter((t) => t.status === 'pending').length,
    tasksInProgress: orgTasks.filter((t) => t.status === 'in-progress').length,
    tasksCompleted: orgTasks.filter((t) => t.status === 'completed').length,
    openTickets: orgTickets.filter((t) => t.status !== 'resolved').length,
    activeShareLinks: activeLinks.length,
    totalSites: orgSites.length
  });
});

// POST /api/admin/share-link
app.post('/api/admin/share-link', (req, res) => {
  const orgId = getOrgId(req);
  const org = organizations.find((o) => o._id === orgId) || org1;
  const { name, expiresHours } = req.body;

  const token = `track_${Math.random().toString(36).substring(2, 8).toUpperCase()}_${Date.now().toString(36).toUpperCase()}`;
  const hours = Number(expiresHours) || 24;
  const expiresAt = new Date(Date.now() + hours * 3600000).toISOString();

  const newLink: ShareLink = {
    token,
    organizationId: orgId,
    organizationName: org.name,
    name: name || `${org.name} Dispatch Tracking`,
    createdAt: new Date().toISOString(),
    expiresAt,
    isActive: true
  };

  shareLinks.unshift(newLink);
  return res.status(201).json(newLink);
});

// GET /api/admin/share-links
app.get('/api/admin/share-links', (req, res) => {
  const orgId = getOrgId(req);
  const list = shareLinks.filter((l) => l.organizationId === orgId && l.isActive);
  return res.json(list);
});

// DELETE /api/admin/share-link/:token (Revoke / Soft Delete)
app.delete('/api/admin/share-link/:token', (req, res) => {
  const link = shareLinks.find((l) => l.token === req.params.token);
  if (!link) return res.status(404).json({ error: 'Share link not found' });

  link.isActive = false;
  return res.json({ success: true, message: 'Share link revoked', token: link.token });
});

// ==========================================
// 9. ADMIN & ORG TICKETS (With SLA info)
// ==========================================
app.get('/api/tickets/org/:orgId', (req, res) => {
  const orgTickets = supportTickets.filter((t) => t.organizationId === req.params.orgId);

  // Compute SLA stats
  const enriched = orgTickets.map((t) => {
    const hoursOpen = (Date.now() - new Date(t.createdAt).getTime()) / 3600000;
    let slaStatus: 'healthy' | 'warning' | 'breached' = 'healthy';
    if (t.status !== 'resolved') {
      if (hoursOpen > 24) slaStatus = 'breached';
      else if (hoursOpen > 12) slaStatus = 'warning';
    }
    return {
      ...t,
      hoursOpen: Number(hoursOpen.toFixed(1)),
      slaStatus
    };
  });

  return res.json(enriched);
});

app.get('/api/tickets/:id', (req, res) => {
  const ticket = supportTickets.find((t) => t._id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  return res.json(ticket);
});

app.put('/api/tickets/:id', (req, res) => {
  const ticket = supportTickets.find((t) => t._id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const { status, priority, assignedTo, resolutionNote } = req.body;
  if (status !== undefined) ticket.status = status;
  if (priority !== undefined) ticket.priority = priority;
  if (assignedTo !== undefined) ticket.assignedTo = assignedTo;
  if (resolutionNote !== undefined) ticket.resolutionNote = resolutionNote;

  io.emit('ticket:update', ticket);
  return res.json(ticket);
});

app.delete('/api/tickets/:id', (req, res) => {
  const index = supportTickets.findIndex((t) => t._id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Ticket not found' });

  const deleted = supportTickets.splice(index, 1)[0];
  return res.json({ success: true, deletedTicket: deleted });
});

// ==========================================
// 10. SUPER ADMIN — ORGANIZATIONS & ADMINS
// ==========================================
app.get('/api/superadmin/organizations', (req, res) => {
  const enriched = organizations.map((org) => {
    const userCount = users.filter((u) => u.organizationId === org._id).length;
    const siteCount = sites.filter((s) => s.organizationId === org._id).length;
    const adminCount = admins.filter((a) => a.organizationId === org._id).length;
    return {
      ...org,
      userCount,
      siteCount,
      adminCount
    };
  });
  return res.json(enriched);
});

app.post('/api/superadmin/organizations', (req, res) => {
  const { name, code } = req.body;
  if (!name) return res.status(400).json({ error: 'Organization name is required' });

  const newOrg: Organization = {
    _id: `org_${Date.now()}`,
    name: String(name).trim(),
    code: code || String(name).slice(0, 4).toUpperCase(),
    isActive: true,
    createdAt: new Date().toISOString()
  };

  organizations.push(newOrg);
  return res.status(201).json(newOrg);
});

app.put('/api/superadmin/organizations/:id', (req, res) => {
  const org = organizations.find((o) => o._id === req.params.id);
  if (!org) return res.status(404).json({ error: 'Organization not found' });

  const { name, code, isActive } = req.body;
  if (name !== undefined) org.name = String(name).trim();
  if (code !== undefined) org.code = String(code).trim();
  if (isActive !== undefined) org.isActive = Boolean(isActive);

  return res.json(org);
});

// Soft Delete (Deactivate)
app.delete('/api/superadmin/organizations/:id', (req, res) => {
  const org = organizations.find((o) => o._id === req.params.id);
  if (!org) return res.status(404).json({ error: 'Organization not found' });

  org.isActive = false;
  return res.json({ success: true, message: `Organization ${org.name} deactivated (soft deleted)` });
});

// Permanent Delete (Cascading wipe!)
app.delete('/api/superadmin/organizations/:id/permanent', (req, res) => {
  const orgId = req.params.id;
  const orgIndex = organizations.findIndex((o) => o._id === orgId);
  if (orgIndex === -1) return res.status(404).json({ error: 'Organization not found' });

  const deletedOrg = organizations.splice(orgIndex, 1)[0];

  // Cascading deletes: wipe all admins, sites, users, tasks, attendance, tickets, share links
  admins = admins.filter((a) => a.organizationId !== orgId);
  sites = sites.filter((s) => s.organizationId !== orgId);
  users = users.filter((u) => u.organizationId !== orgId);
  tasks = tasks.filter((t) => t.organizationId !== orgId);
  attendanceRecords = attendanceRecords.filter((a) => a.organizationId !== orgId);
  supportTickets = supportTickets.filter((t) => t.organizationId !== orgId);
  shareLinks = shareLinks.filter((l) => l.organizationId !== orgId);

  console.log(`[SUPERADMIN] Permanently deleted organization "${deletedOrg.name}" and cascaded all linked records.`);

  return res.json({
    success: true,
    message: `Organization ${deletedOrg.name} and all associated data permanently wiped.`,
    deletedOrg
  });
});

// Org Admins
app.get('/api/superadmin/organizations/:orgId/admins', (req, res) => {
  const orgAdmins = admins.filter((a) => a.organizationId === req.params.orgId);
  return res.json(orgAdmins);
});

app.post('/api/superadmin/organizations/:orgId/admins', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }

  const org = organizations.find((o) => o._id === req.params.orgId);
  const newAdmin: AdminUser = {
    _id: `adm_${Date.now()}`,
    name: String(name).trim(),
    email: String(email).toLowerCase(),
    password,
    role: 'admin',
    organizationId: req.params.orgId,
    organizationName: org ? org.name : '',
    isActive: true,
    createdAt: new Date().toISOString()
  };

  admins.push(newAdmin);
  return res.status(201).json(newAdmin);
});

app.put('/api/superadmin/admins/:id', (req, res) => {
  const admin = admins.find((a) => a._id === req.params.id);
  if (!admin) return res.status(404).json({ error: 'Admin not found' });

  const { name, email, password, isActive } = req.body;
  if (name !== undefined) admin.name = String(name).trim();
  if (email !== undefined) admin.email = String(email).toLowerCase();
  if (password !== undefined) admin.password = password;
  if (isActive !== undefined) admin.isActive = Boolean(isActive);

  return res.json(admin);
});

app.delete('/api/superadmin/admins/:id', (req, res) => {
  const admin = admins.find((a) => a._id === req.params.id);
  if (!admin) return res.status(404).json({ error: 'Admin not found' });

  admin.isActive = false;
  return res.json({ success: true, message: `Admin ${admin.name} deactivated (soft deleted)` });
});

// ==========================================
// 11. SUPER ADMIN — PLATFORM STATS & CROSS-ORG
// ==========================================
app.get('/api/superadmin/stats', (req, res) => {
  return res.json({
    totalOrganizations: organizations.length,
    activeOrganizations: organizations.filter((o) => o.isActive).length,
    totalAdmins: admins.length,
    totalUsers: users.length,
    totalSites: sites.length,
    totalTasks: tasks.length,
    todayAttendanceRecords: attendanceRecords.filter(
      (a) => a.signInTime.slice(0, 10) === new Date().toISOString().slice(0, 10)
    ).length
  });
});

app.get('/api/superadmin/users', (req, res) => {
  const { orgId } = req.query;
  if (orgId) {
    return res.json(users.filter((u) => u.organizationId === String(orgId)));
  }
  return res.json(users);
});

app.delete('/api/superadmin/users/:id', (req, res) => {
  const index = users.findIndex((u) => u._id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'User not found' });

  const deleted = users.splice(index, 1)[0];
  // Wipe related attendance & tasks
  attendanceRecords = attendanceRecords.filter((a) => a.userId !== deleted._id);
  tasks = tasks.filter((t) => t.assignedTo !== deleted._id);
  liveLocations.delete(deleted._id);

  return res.json({ success: true, message: `User ${deleted.name} and related records permanently wiped.` });
});

app.get('/api/superadmin/sites', (req, res) => {
  const { orgId } = req.query;
  if (orgId) {
    return res.json(sites.filter((s) => s.organizationId === String(orgId)));
  }
  return res.json(sites);
});

app.delete('/api/superadmin/sites/:id', (req, res) => {
  const index = sites.findIndex((s) => s._id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Site not found' });

  const deleted = sites.splice(index, 1)[0];
  return res.json({ success: true, message: `Site ${deleted.name} permanently deleted.` });
});

app.get('/api/superadmin/tasks', (req, res) => {
  const { orgId } = req.query;
  if (orgId) {
    return res.json(tasks.filter((t) => t.organizationId === String(orgId)));
  }
  return res.json(tasks);
});

app.get('/api/superadmin/attendance', (req, res) => {
  const { orgId, date } = req.query;
  let list = attendanceRecords;
  if (orgId) list = list.filter((a) => a.organizationId === String(orgId));
  if (date) list = list.filter((a) => a.signInTime.slice(0, 10) === String(date));
  return res.json(list);
});

app.get('/api/superadmin/users/:userId/report', (req, res) => {
  const user = users.find((u) => u._id === req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const history = attendanceRecords.filter((a) => a.userId === user._id);
  const userTasks = tasks.filter((t) => t.assignedTo === user._id);
  const userTickets = supportTickets.filter((t) => t.userId === user._id);

  return res.json({
    user,
    organization: user.organization,
    totalAttendanceSessions: history.length,
    completedTasksCount: userTasks.filter((t) => t.status === 'completed').length,
    attendanceHistory: history,
    assignedTasks: userTasks,
    submittedTickets: userTickets
  });
});

// ==========================================
// 12. PUBLIC LIVE TRACKING LINK & DESK PROXY
// ==========================================

// GET /api/track/:token (Validate Public Live Tracking Link)
app.get('/api/track/:token', (req, res) => {
  const link = shareLinks.find((l) => l.token === req.params.token && l.isActive);
  if (!link) {
    return res.status(404).json({ error: 'Invalid or expired tracking share link' });
  }

  // Check expiration
  if (new Date(link.expiresAt).getTime() < Date.now()) {
    return res.status(410).json({ error: 'This tracking link has expired' });
  }

  const org = organizations.find((o) => o._id === link.organizationId);
  const orgSites = sites.filter((s) => s.organizationId === link.organizationId);
  const orgLiveLocations = Array.from(liveLocations.values()).filter(
    (l) => l.organizationId === link.organizationId
  );
  const orgTasks = tasks.filter((t) => t.organizationId === link.organizationId);

  return res.json({
    valid: true,
    link,
    organization: org,
    sites: orgSites,
    liveLocations: orgLiveLocations,
    activeTasks: orgTasks.filter((t) => t.status === 'in-progress')
  });
});

// POST /api/desk/tickets/submit (External Desk Proxy)
app.post('/api/desk/tickets/submit', (req, res) => {
  console.log('[DESK PROXY] Forwarded ticket to external service desk:', req.body);
  return res.json({
    success: true,
    externalDeskId: `DESK_${Date.now()}`,
    receivedAt: new Date().toISOString()
  });
});

// Diagnostics & Reset
app.get('/api/admin/overview', (req, res) => {
  const orgId = getOrgId(req);
  res.json({
    users: users.filter((u) => u.organizationId === orgId),
    sites: sites.filter((s) => s.organizationId === orgId),
    organization: organizations.find((o) => o._id === orgId) || org1,
    tasks: tasks.filter((t) => t.organizationId === orgId),
    attendanceRecords: attendanceRecords.filter((a) => a.organizationId === orgId),
    supportTickets: supportTickets.filter((t) => t.organizationId === orgId),
    liveLocations: Array.from(liveLocations.values()).filter((l) => l.organizationId === orgId),
    shareLinks: shareLinks.filter((l) => l.organizationId === orgId)
  });
});

app.post('/api/admin/reset', (req, res) => {
  resetInMemoryData();
  res.json({ success: true, message: 'In-memory database reset to initial seed data' });
});

// ==========================================
// VITE MIDDLEWARE & SERVER STARTUP
// ==========================================
async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 Geo-Task Full-Stack Server Running on Port ${PORT}`);
    console.log(`📍 API Base: http://localhost:${PORT}/api`);
    console.log(`⚡ Socket.IO Ready on http://localhost:${PORT}`);
    console.log(`👥 Roles Available:`);
    console.log(`   1) Employee App: Mobile 9990001111 (OTP: 1111)`);
    console.log(`   2) Admin Portal: admin@acme.com / admin123`);
    console.log(`   3) Super Admin:  superadmin@geotask.com / super123`);
    console.log(`   4) Public Share: /track/DEMO-TRACK-2026`);
    console.log(`====================================================`);
  });
}

startServer();
