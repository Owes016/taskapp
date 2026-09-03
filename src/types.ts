export type PlatformType = 'android' | 'web' | 'ios';

export type AttendanceType = 'CHECK_IN' | 'CHECK_OUT';

export type AttendanceStatus = 'VERIFIED' | 'OUT_OF_BOUNDS' | 'FLAGGED' | 'OFFLINE_SYNCED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Field Engineer' | 'Sales Executive' | 'Site Manager' | 'Staff';
  department: string;
  avatar: string;
  employeeCode: string;
  fcmToken?: string | null;
  pushSubscribed: boolean;
}

export interface GeoFenceZone {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number; // e.g. 150m
  color: string;
  active: boolean;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  employeeCode: string;
  timestamp: string;
  type: AttendanceType;
  status: AttendanceStatus;
  latitude: number;
  longitude: number;
  accuracy: number;
  distanceToPerimeter: number; // in meters to closest geofence
  zoneName: string;
  photoUrl?: string;
  platform: PlatformType;
  deviceModel: string;
  syncedToMongo: boolean;
  notes?: string;
}

export interface PushNotificationItem {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  receivedAt: string;
  type: 'shift_reminder' | 'geofence_entry' | 'attendance_confirmed' | 'admin_broadcast' | 'sync_complete' | 'manager_approval';
  read: boolean;
  priority: 'high' | 'normal';
}

export interface SyncQueueItem {
  id: string;
  action: 'ATTENDANCE_CHECK_IN' | 'ATTENDANCE_CHECK_OUT' | 'PUSH_REGISTER' | 'LOCATION_PING';
  payload: any;
  timestamp: number;
  retries: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  error?: string;
}

export interface DeviceStatus {
  isNative: boolean;
  platform: 'android' | 'web' | 'ios';
  isOnline: boolean;
  hasGpsPermission: boolean;
  hasCameraPermission: boolean;
  hasPushPermission: boolean;
  fcmToken: string | null;
  batteryLevel?: number;
  batteryCharging?: boolean;
  coordinates: {
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null;
}

export interface BackendSyncStats {
  connected: boolean;
  mongoDbStatus: 'Connected (Replica Set)' | 'Connecting' | 'Synced Local DB';
  lastSyncedAt: string;
  totalWebClients: number;
  totalAndroidClients: number;
  pendingSyncCount: number;
  fcmServiceActive: boolean;
}

export interface ChatWebhookConfig {
  webhookUrl: string;
  spaceName: string;
  enabled: boolean;
  notifyOnCheckIn: boolean;
  notifyOnCheckOut: boolean;
  notifyOnOutOfBounds: boolean;
  lastDispatchedAt?: string;
  lastStatus?: 'success' | 'error' | 'idle';
  lastErrorMessage?: string;
}

export interface ChatWebhookDeliveryLog {
  id: string;
  timestamp: string;
  attendanceId: string;
  userName: string;
  type: AttendanceType;
  zoneName: string;
  status: 'SUCCESS' | 'FAILED';
  responseStatus?: number;
  errorMessage?: string;
  target: string;
  payloadSummary: string;
}
