const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// SEED DATA (In-Memory)
// ==========================================

const org1 = { _id: 'org1', name: 'Acme Corp' };

const site1 = {
  _id: 'site1',
  name: 'HQ Office',
  latitude: 28.6139,
  longitude: 77.2090,
  radiusMeters: 100
};

const site2 = {
  _id: 'site2',
  name: 'Warehouse',
  latitude: 19.0760,
  longitude: 72.8777,
  radiusMeters: 150
};

let users = [
  {
    _id: 'u1',
    name: 'Ravi Kumar',
    mobile: '9990001111',
    employeeId: 'EMP001',
    isActive: true,
    assignedSite: site1,
    organization: org1
  },
  {
    _id: 'u2',
    name: 'Priya Shah',
    mobile: '9990002222',
    employeeId: 'EMP002',
    isActive: true,
    assignedSite: site2,
    organization: org1
  }
];

let tasks = [
  {
    _id: 't1',
    title: 'Daily Morning Equipment Safety Check',
    description: 'Inspect emergency fire exits, electrical distribution panels, and high-voltage breaker locks.',
    status: 'pending',
    assignedTo: 'u1',
    site: site1
  },
  {
    _id: 't2',
    title: 'Server Room Climate & Backup Power Audit',
    description: 'Verify dual redundant AC airflow units and log battery UPS load percentages.',
    status: 'pending',
    assignedTo: 'u1',
    site: site1
  },
  {
    _id: 't3',
    title: 'Inventory Receiving & Pallet Barcode Scan',
    description: 'Receive incoming freight shipment, verify shipping manifest, and log inventory batches.',
    status: 'pending',
    assignedTo: 'u2',
    site: site2
  },
  {
    _id: 't4',
    title: 'Dock Forklift Safety Inspection',
    description: 'Check hydraulic pressure, horn, steering, and emergency braking systems on forklift #3.',
    status: 'pending',
    assignedTo: 'u2',
    site: site2
  }
];

let attendanceRecords = [];
let supportTickets = [];
const liveLocations = new Map(); // userId -> { userId, userName, latitude, longitude, speed, timestamp, organizationId }
const pendingOtps = new Map(); // mobile -> { otp: '1111' }

