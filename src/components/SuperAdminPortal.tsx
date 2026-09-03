import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building2,
  Users,
  Database,
  Trash2,
  Edit2,
  Plus,
  RefreshCw,
  AlertTriangle,
  Lock,
  LogOut,
  X,
  CheckCircle2,
  Layers,
  MapPin,
  Clock,
  CheckSquare
} from 'lucide-react';
import {
  Organization,
  AdminUser,
  SuperAdminStats,
  GeoTaskUser,
  Site,
  GeoTaskItem,
  GeoTaskAttendanceRecord
} from '../types/geoTask';
import { geoTaskApi } from '../services/geoTaskApi';

export const SuperAdminPortal: React.FC = () => {
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('all');

  // Sub-tabs
  const [activeTab, setActiveTab] = useState<'ORGS' | 'CROSS_USERS' | 'CROSS_SITES' | 'CROSS_TASKS' | 'CROSS_ATTENDANCE'>('ORGS');

  // Cross-org lists
  const [crossUsers, setCrossUsers] = useState<GeoTaskUser[]>([]);
  const [crossSites, setCrossSites] = useState<Site[]>([]);
  const [crossTasks, setCrossTasks] = useState<GeoTaskItem[]>([]);
  const [crossAttendance, setCrossAttendance] = useState<GeoTaskAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [orgForm, setOrgForm] = useState({ name: '', code: '' });

  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', orgId: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, orgsData, usersData, sitesData, tasksData, attData] = await Promise.all([
        geoTaskApi.getSuperAdminStats().catch(() => null),
        geoTaskApi.getOrganizations().catch(() => []),
        geoTaskApi.getSuperAdminUsers(selectedOrgId === 'all' ? undefined : selectedOrgId).catch(() => []),
        geoTaskApi.getSuperAdminSites(selectedOrgId === 'all' ? undefined : selectedOrgId).catch(() => []),
        geoTaskApi.getSuperAdminTasks(selectedOrgId === 'all' ? undefined : selectedOrgId).catch(() => []),
        geoTaskApi.getSuperAdminAttendance(selectedOrgId === 'all' ? undefined : selectedOrgId).catch(() => [])
      ]);

      setStats(statsData);
      setOrgs(orgsData);
      setCrossUsers(usersData);
      setCrossSites(sitesData);
      setCrossTasks(tasksData);
      setCrossAttendance(attData);
    } catch (err) {
      console.warn('Super Admin load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedOrgId]);

  // ORG CRUD
  const handleSaveOrg = async () => {
    try {
      if (editingOrg) {
        await geoTaskApi.updateOrganization(editingOrg._id, orgForm);
      } else {
        await geoTaskApi.createOrganization(orgForm);
      }
      setOrgModalOpen(false);
      setEditingOrg(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save organization');
    }
  };

  // Soft Delete (Deactivate)
  const handleSoftDeleteOrg = async (id: string, name: string) => {
    if (!confirm(`Deactivate organization "${name}"? (Soft delete: workers won't be able to log in, but data remains)`)) return;
    try {
      await geoTaskApi.deactivateOrganization(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate organization');
    }
  };

  // Permanent Delete (Cascade wipe)
  const handlePermanentDeleteOrg = async (id: string, name: string) => {
    const promptName = prompt(`CRITICAL DANGER: Permanently wipe organization "${name}" and ALL linked sites, field personnel, shift records, and tasks? Type "${name}" to confirm:`);
    if (promptName !== name) {
      if (promptName !== null) alert('Confirmation mismatch. Deletion aborted.');
      return;
    }
    try {
      await geoTaskApi.deleteOrganizationPermanent(id);
      alert(`Organization "${name}" and all cascading records successfully erased.`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to permanently delete organization');
    }
  };

  // Create Org Admin
  const handleCreateOrgAdmin = async () => {
    try {
      await geoTaskApi.createOrgAdmin(adminForm.orgId, {
        name: adminForm.name,
        email: adminForm.email,
        password: adminForm.password
      });
      setAdminModalOpen(false);
      alert(`Admin account created for ${adminForm.email}`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create org admin');
    }
  };

  // Permanent Delete User
  const handleDeleteUser = async (id: string) => {
    if (!confirm('Permanently wipe this user and all related shift telemetry?')) return;
    try {
      await geoTaskApi.deleteSuperAdminUser(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  // Permanent Delete Site
  const handleDeleteSite = async (id: string) => {
    if (!confirm('Permanently delete this site across the platform?')) return;
    try {
      await geoTaskApi.deleteSuperAdminSite(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete site');
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Super Admin Master Control
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-950 text-purple-300 border border-purple-800/60">
                Root System Overseer
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cross-Organization Management, Soft vs. Permanent Cascading Deletes, Platform Telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Org Filter */}
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none"
          >
            <option value="all">Platform-Wide (All Orgs)</option>
            {orgs.map((o) => (
              <option key={o._id} value={o._id}>{o.name}</option>
            ))}
          </select>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Global Platform KPIs */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-4 py-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Total Tenants</span>
            <p className="text-lg font-black text-white">{stats?.totalOrganizations ?? orgs.length}</p>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-emerald-900/40">
            <span className="text-[10px] text-emerald-400 uppercase font-bold">Active Tenants</span>
            <p className="text-lg font-black text-emerald-400">{stats?.activeOrganizations ?? orgs.filter((o) => o.isActive).length}</p>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Total Workers</span>
            <p className="text-lg font-black text-white">{stats?.totalUsers ?? crossUsers.length}</p>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Geofence Hubs</span>
            <p className="text-lg font-black text-white">{stats?.totalSites ?? crossSites.length}</p>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Total Tasks</span>
            <p className="text-lg font-black text-white">{stats?.totalTasks ?? crossTasks.length}</p>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-purple-900/40">
            <span className="text-[10px] text-purple-400 uppercase font-bold">Today Shifts</span>
            <p className="text-lg font-black text-purple-400">{stats?.todayAttendanceRecords ?? crossAttendance.length}</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-4 flex items-center gap-1 overflow-x-auto">
        {[
          { id: 'ORGS', label: `Organizations (${orgs.length})`, icon: Building2 },
          { id: 'CROSS_USERS', label: `All Personnel (${crossUsers.length})`, icon: Users },
          { id: 'CROSS_SITES', label: `All Sites (${crossSites.length})`, icon: MapPin },
          { id: 'CROSS_TASKS', label: `All Tasks (${crossTasks.length})`, icon: CheckSquare },
          { id: 'CROSS_ATTENDANCE', label: `All Shifts (${crossAttendance.length})`, icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                active
                  ? 'border-purple-500 text-purple-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
        {/* ========================================== */}
        {/* TAB 1: ORGANIZATIONS MANAGEMENT */}
        {/* ========================================== */}
        {activeTab === 'ORGS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Organizations & Tenancy</h3>
                <p className="text-xs text-slate-400">
                  Manage business accounts. Super Admin supports both <strong>Soft Deactivate</strong> and <strong>Permanent Cascading Wipe</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAdminForm({ name: '', email: '', password: '', orgId: orgs[0]?._id || '' });
                    setAdminModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Org Admin</span>
                </button>

                <button
                  onClick={() => {
                    setEditingOrg(null);
                    setOrgForm({ name: '', code: '' });
                    setOrgModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Org</span>
                </button>
              </div>
            </div>

            {/* Organizations Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Organization</th>
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Assigned Workers</th>
                    <th className="p-3.5">Sites</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Danger Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {orgs.map((org) => (
                    <tr key={org._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-purple-400 shrink-0" />
                        <div>
                          <p>{org.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{org._id}</p>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-purple-300 font-bold">{org.code || 'N/A'}</td>
                      <td className="p-3.5 text-slate-300">{org.userCount ?? 0} personnel</td>
                      <td className="p-3.5 text-slate-300">{org.siteCount ?? 0} sites</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            org.isActive
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                              : 'bg-rose-950 text-rose-400 border border-rose-800/50'
                          }`}
                        >
                          {org.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => {
                            setEditingOrg(org);
                            setOrgForm({ name: org.name, code: org.code || '' });
                            setOrgModalOpen(true);
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold cursor-pointer"
                        >
                          Edit
                        </button>
                        {org.isActive && (
                          <button
                            onClick={() => handleSoftDeleteOrg(org._id, org.name)}
                            className="px-2 py-1 bg-amber-950/70 hover:bg-amber-900 text-amber-300 rounded-lg text-[11px] font-semibold cursor-pointer"
                            title="Soft delete (deactivate)"
                          >
                            Deactivate
                          </button>
                        )}
                        <button
                          onClick={() => handlePermanentDeleteOrg(org._id, org.name)}
                          className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-lg text-[11px] font-bold cursor-pointer"
                          title="Cascade wipe all data"
                        >
                          Permanent Wipe
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: CROSS-ORG USERS */}
        {/* ========================================== */}
        {activeTab === 'CROSS_USERS' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">All Registered Personnel ({crossUsers.length})</h3>
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Mobile</th>
                    <th className="p-3.5">Organization</th>
                    <th className="p-3.5">Assigned Site</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {crossUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-white">{u.name}</td>
                      <td className="p-3.5 font-mono">{u.mobile}</td>
                      <td className="p-3.5 text-purple-300 font-semibold">{u.organization?.name || u.organizationId}</td>
                      <td className="p-3.5 text-slate-300">{u.assignedSite?.name || 'None'}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-1 hover:bg-rose-950 text-rose-400 rounded cursor-pointer"
                          title="Permanent Delete"
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
        )}

        {/* ========================================== */}
        {/* TAB 3: CROSS-ORG SITES */}
        {/* ========================================== */}
        {activeTab === 'CROSS_SITES' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">All Geofence Hubs ({crossSites.length})</h3>
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Site Name</th>
                    <th className="p-3.5">Org ID</th>
                    <th className="p-3.5">Coordinates</th>
                    <th className="p-3.5">Allowed Radius</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {crossSites.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-white">{s.name}</td>
                      <td className="p-3.5 font-mono text-purple-300">{s.organizationId}</td>
                      <td className="p-3.5 font-mono">{Number(s.latitude).toFixed(4)}, {Number(s.longitude).toFixed(4)}</td>
                      <td className="p-3.5 font-mono font-bold text-indigo-400">{s.radiusMeters}m</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeleteSite(s._id)}
                          className="p-1 hover:bg-rose-950 text-rose-400 rounded cursor-pointer"
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
        )}

        {/* ========================================== */}
        {/* TAB 4: CROSS-ORG TASKS */}
        {/* ========================================== */}
        {activeTab === 'CROSS_TASKS' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">All Field Tasks ({crossTasks.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {crossTasks.map((task) => (
                <div key={task._id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-purple-400 font-mono">{task.organizationId}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                      {task.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{task.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 5: CROSS-ORG ATTENDANCE */}
        {/* ========================================== */}
        {activeTab === 'CROSS_ATTENDANCE' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">All Platform Attendance Shifts ({crossAttendance.length})</h3>
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Employee</th>
                    <th className="p-3.5">Org</th>
                    <th className="p-3.5">Site</th>
                    <th className="p-3.5">Sign In Time</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {crossAttendance.map((rec) => (
                    <tr key={rec._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-white">{rec.userName}</td>
                      <td className="p-3.5 font-mono text-purple-400">{rec.organizationId}</td>
                      <td className="p-3.5 text-slate-300">{rec.siteName}</td>
                      <td className="p-3.5 font-mono">{new Date(rec.signInTime).toLocaleString()}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rec.signOutTime ? 'bg-slate-800 text-slate-300' : 'bg-emerald-950 text-emerald-400'}`}>
                          {rec.signOutTime ? 'Completed' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Org Modal */}
      {orgModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingOrg ? 'Edit Organization' : 'Create New Organization'}
              </h3>
              <button onClick={() => setOrgModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Organization Name</label>
                <input
                  type="text"
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  placeholder="e.g. Apex Energy Corp"
                  className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Org Code (Uppercase)</label>
                <input
                  type="text"
                  value={orgForm.code}
                  onChange={(e) => setOrgForm({ ...orgForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. APEX"
                  className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-xl focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setOrgModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOrg}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow cursor-pointer"
              >
                Save Organization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Modal */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create Org Admin Account</h3>
              <button onClick={() => setAdminModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Target Organization</label>
                <select
                  value={adminForm.orgId}
                  onChange={(e) => setAdminForm({ ...adminForm, orgId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-xl focus:outline-none"
                >
                  {orgs.map((o) => (
                    <option key={o._id} value={o._id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Admin Full Name</label>
                <input
                  type="text"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  placeholder="e.g. Rachel Adams"
                  className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Email Address</label>
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  placeholder="rachel@apex.com"
                  className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Password</label>
                <input
                  type="password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setAdminModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrgAdmin}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow cursor-pointer"
              >
                Create Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
