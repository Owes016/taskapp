export interface Site {
  _id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  organizationId?: string;
  createdAt?: string;
}

export interface Organization {
  _id: string;
  name: string;
  code?: string;
  isActive: boolean;
  createdAt?: string;
  userCount?: number;
  siteCount?: number;
  adminCount?: number;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'superadmin';
  organizationId?: string;
  organizationName?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface GeoTaskUser {
  _id: string;
  name: string;
  mobile: string;
  employeeId: string;
  email?: string;
  isActive: boolean;
  assignedSite: Site;
  organization: Organization;
  organizationId?: string;
  createdAt?: string;
}

export interface GeoTaskItem {
  _id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo: string;
  assignedUserName?: string;
  site: Site;
  organizationId?: string;
  updatedAt?: string;
  completedAt?: string;
  createdAt?: string;
}

export interface GeoTaskAttendanceRecord {
  _id: string;
  userId: string;
  userName: string;
  employeeId: string;
  organizationId?: string;
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

export interface GeoTaskTicket {
  _id: string;
  userId: string;
  userName: string;
  organizationId?: string;
  message: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-review' | 'resolved';
  assignedTo?: string;
  resolutionNote?: string;
  slaStatus?: 'healthy' | 'warning' | 'breached';
  hoursOpen?: number;
}

export interface GeoTaskLiveLocation {
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: number | string;
  organizationId: string;
}

export interface LiveShareLink {
  token: string;
  organizationId: string;
  organizationName?: string;
  name: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface BackendOverview {
  users: GeoTaskUser[];
  sites: Site[];
  organization: Organization;
  tasks: GeoTaskItem[];
  attendanceRecords: GeoTaskAttendanceRecord[];
  supportTickets: GeoTaskTicket[];
  liveLocations: GeoTaskLiveLocation[];
  shareLinks?: LiveShareLink[];
}

export interface AdminDashboardStats {
  totalEmployees: number;
  activeInField: number;
  tasksPending: number;
  tasksInProgress: number;
  tasksCompleted: number;
  openTickets: number;
  activeShareLinks: number;
  totalSites: number;
}

export interface SuperAdminStats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalAdmins: number;
  totalUsers: number;
  totalSites: number;
  totalTasks: number;
  todayAttendanceRecords: number;
}

export interface UserReport {
  user: GeoTaskUser;
  totalAttendanceSessions: number;
  totalHoursWorked: number;
  completedTasksCount: number;
  pendingTasksCount: number;
  attendanceHistory: GeoTaskAttendanceRecord[];
  assignedTasks: GeoTaskItem[];
  submittedTickets: GeoTaskTicket[];
}
