import React, { useState } from 'react';
import {
  Activity,
  Terminal,
  Database,
  Radio,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  Users,
  MapPin,
  ListTodo,
  FileCheck2,
  LifeBuoy,
  Map as MapIcon
} from 'lucide-react';
import { BackendOverview, GeoTaskLiveLocation } from '../types/geoTask';
import { geoTaskApi } from '../services/geoTaskApi';
import { AdminFleetMap } from './AdminFleetMap';

interface AdminMonitorPanelProps {
  overview: BackendOverview | null;
  liveLocations: GeoTaskLiveLocation[];
  socketConnected: boolean;
  onRefreshOverview: () => void;
}

export const AdminMonitorPanel: React.FC<AdminMonitorPanelProps> = ({
  overview,
  liveLocations,
  socketConnected,
  onRefreshOverview
}) => {
  const [activeTab, setActiveTab] = useState<'FLEET_MAP' | 'STREAM' | 'DATABASE' | 'CODE_EXPORT'>('FLEET_MAP');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleResetBackend = async () => {
    setIsResetting(true);
    try {
      await geoTaskApi.resetBackend();
      onRefreshOverview();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-full overflow-hidden shadow-xl">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Backend & Socket.IO Monitor</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                  socketConnected
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                {socketConnected ? 'Socket.IO Online' : 'Connecting'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              In-Memory Node.js Engine (Port 3000 Container / Port 5000 Standalone)
            </p>
          </div>
        </div>

        <button
          onClick={handleResetBackend}
          disabled={isResetting}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
          title="Reset in-memory arrays to original seed state"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span>Reset Seed DB</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 px-3">
        <button
          onClick={() => setActiveTab('FLEET_MAP')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'FLEET_MAP'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          Live Fleet Map ({liveLocations.length})
        </button>

        <button
          onClick={() => setActiveTab('STREAM')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'STREAM'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Telemetry Stream ({liveLocations.length})
        </button>

        <button
          onClick={() => setActiveTab('DATABASE')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'DATABASE'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          In-Memory DB Inspector
        </button>

        <button
          onClick={() => setActiveTab('CODE_EXPORT')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'CODE_EXPORT'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Exported Standalone Files
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* TAB 0: LIVE FLEET MAP (LEAFLET) */}
        {activeTab === 'FLEET_MAP' && (
          <div className="h-[620px] flex flex-col">
            <AdminFleetMap
              sites={overview?.sites || [
                {
                  _id: 'SITE001',
                  name: 'HQ Operations - New Delhi',
                  latitude: 28.6139,
                  longitude: 77.2090,
                  radiusMeters: 100,
                  organizationId: 'ORG001'
                },
                {
                  _id: 'SITE002',
                  name: 'Central Logistics Warehouse - Mumbai',
                  latitude: 19.0760,
                  longitude: 72.8777,
                  radiusMeters: 150,
                  organizationId: 'ORG001'
                }
              ]}
              liveLocations={liveLocations}
            />
          </div>
        )}

        {/* TAB 1: LIVE STREAM */}
        {activeTab === 'STREAM' && (
          <div className="space-y-4">
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Real-Time Socket.IO Telemetry
              </span>
              <p className="text-xs text-slate-300 mt-1">
                The mobile app broadcasts <code className="text-indigo-300 bg-indigo-950/40 px-1 py-0.5 rounded">location:update</code> every 10 seconds or on GPS movement. The server re-broadcasts this as <code className="text-emerald-300 bg-emerald-950/40 px-1 py-0.5 rounded">employee:location</code> to all connected dispatch listeners.
              </p>
            </div>

            {liveLocations.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-950/30">
                <Radio className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
                <p className="text-xs text-slate-400 font-medium">
                  Waiting for active employee socket connection...
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Log in to the mobile prototype on the left to start live broadcasting.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {liveLocations.map((loc) => (
                  <div
                    key={loc.userId}
                    className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm">
                        {loc.userName ? loc.userName.charAt(0) : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">{loc.userName}</h4>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                            {loc.userId}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Lat: {Number(loc.latitude).toFixed(4)}, Lng: {Number(loc.longitude).toFixed(4)} • Speed:{' '}
                          {Math.round(loc.speed * 3.6)} km/h
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Live
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {new Date(Number(loc.timestamp) || Date.now()).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DATABASE INSPECTOR */}
        {activeTab === 'DATABASE' && (
          <div className="space-y-6">
            {/* Overview Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  Users
                </div>
                <span className="text-xl font-bold text-white">{overview?.users.length || 2}</span>
              </div>
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Sites
                </div>
                <span className="text-xl font-bold text-white">{overview?.sites.length || 2}</span>
              </div>
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                  <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
                  Attendance
                </div>
                <span className="text-xl font-bold text-white">
                  {overview?.attendanceRecords.length || 0}
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                  <LifeBuoy className="w-3.5 h-3.5 text-rose-400" />
                  Tickets
                </div>
                <span className="text-xl font-bold text-white">
                  {overview?.supportTickets.length || 0}
                </span>
              </div>
            </div>

            {/* Attendance Records Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
                Attendance Log Sessions ({overview?.attendanceRecords.length || 0})
              </h4>
              {(!overview?.attendanceRecords || overview.attendanceRecords.length === 0) ? (
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                  No attendance records logged yet. Check-in on a task to create a record.
                </div>
              ) : (
                <div className="space-y-2">
                  {overview.attendanceRecords.map((rec) => (
                    <div
                      key={rec._id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{rec.userName}</span>
                          <span className="text-[10px] text-slate-400">({rec.employeeId})</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              rec.signOutTime
                                ? 'bg-slate-800 text-slate-300'
                                : 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {rec.signOutTime ? 'Completed' : 'Active Session'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Site: {rec.siteName} • In: {new Date(rec.signInTime).toLocaleTimeString()}
                          {rec.signOutTime && ` • Out: ${new Date(rec.signOutTime).toLocaleTimeString()}`}
                        </p>
                      </div>

                      {rec.photo && (
                        <div className="flex items-center gap-2">
                          <img
                            src={rec.photo}
                            alt="Selfie"
                            className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Support Tickets */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <LifeBuoy className="w-3.5 h-3.5 text-rose-400" />
                Support Tickets ({overview?.supportTickets.length || 0})
              </h4>
              {(!overview?.supportTickets || overview.supportTickets.length === 0) ? (
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                  No support tickets raised yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {overview.supportTickets.map((ticket) => (
                    <div
                      key={ticket._id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-200">{ticket.userName}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(ticket.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{ticket.message}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">
                        Location: {ticket.latitude.toFixed(4)}, {ticket.longitude.toFixed(4)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CODE EXPORT */}
        {activeTab === 'CODE_EXPORT' && (
          <div className="space-y-4">
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">
                Self-Contained Deliverable
              </span>
              <p className="text-xs text-slate-300 mt-1">
                Both parts are fully generated inside this workspace as standalone directories. You can clone or run them locally:
              </p>
            </div>

            {/* Backend Guide */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  PART 1 — Standalone Backend (backend/server.js)
                </h4>
                <button
                  onClick={() =>
                    handleCopy('cd backend && npm install && npm start', 'backend_cmd')
                  }
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                >
                  {copiedSection === 'backend_cmd' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSection === 'backend_cmd' ? 'Copied' : 'Copy Command'}
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-slate-900 text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-800">
{`# Run standalone backend on port 5000:
cd backend
npm install
npm start`}
              </pre>
            </div>

            {/* Expo App Guide */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  PART 2 — React Native Expo App (expo-app/)
                </h4>
                <button
                  onClick={() =>
                    handleCopy('cd expo-app && npm install && npx expo start', 'expo_cmd')
                  }
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                >
                  {copiedSection === 'expo_cmd' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSection === 'expo_cmd' ? 'Copied' : 'Copy Command'}
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-slate-900 text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-800">
{`# Run React Native Expo app on physical device or simulator:
cd expo-app
npm install
npx expo start`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
