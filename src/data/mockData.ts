import { GeoFenceZone, User, AttendanceRecord, PushNotificationItem } from '../types';

export const INITIAL_GEOFENCES: GeoFenceZone[] = [
  {
    id: 'geo_1',
    name: 'Tech Center HQ (Main Campus)',
    address: '500 Howard Street, Suite 400, San Francisco, CA',
    latitude: 37.789172,
    longitude: -122.401449,
    radiusMeters: 180,
    color: '#6366f1',
    active: true
  },
  {
    id: 'geo_2',
    name: 'North Logistics Distribution Hub',
    address: '1420 Harbor Blvd, South San Francisco, CA',
    latitude: 37.654721,
    longitude: -122.408912,
    radiusMeters: 300,
    color: '#06b6d4',
    active: true
  },
  {
    id: 'geo_3',
    name: 'Downtown Operations Branch',
    address: '101 California St, Financial District, SF',
    latitude: 37.793281,
    longitude: -122.399518,
    radiusMeters: 120,
    color: '#10b981',
    active: true
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_1',
    name: 'Alex Vance',
    email: 'alex.vance@company.com',
    role: 'Field Engineer',
    department: 'Site Engineering',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    employeeCode: 'ENG-4092',
    fcmToken: 'fcm_android_tok_9918a82x4k991',
    pushSubscribed: true
  },
  {
    id: 'usr_2',
    name: 'Marcus Chen',
    email: 'marcus.chen@company.com',
    role: 'Site Manager',
    department: 'Operations',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    employeeCode: 'MGR-1048',
    fcmToken: 'fcm_android_tok_8829b11p3z721',
    pushSubscribed: true
  },
  {
    id: 'usr_3',
    name: 'Sarah Jenkins',
    email: 'sarah.j@company.com',
    role: 'Sales Executive',
    department: 'Enterprise Sales',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    employeeCode: 'SLS-8021',
    fcmToken: null,
    pushSubscribed: false
  }
];

export const INITIAL_ATTENDANCE_LOGS: AttendanceRecord[] = [
  {
    id: 'att_101',
    userId: 'usr_1',
    userName: 'Alex Vance',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    employeeCode: 'ENG-4092',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type: 'CHECK_IN',
    status: 'VERIFIED',
    latitude: 37.789210,
    longitude: -122.401390,
    accuracy: 8,
    distanceToPerimeter: 22,
    zoneName: 'Tech Center HQ (Main Campus)',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    platform: 'android',
    deviceModel: 'Samsung Galaxy S24 Ultra (Capacitor v6.2.0)',
    syncedToMongo: true,
    notes: 'Facial biometric matched (99.4%)'
  },
  {
    id: 'att_102',
    userId: 'usr_2',
    userName: 'Marcus Chen',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    employeeCode: 'MGR-1048',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type: 'CHECK_IN',
    status: 'VERIFIED',
    latitude: 37.654810,
    longitude: -122.408850,
    accuracy: 12,
    distanceToPerimeter: 45,
    zoneName: 'North Logistics Distribution Hub',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    platform: 'web',
    deviceModel: 'Chrome 122.0 (Desktop Web Portal)',
    syncedToMongo: true
  },
  {
    id: 'att_103',
    userId: 'usr_3',
    userName: 'Sarah Jenkins',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    employeeCode: 'SLS-8021',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type: 'CHECK_IN',
    status: 'OUT_OF_BOUNDS',
    latitude: 37.801200,
    longitude: -122.415000,
    accuracy: 25,
    distanceToPerimeter: 1420,
    zoneName: 'Outside Defined Perimeter',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    platform: 'android',
    deviceModel: 'Google Pixel 8 Pro (Capacitor Container)',
    syncedToMongo: true,
    notes: 'Checked in 1.4km away from nearest perimeter. Flagged for manager review.'
  }
];

export const INITIAL_NOTIFICATIONS: PushNotificationItem[] = [
  {
    id: 'push_1',
    title: 'Morning Shift Check-in Reminder',
    body: 'Your shift starts in 15 minutes at Tech Center HQ. Please punch in within the geofence perimeter.',
    receivedAt: '08:45 AM',
    type: 'shift_reminder',
    read: true,
    priority: 'high'
  },
  {
    id: 'push_2',
    title: 'Geofence Perimeter Detected',
    body: 'You have entered the North Logistics Distribution Hub perimeter (Radius: 300m). GPS signal locked.',
    receivedAt: '09:12 AM',
    type: 'geofence_entry',
    read: true,
    priority: 'normal'
  },
  {
    id: 'push_3',
    title: 'Attendance Confirmed ✓',
    body: 'Check-in registered successfully. Biometrics and GPS verified with MongoDB cluster.',
    receivedAt: '09:15 AM',
    type: 'attendance_confirmed',
    read: false,
    priority: 'high'
  }
];