// ==========================================
// SOCKET.IO EVENTS
// ==========================================

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Handle location update from mobile client
  socket.on('location:update', (data) => {
    if (!data || !data.userId) return;
    liveLocations.set(data.userId, {
      ...data,
      timestamp: data.timestamp || Date.now()
    });
    // Re-broadcast to admin listeners
    io.emit('employee:location', data);
    console.log(`[Socket.IO] location:update received for ${data.userName || data.userId} (${data.latitude}, ${data.longitude})`);
  });

  // Handle location stop on logout
  socket.on('location:stop', (data) => {
    if (!data || !data.userId) return;
    liveLocations.delete(data.userId);
    io.emit('employee:offline', { userId: data.userId });
    console.log(`[Socket.IO] location:stop received for ${data.userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// ==========================================
// REST ENDPOINTS
// ==========================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'geo-task-backend-standalone',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// 1. POST /api/auth/send-otp
app.post('/api/auth/send-otp', (req, res) => {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ error: 'Mobile number required' });

  const clean = String(mobile).replace(/\D/g, '');
  const user = users.find((u) => u.mobile.replace(/\D/g, '') === clean);

  if (!user) {
    return res.status(404).json({ error: 'User not registered with this mobile number' });
  }

  const otp = '1111';
  pendingOtps.set(user.mobile, { otp, requestedAt: new Date() });
  console.log(`\n========================================`);
  console.log(`🔑 [AUTH OTP GENERATED]`);
  console.log(`User: ${user.name} (${user.employeeId})`);
  console.log(`Mobile: ${user.mobile}`);
  console.log(`OTP Code: >>> 1111 <<<`);
  console.log(`========================================\n`);

  res.json({ success: true, message: 'OTP sent successfully (Demo OTP: 1111)' });
});

// 2. POST /api/auth/verify-otp
app.post('/api/auth/verify-otp', (req, res) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp) return res.status(400).json({ error: 'Mobile and OTP required' });

  const clean = String(mobile).replace(/\D/g, '');
  const user = users.find((u) => u.mobile.replace(/\D/g, '') === clean);

  if (!user) return res.status(404).json({ error: 'User not found' });

  if (String(otp).trim() !== '1111') {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  pendingOtps.delete(user.mobile);
  res.json({ success: true, user });
});

// 3. GET /api/user/:userId
app.get('/api/user/:userId', (req, res) => {
  const user = users.find((u) => u._id === req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Helper: GET /api/user/:userId/tasks
app.get('/api/user/:userId/tasks', (req, res) => {
  const userTasks = tasks.filter((t) => t.assignedTo === req.params.userId);
  res.json(userTasks);
});

// 4. GET /api/attendance/status/:userId
app.get('/api/attendance/status/:userId', (req, res) => {
  const active = attendanceRecords.find((r) => r.userId === req.params.userId && !r.signOutTime);
  res.json({ activeSession: active || null });
});

// 5. POST /api/attendance/sign-in
app.post('/api/attendance/sign-in', (req, res) => {
  const { userId, latitude, longitude, photo } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const user = users.find((u) => u._id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const active = attendanceRecords.find((r) => r.userId === userId && !r.signOutTime);
  if (active) {
    return res.status(400).json({ error: 'Already signed in', activeSession: active });
  }

  const signInTime = new Date().toISOString();
  const record = {
    _id: 'att_' + Date.now(),
    userId,
    userName: user.name,
    employeeId: user.employeeId,
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
  console.log(`[ATTENDANCE] Sign-in recorded for ${user.name} at ${record.siteName}`);
  res.json({ success: true, signInTime, record });
});

// 6. POST /api/attendance/sign-out
app.post('/api/attendance/sign-out', (req, res) => {
  const { userId, latitude, longitude, photo } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const active = attendanceRecords.find((r) => r.userId === userId && !r.signOutTime);
  if (!active) {
    return res.status(400).json({ error: 'No active sign-in session found' });
  }

  const signOutTime = new Date().toISOString();
  active.signOutTime = signOutTime;
  active.signOutLatitude = Number(latitude) || active.latitude;
  active.signOutLongitude = Number(longitude) || active.longitude;
  if (photo) active.signOutPhoto = photo;
  active.status = 'completed';

  console.log(`[ATTENDANCE] Sign-out recorded for ${active.userName}`);
  res.json({ success: true, signOutTime, record: active });
});

// 7. PUT /api/user/tasks/:taskId/status
app.put('/api/user/tasks/:taskId/status', (req, res) => {
  const { taskId } = req.params;
  const { status, latitude, longitude } = req.body;

  const task = tasks.find((t) => t._id === taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  task.status = status;
  task.updatedAt = new Date().toISOString();
  if (status === 'completed') task.completedAt = new Date().toISOString();

  console.log(`[TASKS] Task ${task._id} updated to ${status} (lat: ${latitude}, lng: ${longitude})`);
  res.json(task);
});

// 8. GET /api/user/:userId/activity?date=YYYY-MM-DD
app.get('/api/user/:userId/activity', (req, res) => {
  const { userId } = req.params;
  const targetDate = req.query.date || new Date().toISOString().slice(0, 10);

  const userAttendance = attendanceRecords.filter((r) => {
    return r.userId === userId && r.signInTime.slice(0, 10) === targetDate;
  });
  const userTasks = tasks.filter((t) => t.assignedTo === userId);

  res.json({
    userId,
    date: targetDate,
    attendance: userAttendance,
    tasks: userTasks
  });
});

// 9. POST /api/tickets
app.post('/api/tickets', (req, res) => {
  const { userId, message, latitude, longitude } = req.body;
  if (!userId || !message) return res.status(400).json({ error: 'userId and message required' });

  const user = users.find((u) => u._id === userId);
  const ticket = {
    _id: 'ticket_' + Date.now(),
    userId,
    userName: user ? user.name : 'Unknown User',
    message: String(message).trim(),
    latitude: Number(latitude) || 0,
    longitude: Number(longitude) || 0,
    createdAt: new Date().toISOString(),
    status: 'open'
  };

  supportTickets.unshift(ticket);
  console.log(`[TICKETS] Support ticket logged: ${ticket.message}`);
  res.json({ success: true, ticket });
});

// Server Start
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Geo-Task Backend Server listening on port ${PORT}`);
  console.log(`📡 Base URL: http://localhost:${PORT}/api`);
  console.log(`⚡ Socket.IO URL: http://localhost:${PORT}`);
  console.log(`👤 Seed Users:`);
  console.log(`   1) Ravi Kumar  - Mobile: 9990001111 (OTP: 1111) [HQ Office]`);
  console.log(`   2) Priya Shah  - Mobile: 9990002222 (OTP: 1111) [Warehouse]`);
  console.log(`====================================================`);
});
