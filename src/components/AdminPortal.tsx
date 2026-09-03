import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Users,
  CheckSquare,
  Clock,
  Ticket,
  Share2,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Camera,
  X,
  Radio,
  Lock,
  LogOut,
  Sparkles,
  Layers,
  ChevronRight,
  List,
  Globe2,
  Download
} from 'lucide-react';
import {
  Site,
  GeoTaskUser,
  GeoTaskItem,
  GeoTaskAttendanceRecord,
  GeoTaskTicket,
  LiveShareLink,
  AdminDashboardStats,
  UserReport,
  GeoTaskLiveLocation,
  Organization
} from '../types/geoTask';
import { geoTaskApi, getGeoTaskSocket } from '../services/geoTaskApi';
import { AdminFleetMap } from './AdminFleetMap';
import { SiteLocationPickerModal } from './SiteLocationPickerModal';

interface AdminPortalProps {
  onOpenPublicTrack?: (token: string) => void;
  onSwitchView?: (view: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onOpenPublicTrack, onSwitchView }) => {
  // Auth State
  const [adminToken, setAdminToken] = useState<string | null>(localStorage.getItem('@admin_token'));
  const [adminUser, setAdminUser] = useState<any>(() => {
    const saved = localStorage.getItem('@admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Login form
  const [loginEmail, setLoginEmail] = useState('admin@acme.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Selected Org
  const [currentOrgId, setCurrentOrgId] = useState<string>('org1');
  const [availableOrgs, setAvailableOrgs] = useState<Organization[]>([]);

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SITES' | 'USERS' | 'TASKS' | 'ATTENDANCE' | 'TICKETS' | 'SHARE_LINKS'>('OVERVIEW');
  const [siteViewMode, setSiteViewMode] = useState<'TABLE' | 'MAP'>('TABLE');

  // Data States
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [users, setUsers] = useState<GeoTaskUser[]>([]);
  const [tasks, setTasks] = useState<GeoTaskItem[]>([]);
  const [attendance, setAttendance] = useState<GeoTaskAttendanceRecord[]>([]);
  const [tickets, setTickets] = useState<GeoTaskTicket[]>([]);
  const [shareLinks, setShareLinks] = useState<LiveShareLink[]>([]);
  const [liveLocations, setLiveLocations] = useState<GeoTaskLiveLocation[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [siteModalOpen, setSiteModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [initialSiteCoords, setInitialSiteCoords] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  const [siteForm, setSiteForm] = useState({ name: '', latitude: 28.6139, longitude: 77.209, radiusMeters: 100 });

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<GeoTaskUser | null>(null);
  const [userForm, setUserForm] = useState({ name: '', mobile: '', employeeId: '', email: '', assignedSiteId: '' });

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<GeoTaskItem | null>(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', siteId: '' });

  const [reportModalUser, setReportModalUser] = useState<UserReport | null>(null);
  const [photoModalRecord, setPhotoModalRecord] = useState<GeoTaskAttendanceRecord | null>(null);
  const [ticketEditModal, setTicketEditModal] = useState<GeoTaskTicket | null>(null);

  // Share Link Form
  const [newShareName, setNewShareName] = useState('');
  const [newShareHours, setNewShareHours] = useState(24);
  const [generatedLinkAlert, setGeneratedLinkAlert] = useState<string | null>(null);

  // Filters
  const [taskUserFilter, setTaskUserFilter] = useState<string>('');
  const [attendanceUserFilter, setAttendanceUserFilter] = useState<string>('');

  // Initial Data Load
  const loadOrgData = async () => {
    setLoading(true);
    try {
      const [statsData, sitesData, usersData, tasksData, attData, ticketsData, linksData, orgsData] = await Promise.all([
        geoTaskApi.getAdminDashboard(currentOrgId).catch(() => null),
        geoTaskApi.getAdminSites(currentOrgId).catch(() => []),
        geoTaskApi.getAdminUsers(currentOrgId).catch(() => []),
        geoTaskApi.getAdminTasks(undefined, currentOrgId).catch(() => []),
        geoTaskApi.getAdminAttendance(undefined, undefined, currentOrgId).catch(() => []),
        geoTaskApi.getOrgTickets(currentOrgId).catch(() => []),
        geoTaskApi.getShareLinks(currentOrgId).catch(() => []),
        geoTaskApi.getOrganizations().catch(() => [])
      ]);

      setStats(statsData);
      setSites(sitesData);
      setUsers(usersData);
      setTasks(tasksData);
      setAttendance(attData);
      setTickets(ticketsData);
      setShareLinks(linksData);
      if (orgsData && orgsData.length > 0) {
        setAvailableOrgs(orgsData);
      }
    } catch (err) {
      console.warn('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrgData();

    // Setup Socket.IO for live dashboard updates
    const socket = getGeoTaskSocket();
    const handleLocation = (loc: GeoTaskLiveLocation) => {
      if (loc.organizationId === currentOrgId) {
        setLiveLocations((prev) => {
          const idx = prev.findIndex((l) => l.userId === loc.userId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = loc;
            return next;
          }
          return [loc, ...prev];
        });
      }
    };

    const handleAttendance = () => loadOrgData();
    const handleTask = () => loadOrgData();
    const handleTicket = () => loadOrgData();
    const handleSiteSync = () => {
      geoTaskApi.getAdminSites(currentOrgId).then((res) => setSites(res || [])).catch(() => {});
    };

    socket.on('employee:location', handleLocation);
    socket.on('attendance:sign-in', handleAttendance);
    socket.on('attendance:sign-out', handleAttendance);
    socket.on('task:update', handleTask);
    socket.on('ticket:new', handleTicket);
    socket.on('site:new', handleSiteSync);
    socket.on('site:update', handleSiteSync);
    socket.on('site:delete', handleSiteSync);

    return () => {
      socket.off('employee:location', handleLocation);
      socket.off('attendance:sign-in', handleAttendance);
      socket.off('attendance:sign-out', handleAttendance);
      socket.off('task:update', handleTask);
      socket.off('ticket:new', handleTicket);
      socket.off('site:new', handleSiteSync);
      socket.off('site:update', handleSiteSync);
      socket.off('site:delete', handleSiteSync);
    };
  }, [currentOrgId]);

  // Admin Login Handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await geoTaskApi.adminLogin(loginEmail, loginPassword);
      if (res.success && res.token && res.admin) {
        setAdminToken(res.token);
        setAdminUser(res.admin);
        if (res.admin.organizationId) {
          setCurrentOrgId(res.admin.organizationId);
        }
        localStorage.setItem('@admin_token', res.token);
        localStorage.setItem('@admin_user', JSON.stringify(res.admin));
      } else {
        setLoginError(res.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    setAdminUser(null);
    localStorage.removeItem('@admin_token');
    localStorage.removeItem('@admin_user');
  };

  // SITES CRUD
  const handleSaveSite = async (siteData: { name: string; latitude: number; longitude: number; radiusMeters: number }) => {
    try {
      if (editingSite) {
        await geoTaskApi.updateAdminSite(editingSite._id, siteData, currentOrgId);
      } else {
        await geoTaskApi.createAdminSite({ ...siteData, orgId: currentOrgId });
      }
      setSiteModalOpen(false);
      setEditingSite(null);
      setInitialSiteCoords(undefined);
      await loadOrgData();
    } catch (err: any) {
      alert(err.message || 'Failed to save site');
      throw err;
    }
  };

  const handleDeleteSite = async (id: string) => {
    if (!confirm('Are you sure you want to delete this site? (Hard delete within organization)')) return;
    try {
      await geoTaskApi.deleteAdminSite(id, currentOrgId);
      loadOrgData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete site');
    }
  };

  // USERS CRUD
  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        await geoTaskApi.updateAdminUser(editingUser._id, userForm, currentOrgId);
      } else {
        await geoTaskApi.createAdminUser({ ...userForm, orgId: currentOrgId });
      }
      setUserModalOpen(false);
      setEditingUser(null);
      loadOrgData();
    } catch (err: any) {
      alert(err.message || 'Failed to save employee');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee? (Hard delete within organization)')) return;
    try {
      await geoTaskApi.deleteAdminUser(id, currentOrgId);
      loadOrgData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete employee');
    }
  };

  const handleOpenReport = async (userId: string) => {
    try {
      const report = await geoTaskApi.getAdminUserReport(userId);
      setReportModalUser(report);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch user report');
    }
  };

  // TASKS CRUD
  const handleSaveTask = async () => {
    try {
      if (editingTask) {
        await geoTaskApi.updateAdminTask(editingTask._id, taskForm, currentOrgId);
      } else {
        await geoTaskApi.createAdminTask({ ...taskForm, orgId: currentOrgId });
      }
      setTaskModalOpen(false);
      setEditingTask(null);
      loadOrgData();
    } catch (err: any) {
      alert(err.message || 'Failed to save task');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await geoTaskApi.deleteAdminTask(id, currentOrgId);
      loadOrgData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  // SHARE LINKS
  const handleCreateShareLink = async () => {
    try {
      const link = await geoTaskApi.createShareLink({
        name: newShareName || 'Dispatch Live Fleet Tracking',
        expiresHours: newShareHours
      }, currentOrgId);
      setGeneratedLinkAlert(`Public Share Link Generated! Token: ${link.token}`);
      setNewShareName('');
      loadOrgData();
    } catch (err: any) {
      alert(err.message || 'Failed to create share link');
    }
  };

  const handleRevokeShareLink = async (token: string) => {
    if (!confirm('Revoke this public share link immediately?')) return;
    try {
      await geoTaskApi.revokeShareLink(token);
      loadOrgData();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke link');
    }
  };

  // TICKET UPDATE
  const handleUpdateTicketStatus = async (ticketId: string, status: 'open' | 'in-review' | 'resolved') => {
    try {
      await geoTaskApi.updateTicket(ticketId, { status });
      loadOrgData();
      if (ticketEditModal?._id === ticketId) {
        setTicketEditModal(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket');
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Delete this support ticket?')) return;
    try {
      await geoTaskApi.deleteTicket(ticketId);
      loadOrgData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete ticket');
    }
  };

  // PHOTO DELETION
  const handleDeletePhoto = async (recordId: string, type: 'sign-in' | 'sign-out') => {
    if (!confirm(`Delete ${type} photo from record?`)) return;
    try {
      await geoTaskApi.deleteAttendancePhoto(recordId, type);
      loadOrgData();
      setPhotoModalRecord(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete photo');
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-950 text-slate-100 font-sans">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Organization Admin Console
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                Multi-Tenant Org Scoped
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Manage Sites, Field Workers, Tasks, Geofences & Live Telemetry
            </p>
          </div>
        </div>

        {/* Org Selector & Status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">Active Tenant:</span>
            <select
              value={currentOrgId}
              onChange={(e) => setCurrentOrgId(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              {availableOrgs.length > 0 ? (
                availableOrgs.map((org) => (
                  <option key={org.id} value={org.id} className="bg-slate-900">
                    {org.name} ({org.id})
                  </option>
                ))
              ) : (
                <>
                  <option value="org1" className="bg-slate-900">Acme Enterprise (org1)</option>
                  <option value="org2" className="bg-slate-900">Logistics Prime Global (org2)</option>
                </>
              )}
            </select>
          </div>

          <button
            onClick={loadOrgData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Refresh All Org Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <a
            href="/api/download/GeoAttend.apk"
            download="GeoAttend-v1.0.apk"
            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download Android APK (v1.0.0)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Worker APK</span>
          </a>
        </div>
      </div>

      {/* Admin Auth Notice if not logged in */}
      {!adminToken && (
        <div className="bg-indigo-950/40 border-b border-indigo-900/60 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-400" />
            <span>Currently previewing as Dispatch Manager. You can login for full token authorization:</span>
            <code className="bg-indigo-900/70 px-2 py-0.5 rounded text-indigo-100 font-mono">admin@acme.com / admin123</code>
          </div>
          <button
            onClick={() => {
              setLoginEmail('admin@acme.com');
              setLoginPassword('admin123');
              handleAdminLogin({ preventDefault: () => {} } as any);
            }}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow transition-colors cursor-pointer"
          >
            Quick 1-Click Login
          </button>
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 flex items-center gap-1 overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: 'Dashboard & Fleet Map', icon: MapPin },
          { id: 'SITES', label: `Sites (${sites.length})`, icon: Building2 },
          { id: 'USERS', label: `Employees (${users.length})`, icon: Users },
          { id: 'TASKS', label: `Tasks (${tasks.length})`, icon: CheckSquare },
          { id: 'ATTENDANCE', label: `Attendance (${attendance.length})`, icon: Clock },
          { id: 'TICKETS', label: `Tickets (${tickets.length})`, icon: Ticket },
          { id: 'SHARE_LINKS', label: `Live Links (${shareLinks.length})`, icon: Share2 }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                active
                  ? 'border-indigo-500 text-indigo-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Body */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
        {/* ==================================================== */}
        {/* TAB 1: OVERVIEW & LIVE FLEET MAP */}
        {/* ==================================================== */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-sm">
                <span className="text-[11px] font-medium text-slate-400">Total Workers</span>
                <p className="text-xl font-black text-white mt-1">{stats?.totalEmployees ?? users.length}</p>
              </div>
              <div className="bg-slate-900 p-3 rounded-2xl border border-emerald-900/50 shadow-sm">
                <span className="text-[11px] font-medium text-emerald-400">Live in Field</span>
                <p className="text-xl font-black text-emerald-400 mt-1">{liveLocations.length || stats?.activeInField || 1}</p>
              </div>
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-sm">
                <span className="text-[11px] font-medium text-slate-400">Geofence Sites</span>
                <p className="text-xl font-black text-white mt-1">{sites.length}</p>
              </div>
              <div className="bg-slate-900 p-3 rounded-2xl border border-amber-900/50 shadow-sm">
                <span className="text-[11px] font-medium text-amber-400">Tasks Pending</span>
                <p className="text-xl font-black text-amber-400 mt-1">{tasks.filter((t) => t.status === 'pending').length}</p>
              </div>
              <div className="bg-slate-900 p-3 rounded-2xl border border-indigo-900/50 shadow-sm">
                <span className="text-[11px] font-medium text-indigo-400">In-Progress</span>
                <p className="text-xl font-black text-indigo-400 mt-1">{tasks.filter((t) => t.status === 'in-progress').length}</p>
              </div>
              <div className="bg-slate-900 p-3 rounded-2xl border border-emerald-900/50 shadow-sm">
                <span className="text-[11px] font-medium text-emerald-400">Completed</span>
                <p className="text-xl font-black text-emerald-400 mt-1">{tasks.filter((t) => t.status === 'completed').length}</p>
              </div>
              <div className="bg-slate-900 p-3 rounded-2xl border border-rose-900/50 shadow-sm">
                <span className="text-[11px] font-medium text-rose-400">Open Tickets</span>
                <p className="text-xl font-black text-rose-400 mt-1">{tickets.filter((t) => t.status !== 'resolved').length}</p>
              </div>
            </div>

            {/* Interactive Live Fleet Map */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <h3 className="text-sm font-bold text-white">Live Field Telemetry & Geofence Circles</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Real-time Leaflet GIS (OSM / CARTO)
                </span>
              </div>
              <div className="h-[460px] rounded-xl overflow-hidden border border-slate-800">
                <AdminFleetMap
                  sites={sites}
                  liveLocations={liveLocations}
                  users={users}
                  onMapClickAddSite={(coords) => {
                    setEditingSite(null);
                    setInitialSiteCoords(coords);
                    setSiteModalOpen(true);
                  }}
                  onSelectSite={(site) => {
                    setEditingSite(site);
                    setInitialSiteCoords(undefined);
                    setSiteModalOpen(true);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: SITES MANAGEMENT (CRUD & MAP PICKER) */}
        {/* ==================================================== */}
        {activeTab === 'SITES' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  <span>Geofenced Sites ({sites.length})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Workers can only sign in and start tasks within each site's GPS perimeter (Haversine formula enforced).
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* View Switcher: Table vs Interactive Map */}
                <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
                  <button
                    onClick={() => setSiteViewMode('TABLE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      siteViewMode === 'TABLE' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Table View</span>
                  </button>
                  <button
                    onClick={() => setSiteViewMode('MAP')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      siteViewMode === 'MAP' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Globe2 className="w-3.5 h-3.5" />
                    <span>Map View</span>
                  </button>
                </div>

                {/* Add Site Action */}
                <button
                  onClick={() => {
                    setEditingSite(null);
                    setInitialSiteCoords(undefined);
                    setSiteModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Site (Search or Pin)</span>
                </button>
              </div>
            </div>

            {/* View 1: Interactive Map Mode */}
            {siteViewMode === 'MAP' ? (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Interactive Facility GIS — Click anywhere to add a site, or click any site marker to view/edit perimeter
                  </span>
                </div>
                <div className="h-[520px] rounded-xl overflow-hidden border border-slate-800">
                  <AdminFleetMap
                    sites={sites}
                    liveLocations={liveLocations}
                    users={users}
                    onMapClickAddSite={(coords) => {
                      setEditingSite(null);
                      setInitialSiteCoords(coords);
                      setSiteModalOpen(true);
                    }}
                    onSelectSite={(site) => {
                      setEditingSite(site);
                      setInitialSiteCoords(undefined);
                      setSiteModalOpen(true);
                    }}
                  />
                </div>
              </div>
            ) : (
              /* View 2: Detailed Table Mode */
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Site Name</th>
                        <th className="p-3.5">Coordinates (Lat, Lng)</th>
                        <th className="p-3.5">Allowed Radius</th>
                        <th className="p-3.5">Assigned Workers</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {sites.map((s) => {
                        const count = users.filter((u) => u.assignedSite?._id === s._id).length;
                        return (
                          <tr key={s._id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3.5 font-bold text-white flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                              <span>{s.name}</span>
                            </td>
                            <td className="p-3.5 font-mono text-slate-300">
                              {Number(s.latitude).toFixed(4)}, {Number(s.longitude).toFixed(4)}
                            </td>
                            <td className="p-3.5">
                              <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/50 font-bold font-mono">
                                {s.radiusMeters} meters
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-300">{count} workers</td>
                            <td className="p-3.5 text-right space-x-1.5">
                              <button
                                onClick={() => {
                                  setEditingSite(s);
                                  setInitialSiteCoords(undefined);
                                  setSiteModalOpen(true);
                                }}
                                className="px-2 py-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800/60 text-indigo-300 hover:text-white rounded-lg transition-colors cursor-pointer text-[11px] font-semibold inline-flex items-center gap-1"
                                title="Locate & Edit Geofence on Map"
                              >
                                <MapPin className="w-3 h-3" />
                                <span>Locate / Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteSite(s._id)}
                                className="p-1.5 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 rounded-lg transition-colors cursor-pointer"
                                title="Delete Site"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: EMPLOYEES / USERS MANAGEMENT (CRUD) */}
        {/* ==================================================== */}
        {activeTab === 'USERS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Field Personnel ({users.length})</h3>
                <p className="text-xs text-slate-400">
                  Manage worker profiles, assigned home sites, and access full individual telemetry reports.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setUserForm({ name: '', mobile: '', employeeId: '', email: '', assignedSiteId: sites[0]?._id || '' });
                  setUserModalOpen(true);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Employee</span>
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Employee</th>
                      <th className="p-3.5">Mobile (OTP Login)</th>
                      <th className="p-3.5">Emp ID</th>
                      <th className="p-3.5">Assigned Site</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-bold text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-400">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p>{u.name}</p>
                            <p className="text-[10px] text-slate-400 font-normal">{u.email || 'No email'}</p>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-300">{u.mobile}</td>
                        <td className="p-3.5 font-mono text-slate-400">{u.employeeId}</td>
                        <td className="p-3.5 text-slate-300">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 text-[11px] font-semibold">
                            {u.assignedSite?.name || 'Unassigned'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950 text-rose-400'
                            }`}
                          >
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => handleOpenReport(u._id)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                            title="View Full Report"
                          >
                            Full Report
                          </button>
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setUserForm({
                                name: u.name,
                                mobile: u.mobile,
                                employeeId: u.employeeId,
                                email: u.email || '',
                                assignedSiteId: u.assignedSite?._id || ''
                              });
                              setUserModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="p-1.5 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: TASKS MANAGEMENT (CRUD) */}
        {/* ==================================================== */}
        {activeTab === 'TASKS' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Field Tasks ({tasks.length})</h3>
                <p className="text-xs text-slate-400">
                  Tasks are assigned to employees with designated site coordinates. Server rejects completion if outside perimeter!
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Filter by user */}
                <select
                  value={taskUserFilter}
                  onChange={(e) => setTaskUserFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-xs text-slate-300 px-3 py-1.5 rounded-xl focus:outline-none"
                >
                  <option value="">All Employees</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    setEditingTask(null);
                    setTaskForm({
                      title: '',
                      description: '',
                      assignedTo: users[0]?._id || '',
                      siteId: sites[0]?._id || ''
                    });
                    setTaskModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Task</span>
                </button>
              </div>
            </div>

            {/* Task Grid / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks
                .filter((t) => !taskUserFilter || t.assignedTo === taskUserFilter)
                .map((task) => {
                  const assignedUser = users.find((u) => u._id === task.assignedTo);
                  return (
                    <div
                      key={task._id}
                      className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3 shadow-sm hover:border-slate-700 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              task.status === 'completed'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                                : task.status === 'in-progress'
                                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {task.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {task.site?.name || 'Default Site'}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white">{task.title}</h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="font-semibold">{assignedUser?.name || task.assignedUserName || 'Unknown'}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingTask(task);
                              setTaskForm({
                                title: task.title,
                                description: task.description,
                                assignedTo: task.assignedTo,
                                siteId: task.site?._id || ''
                              });
                              setTaskModalOpen(true);
                            }}
                            className="p-1 hover:bg-slate-800 text-slate-300 rounded cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="p-1 hover:bg-rose-950/60 text-rose-400 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: ATTENDANCE & VERIFICATION PHOTOS */}
        {/* ==================================================== */}
        {activeTab === 'ATTENDANCE' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Attendance Logs & Photo Audits ({attendance.length})</h3>
                <p className="text-xs text-slate-400">
                  Review worker sign-in/out timestamps, GPS coordinates, and face selfie verifications.
                </p>
              </div>

              {/* User filter */}
              <select
                value={attendanceUserFilter}
                onChange={(e) => setAttendanceUserFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-300 px-3 py-1.5 rounded-xl focus:outline-none"
              >
                <option value="">All Workers</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* Attendance Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Employee</th>
                      <th className="p-3.5">Site</th>
                      <th className="p-3.5">Sign In Time</th>
                      <th className="p-3.5">Sign Out Time</th>
                      <th className="p-3.5">Photos</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {attendance
                      .filter((r) => !attendanceUserFilter || r.userId === attendanceUserFilter)
                      .map((rec) => (
                        <tr key={rec._id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-bold text-white">{rec.userName}</td>
                          <td className="p-3.5 text-slate-300">{rec.siteName}</td>
                          <td className="p-3.5 font-mono text-slate-300">
                            {new Date(rec.signInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3.5 font-mono text-slate-300">
                            {rec.signOutTime
                              ? new Date(rec.signOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : <span className="text-emerald-400 font-bold">Active in Shift</span>}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              {rec.photo ? (
                                <button
                                  onClick={() => setPhotoModalRecord(rec)}
                                  className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Camera className="w-3 h-3" />
                                  <span>In Selfie</span>
                                </button>
                              ) : (
                                <span className="text-slate-500 text-[10px]">No in-photo</span>
                              )}

                              {rec.signOutPhoto && (
                                <button
                                  onClick={() => setPhotoModalRecord(rec)}
                                  className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Camera className="w-3 h-3" />
                                  <span>Out Selfie</span>
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => setPhotoModalRecord(rec)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Audit Record
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 6: SUPPORT TICKETS & SLA */}
        {/* ==================================================== */}
        {activeTab === 'TICKETS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Worker Issues & SLA Tracker ({tickets.length})</h3>
                <p className="text-xs text-slate-400">
                  Live issue tickets reported from field workers with exact GPS coordinates and resolution workflows.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.map((t) => (
                <div
                  key={t._id}
                  className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3 shadow-sm hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          t.status === 'resolved'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                            : t.status === 'in-review'
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                            : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                        }`}
                      >
                        {t.status}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {t.priority} priority
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-white">{t.message}</p>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Lodged by: <strong className="text-slate-200">{t.userName}</strong></span>
                    <div className="flex items-center gap-1">
                      {t.status !== 'resolved' && (
                        <button
                          onClick={() => handleUpdateTicketStatus(t._id, 'resolved')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTicket(t._id)}
                        className="p-1 hover:bg-rose-950/60 text-rose-400 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 7: PUBLIC LIVE SHARE LINKS */}
        {/* ==================================================== */}
        {activeTab === 'SHARE_LINKS' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Public Live-Tracking Links ({shareLinks.length})</h3>
              <p className="text-xs text-slate-400">
                Generate temporary tokens that clients or managers can open directly (e.g. <code>/track/:token</code>) to watch field crews in real time.
              </p>
            </div>

            {/* Generator Card */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-400" />
                <span>Create New Live Tracking Link</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Link label (e.g. Client Site Visit)"
                  value={newShareName}
                  onChange={(e) => setNewShareName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
                />
                <select
                  value={newShareHours}
                  onChange={(e) => setNewShareHours(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl focus:outline-none"
                >
                  <option value={12}>Expires in 12 Hours</option>
                  <option value={24}>Expires in 24 Hours</option>
                  <option value={72}>Expires in 3 Days</option>
                </select>
                <button
                  onClick={handleCreateShareLink}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition-colors cursor-pointer"
                >
                  Generate Share Token
                </button>
              </div>

              {generatedLinkAlert && (
                <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-800 text-xs text-indigo-200 flex items-center justify-between">
                  <span>{generatedLinkAlert}</span>
                  <button
                    onClick={() => setGeneratedLinkAlert(null)}
                    className="text-indigo-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Active Links Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Link Name</th>
                    <th className="p-3.5">Share Token</th>
                    <th className="p-3.5">Expires At</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {shareLinks.map((link) => (
                    <tr key={link.token} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-white">{link.name}</td>
                      <td className="p-3.5 font-mono text-indigo-400 font-bold">{link.token}</td>
                      <td className="p-3.5 font-mono text-slate-400">
                        {new Date(link.expiresAt).toLocaleDateString()} {new Date(link.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                          Active Public
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => {
                            if (onOpenPublicTrack) {
                              onOpenPublicTrack(link.token);
                            } else {
                              window.location.hash = `/track/${link.token}`;
                            }
                          }}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          View Public Page
                        </button>
                        <button
                          onClick={() => handleRevokeShareLink(link.token)}
                          className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODALS */}
      {/* ==================================================== */}

      {/* 1. Site Modal (Interactive Map & Geocoded Search) */}
      <SiteLocationPickerModal
        isOpen={siteModalOpen}
        editingSite={editingSite}
        initialLocation={initialSiteCoords}
        onClose={() => {
          setSiteModalOpen(false);
          setEditingSite(null);
          setInitialSiteCoords(undefined);
        }}
        onSave={handleSaveSite}
      />

      {/* 2. User Modal */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingUser ? 'Edit Field Employee' : 'Register New Field Employee'}
              </h3>
              <button onClick={() => setUserModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Full Name</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="e.g. Rohan Verma"
                  className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Mobile Number (Passwordless OTP)</label>
                <input
                  type="tel"
                  value={userForm.mobile}
                  onChange={(e) => setUserForm({ ...userForm, mobile: e.target.value })}
                  placeholder="e.g. 9990004444"
                  className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-xl focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Employee ID</label>
                  <input
                    type="text"
                    value={userForm.employeeId}
                    onChange={(e) => setUserForm({ ...userForm, employeeId: e.target.value })}
                    placeholder="EMP099"
                    className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-xl focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Assigned Site</label>
                  <select
                    value={userForm.assignedSiteId}
                    onChange={(e) => setUserForm({ ...userForm, assignedSiteId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-xl focus:outline-none"
                  >
                    {sites.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setUserModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow cursor-pointer"
              >
                Save Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Task Modal */}
      {taskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingTask ? 'Edit Task' : 'Create & Assign Task'}
              </h3>
              <button onClick={() => setTaskModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Task Title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. High-Voltage Circuit Breaker Inspection"
                  className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Description & Instructions</label>
                <textarea
                  rows={3}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Provide instructions for field execution..."
                  className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Assign To Worker</label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-xl focus:outline-none"
                  >
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Designated Site</label>
                  <select
                    value={taskForm.siteId}
                    onChange={(e) => setTaskForm({ ...taskForm, siteId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-xl focus:outline-none"
                  >
                    {sites.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setTaskModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTask}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow cursor-pointer"
              >
                Save Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Full User Report Modal */}
      {reportModalUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Full Personnel Audit Report</h3>
                <p className="text-xs text-indigo-400 font-semibold">{reportModalUser.user.name} ({reportModalUser.user.employeeId})</p>
              </div>
              <button onClick={() => setReportModalUser(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400">Total Shifts</span>
                <p className="text-lg font-black text-white mt-1">{reportModalUser.totalAttendanceSessions}</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400">Hours Logged</span>
                <p className="text-lg font-black text-emerald-400 mt-1">{reportModalUser.totalHoursWorked} hrs</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400">Tasks Completed</span>
                <p className="text-lg font-black text-indigo-400 mt-1">{reportModalUser.completedTasksCount}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Shift History</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {reportModalUser.attendanceHistory.length === 0 ? (
                  <p className="text-xs text-slate-500">No shift logs on file.</p>
                ) : (
                  reportModalUser.attendanceHistory.map((h) => (
                    <div key={h._id} className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
                      <span className="font-semibold text-slate-300">{h.siteName}</span>
                      <span className="font-mono text-slate-400">
                        {new Date(h.signInTime).toLocaleDateString()} {new Date(h.signInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Photo Audit Modal */}
      {photoModalRecord && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Selfie Face Verification Audit</h3>
              <button onClick={() => setPhotoModalRecord(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-bold text-indigo-300 mb-2">Check-in Photo</span>
                {photoModalRecord.photo ? (
                  <div className="space-y-2">
                    <img
                      src={photoModalRecord.photo}
                      alt="Sign in selfie"
                      className="w-full h-44 object-cover rounded-xl border border-slate-800"
                    />
                    <button
                      onClick={() => handleDeletePhoto(photoModalRecord._id, 'sign-in')}
                      className="w-full py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded text-xs font-bold cursor-pointer"
                    >
                      Delete Photo
                    </button>
                  </div>
                ) : (
                  <div className="h-44 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xs text-slate-500">
                    No Sign-in Photo
                  </div>
                )}
              </div>

              <div>
                <span className="block text-xs font-bold text-purple-300 mb-2">Check-out Photo</span>
                {photoModalRecord.signOutPhoto ? (
                  <div className="space-y-2">
                    <img
                      src={photoModalRecord.signOutPhoto}
                      alt="Sign out selfie"
                      className="w-full h-44 object-cover rounded-xl border border-slate-800"
                    />
                    <button
                      onClick={() => handleDeletePhoto(photoModalRecord._id, 'sign-out')}
                      className="w-full py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded text-xs font-bold cursor-pointer"
                    >
                      Delete Photo
                    </button>
                  </div>
                ) : (
                  <div className="h-44 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xs text-slate-500">
                    No Sign-out Photo
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
