import { io, Socket } from 'socket.io-client';
import {
  GeoTaskUser,
  GeoTaskItem,
  GeoTaskAttendanceRecord,
  GeoTaskTicket,
  GeoTaskLiveLocation,
  BackendOverview,
  Site,
  Organization,
  AdminUser,
  AdminDashboardStats,
  SuperAdminStats,
  LiveShareLink,
  UserReport
} from '../types/geoTask';

const API_BASE = '/api';

export const geoTaskApi = {
  // ==========================================
  // AUTHENTICATION & SIGNUP
  // ==========================================

  // 1. Send Employee OTP
  async sendOtp(mobile: string): Promise<{ success: boolean; message: string; mobile?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile })
    });
    return res.json();
  },

  // 2. Verify Employee OTP
  async verifyOtp(mobile: string, otp: string): Promise<{ success: boolean; user?: GeoTaskUser; error?: string }> {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, otp })
    });
    return res.json();
  },

  // 3. Admin Login
  async adminLogin(email: string, password: string): Promise<{
    success: boolean;
    token?: string;
    admin?: AdminUser;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  // 4. Super Admin Login
  async superAdminLogin(email: string, password: string): Promise<{
    success: boolean;
    token?: string;
    superAdmin?: AdminUser;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/superadmin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  // 5. Self-Service Org Registration
  async signupOrg(payload: {
    orgName: string;
    adminName: string;
    email: string;
    password: string;
    mobile?: string;
    siteName?: string;
    latitude?: number;
    longitude?: number;
    radiusMeters?: number;
  }): Promise<{
    success: boolean;
    organization?: Organization;
    admin?: AdminUser;
    site?: Site;
    initialUser?: GeoTaskUser;
    token?: string;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // ==========================================
  // EMPLOYEE PROFILE, TASKS & ATTENDANCE
  // ==========================================

  async getUser(userId: string): Promise<GeoTaskUser> {
    const res = await fetch(`${API_BASE}/user/${userId}`);
    if (!res.ok) throw new Error('User not found');
    return res.json();
  },

  async getUserTasks(userId: string): Promise<GeoTaskItem[]> {
    const res = await fetch(`${API_BASE}/user/${userId}/tasks`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async getAttendanceStatus(userId: string): Promise<{ activeSession: GeoTaskAttendanceRecord | null }> {
    const res = await fetch(`${API_BASE}/attendance/status/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch attendance status');
    return res.json();
  },

  async getAttendanceHistory(userId: string): Promise<GeoTaskAttendanceRecord[]> {
    const res = await fetch(`${API_BASE}/attendance/history/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch attendance history');
    return res.json();
  },

  async signIn(payload: {
    userId: string;
    latitude: number;
    longitude: number;
    photo?: string;
  }): Promise<{ success: boolean; signInTime: string; record: GeoTaskAttendanceRecord; error?: string }> {
    const res = await fetch(`${API_BASE}/attendance/sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to sign in');
    }
    return data;
  },

  async signOut(payload: {
    userId: string;
    latitude: number;
    longitude: number;
    photo?: string;
  }): Promise<{ success: boolean; signOutTime: string; record: GeoTaskAttendanceRecord; error?: string }> {
    const res = await fetch(`${API_BASE}/attendance/sign-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to sign out');
    }
    return data;
  },

  // Server-side Geofence Enforced Task Status Update
  async updateTaskStatus(
    taskId: string,
    status: 'pending' | 'in-progress' | 'completed',
    coords?: { latitude: number; longitude: number }
  ): Promise<GeoTaskItem> {
    const res = await fetch(`${API_BASE}/user/tasks/${taskId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        latitude: coords?.latitude,
        longitude: coords?.longitude
      })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update task status');
    }
    return res.json();
  },

  async getUserActivity(userId: string, date?: string): Promise<{
    userId: string;
    date: string;
    attendance: GeoTaskAttendanceRecord[];
    tasks: GeoTaskItem[];
    summary: {
      totalAttendanceSessions: number;
      activeSession: GeoTaskAttendanceRecord | null;
      completedTasks: number;
      inProgressTasks: number;
      pendingTasks: number;
    };
  }> {
    const url = date ? `${API_BASE}/user/${userId}/activity?date=${date}` : `${API_BASE}/user/${userId}/activity`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch activity');
    return res.json();
  },

  async submitTicket(payload: {
    userId: string;
    message: string;
    latitude: number;
    longitude: number;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<{ success: boolean; ticket: GeoTaskTicket }> {
    const res = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to submit ticket');
    return res.json();
  },

  async getUserTickets(userId: string): Promise<GeoTaskTicket[]> {
    const res = await fetch(`${API_BASE}/tickets/user/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user tickets');
    return res.json();
  },

  // ==========================================
  // ADMIN — SITES CRUD
  // ==========================================
  async getAdminSites(orgId?: string): Promise<Site[]> {
    const res = await fetch(`${API_BASE}/admin/sites`, {
      headers: orgId ? { 'x-org-id': orgId } : {}
    });
    if (!res.ok) throw new Error('Failed to fetch sites');
    return res.json();
  },

  async geocode(query: string): Promise<Array<{ name: string; display_name: string; latitude: number; longitude: number; city?: string }>> {
    try {
      const res = await fetch(`${API_BASE}/geocode?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend geocode failed, using OSM fallback:', e);
    }

    try {
      const osmRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
      );
      if (osmRes.ok) {
        const data = await osmRes.json();
        return data.map((item: any) => ({
          name: item.name || item.display_name.split(',')[0],
          display_name: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon)
        }));
      }
    } catch (err) {
      console.warn('Direct OSM fallback failed:', err);
    }
    return [];
  },

  async reverseGeocode(lat: number, lon: number): Promise<{ name: string; display_name: string } | null> {
    try {
      const res = await fetch(`${API_BASE}/geocode/reverse?lat=${lat}&lon=${lon}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Reverse geocode failed:', e);
    }
    return null;
  },

  async createAdminSite(payload: {
    name: string;
    latitude: number;
    longitude: number;
    radiusMeters?: number;
    orgId?: string;
  }): Promise<Site> {
    const res = await fetch(`${API_BASE}/admin/sites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(payload.orgId ? { 'x-org-id': payload.orgId } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to create site');
    }
    return res.json();
  },

  async updateAdminSite(id: string, payload: Partial<Site>, orgId?: string): Promise<Site> {
    const res = await fetch(`${API_BASE}/admin/sites/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(orgId ? { 'x-org-id': orgId } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update site');
    return res.json();
  },

  async deleteAdminSite(id: string, orgId?: string): Promise<{ success: boolean; deletedSite: Site }> {
    const res = await fetch(`${API_BASE}/admin/sites/${id}`, {
      method: 'DELETE',
      headers: orgId ? { 'x-org-id': orgId } : {}
    });
    if (!res.ok) throw new Error('Failed to delete site');
    return res.json();
  },

  // ==========================================
  // ADMIN — USERS CRUD
  // ==========================================
  async getAdminUsers(orgId?: string): Promise<GeoTaskUser[]> {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: orgId ? { 'x-org-id': orgId } : {}
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async createAdminUser(payload: {
    name: string;
    mobile: string;
    employeeId?: string;
    email?: string;
    assignedSiteId?: string;
    orgId?: string;
  }): Promise<GeoTaskUser> {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(payload.orgId ? { 'x-org-id': payload.orgId } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to create user');
    }
    return res.json();
  },

  async updateAdminUser(id: string, payload: Partial<GeoTaskUser> & { assignedSiteId?: string }, orgId?: string): Promise<GeoTaskUser> {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(orgId ? { 'x-org-id': orgId } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update user');
    return res.json();
  },

  async deleteAdminUser(id: string, orgId?: string): Promise<{ success: boolean; deletedUser: GeoTaskUser }> {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      headers: orgId ? { 'x-org-id': orgId } : {}
    });
    if (!res.ok) throw new Error('Failed to delete user');
    return res.json();
  },

  async getAdminUserReport(userId: string): Promise<UserReport> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/report`);
    if (!res.ok) throw new Error('Failed to fetch user report');
    return res.json();
  },

  // ==========================================
  // ADMIN — TASKS CRUD
  // ==========================================
  async getAdminTasks(userId?: string, orgId?: string): Promise<GeoTaskItem[]> {
    const url = userId ? `${API_BASE}/admin/tasks?userId=${userId}` : `${API_BASE}/admin/tasks`;
    const res = await fetch(url, {
      headers: orgId ? { 'x-org-id': orgId } : {}
    });
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async createAdminTask(payload: {
    title: string;
    description?: string;
    assignedTo: string;
    siteId?: string;
    orgId?: string;
  }): Promise<GeoTaskItem> {
    const res = await fetch(`${API_BASE}/admin/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(payload.orgId ? { 'x-org-id': payload.orgId } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to create task');
    }
    return res.json();
  },

  async updateAdminTask(id: string, payload: Partial<GeoTaskItem> & { siteId?: string }, orgId?: string): Promise<GeoTaskItem> {
    const res = await fetch(`${API_BASE}/admin/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(orgId ? { 'x-org-id': orgId } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  async deleteAdminTask(id: string, orgId?: string): Promise<{ success: boolean; deletedTask: GeoTaskItem }> {
    const res = await fetch(`${API_BASE}/admin/tasks/${id}`, {
      method: 'DELETE',
      headers: orgId ? { 'x-org-id': orgId } : {}
    });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
  },

  // ==========================================
  // ADMIN — ATTENDANCE & PHOTOS
  // ==========================================
  async getAdminAttendance(userId?: string, date?: string, orgId?: string): Promise<GeoTaskAttendanceRecord[]> {
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (date) params.set('date', date);
    const url = `${API_BASE}/admin/attendance?${params.toString()}`;
    const res = await fetch(url, {
      headers: orgId ? { 'x-org-id': orgId } : {}
    });
    if (!res.ok) throw new Error('Failed to fetch attendance');
    return res.json();
  },

  async getAttendancePhotos(id: string): Promise<{
    _id: string;
    userName: string;
    signInPhoto: string | null;
    signOutPhoto: string | null;
  }> {
    const res = await fetch(`${API_BASE}/admin/attendance/${id}/photos`);
    if (!res.ok) throw new Error('Failed to fetch attendance photos');
    return res.json();
  },

  async deleteAttendancePhoto(id: string, type: 'sign-in' | 'sign-out'): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/admin/attendance/${id}/photo/${type}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete photo');
    return res.json();
  },

  // ==========================================
  // ADMIN — DASHBOARD & SHARE LINKS
  // ==========================================
  async getAdminDashboard(orgId?: string): Promise<AdminDashboardStats> {
    const res = await fetch(`${API_BASE}/admin/dashboard`, {
      headers: orgId ? { 'x-org-id': orgId } : {}
    });
    if (!res.ok) throw new Error('Failed to fetch admin dashboard stats');
    return res.json();
  },

  async createShareLink(payload: { name?: string; expiresHours?: number }, orgId?: string): Promise<LiveShareLink> {
    const res = await fetch(`${API_BASE}/admin/share-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(orgId ? { 'x-org-id': orgId } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create share link');
    return res.json();
  },

  async getShareLinks(orgId?: string): Promise<LiveShareLink[]> {
    const res = await fetch(`${API_BASE}/admin/share-links`, {
      headers: orgId ? { 'x-org-id': orgId } : {}
    });
    if (!res.ok) throw new Error('Failed to fetch share links');
    return res.json();
  },

  async revokeShareLink(token: string): Promise<{ success: boolean; token: string }> {
    const res = await fetch(`${API_BASE}/admin/share-link/${token}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to revoke share link');
    return res.json();
  },

  // ==========================================
  // ADMIN — TICKETS & SLA
  // ==========================================
  async getOrgTickets(orgId: string): Promise<GeoTaskTicket[]> {
    const res = await fetch(`${API_BASE}/tickets/org/${orgId}`);
    if (!res.ok) throw new Error('Failed to fetch org tickets');
    return res.json();
  },

  async getTicket(id: string): Promise<GeoTaskTicket> {
    const res = await fetch(`${API_BASE}/tickets/${id}`);
    if (!res.ok) throw new Error('Failed to fetch ticket');
    return res.json();
  },

  async updateTicket(id: string, payload: Partial<GeoTaskTicket>): Promise<GeoTaskTicket> {
    const res = await fetch(`${API_BASE}/tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update ticket');
    return res.json();
  },

  async deleteTicket(id: string): Promise<{ success: boolean; deletedTicket: GeoTaskTicket }> {
    const res = await fetch(`${API_BASE}/tickets/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete ticket');
    return res.json();
  },

  // ==========================================
  // SUPER ADMIN PORTAL
  // ==========================================
  async getSuperAdminStats(): Promise<SuperAdminStats> {
    const res = await fetch(`${API_BASE}/superadmin/stats`);
    if (!res.ok) throw new Error('Failed to fetch platform stats');
    return res.json();
  },

  async getOrganizations(): Promise<Organization[]> {
    const res = await fetch(`${API_BASE}/superadmin/organizations`);
    if (!res.ok) throw new Error('Failed to fetch organizations');
    return res.json();
  },

  async createOrganization(payload: { name: string; code?: string }): Promise<Organization> {
    const res = await fetch(`${API_BASE}/superadmin/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create organization');
    return res.json();
  },

  async updateOrganization(id: string, payload: Partial<Organization>): Promise<Organization> {
    const res = await fetch(`${API_BASE}/superadmin/organizations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update organization');
    return res.json();
  },

  // Soft Delete
  async deactivateOrganization(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/superadmin/organizations/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to deactivate organization');
    return res.json();
  },

  // Permanent Delete (Cascading)
  async deleteOrganizationPermanent(id: string): Promise<{ success: boolean; message: string; deletedOrg: Organization }> {
    const res = await fetch(`${API_BASE}/superadmin/organizations/${id}/permanent`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to permanently delete organization');
    return res.json();
  },

  async getOrgAdmins(orgId: string): Promise<AdminUser[]> {
    const res = await fetch(`${API_BASE}/superadmin/organizations/${orgId}/admins`);
    if (!res.ok) throw new Error('Failed to fetch org admins');
    return res.json();
  },

  async createOrgAdmin(orgId: string, payload: { name: string; email: string; password: string }): Promise<AdminUser> {
    const res = await fetch(`${API_BASE}/superadmin/organizations/${orgId}/admins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create org admin');
    return res.json();
  },

  async updateOrgAdmin(id: string, payload: Partial<AdminUser>): Promise<AdminUser> {
    const res = await fetch(`${API_BASE}/superadmin/admins/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update admin');
    return res.json();
  },

  async deactivateOrgAdmin(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/superadmin/admins/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to deactivate admin');
    return res.json();
  },

  // Cross-Org Super Admin Data
  async getSuperAdminUsers(orgId?: string): Promise<GeoTaskUser[]> {
    const url = orgId ? `${API_BASE}/superadmin/users?orgId=${orgId}` : `${API_BASE}/superadmin/users`;
    const res = await fetch(url);
    return res.json();
  },

  async deleteSuperAdminUser(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/superadmin/users/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async getSuperAdminSites(orgId?: string): Promise<Site[]> {
    const url = orgId ? `${API_BASE}/superadmin/sites?orgId=${orgId}` : `${API_BASE}/superadmin/sites`;
    const res = await fetch(url);
    return res.json();
  },

  async deleteSuperAdminSite(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/superadmin/sites/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async getSuperAdminTasks(orgId?: string): Promise<GeoTaskItem[]> {
    const url = orgId ? `${API_BASE}/superadmin/tasks?orgId=${orgId}` : `${API_BASE}/superadmin/tasks`;
    const res = await fetch(url);
    return res.json();
  },

  async getSuperAdminAttendance(orgId?: string, date?: string): Promise<GeoTaskAttendanceRecord[]> {
    const params = new URLSearchParams();
    if (orgId) params.set('orgId', orgId);
    if (date) params.set('date', date);
    const res = await fetch(`${API_BASE}/superadmin/attendance?${params.toString()}`);
    return res.json();
  },

  async getSuperAdminUserReport(userId: string): Promise<UserReport> {
    const res = await fetch(`${API_BASE}/superadmin/users/${userId}/report`);
    return res.json();
  },

  // ==========================================
  // PUBLIC TRACKING LINK VALIDATION
  // ==========================================
  async getPublicTracking(token: string): Promise<{
    valid: boolean;
    link: LiveShareLink;
    organization: Organization;
    sites: Site[];
    liveLocations: GeoTaskLiveLocation[];
    activeTasks: GeoTaskItem[];
  }> {
    const res = await fetch(`${API_BASE}/track/${token}`);
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Invalid or expired tracking link');
    }
    return res.json();
  },

  // Legacy overview & reset
  async getAdminOverview(orgId?: string): Promise<BackendOverview> {
    const res = await fetch(`${API_BASE}/admin/overview`, {
      headers: orgId ? { 'x-org-id': orgId } : {}
    });
    if (!res.ok) throw new Error('Failed to fetch admin overview');
    return res.json();
  },

  async resetBackend(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/admin/reset`, { method: 'POST' });
    return res.json();
  }
};

// ==========================================
// SOCKET.IO CLIENT SINGLETON
// ==========================================
let socketInstance: Socket | null = null;

export function getGeoTaskSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {
      console.log('[Socket.IO Client] Connected to gateway:', socketInstance?.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket.IO Client] Disconnected:', reason);
    });
  }
  return socketInstance;
}
