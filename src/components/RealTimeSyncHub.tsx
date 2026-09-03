import React, { useState } from 'react';
import { Database, Smartphone, Monitor, CheckCircle2, Clock, Wifi, WifiOff, RefreshCw, Layers, ShieldCheck, AlertCircle } from 'lucide-react';
import { AttendanceRecord, BackendSyncStats, SyncQueueItem } from '../types';

interface RealTimeSyncHubProps {
  logs: AttendanceRecord[];
  syncStats: BackendSyncStats;
  isOnline: boolean;
  onToggleOnline: () => void;
  syncQueue: SyncQueueItem[];
  onTriggerManualSync: () => void;
}

export const RealTimeSyncHub: React.FC<RealTimeSyncHubProps> = ({
  logs,
  syncStats,
  isOnline,
  onToggleOnline,
  syncQueue,
  onTriggerManualSync
}) => {
  const [filterPlatform, setFilterPlatform] = useState<'ALL' | 'android' | 'web'>('ALL');

  const filteredLogs = logs.filter((log) => {
    if (filterPlatform === 'ALL') return true;
    return log.platform === filterPlatform;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Top Banner: Real-time Multi-Device Sync Pipeline */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-100 tracking-wide uppercase">
              MongoDB Multi-Platform Live Sync
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Bi-directional synchronization between React Web instances and Android APK containers
          </p>
        </div>

        {/* Online / Offline Network Toggle */}
        <div className="flex items-center gap-2">
          <button
            id="toggle-offline-simulation-btn"
            onClick={onToggleOnline}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simulate Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>Offline Mode (Queue Active)</span>
              </>
            )}
          </button>

          {syncQueue.length > 0 && (
            <button
              id="manual-sync-queue-btn"
              onClick={onTriggerManualSync}
              disabled={!isOnline}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 disabled:opacity-50 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Queue ({syncQueue.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>Cluster Status</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <p className="font-bold text-slate-200">MongoDB Atlas</p>
          <p className="text-[10px] text-emerald-400 font-mono mt-0.5">Replica Set 6.0</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>Android Clients</span>
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="font-bold text-slate-200">2 Devices</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Capacitor v6.2 Container</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>Web Portals</span>
            <Monitor className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <p className="font-bold text-slate-200">1 Live Session</p>
          <p className="text-[10px] text-slate-400 mt-0.5">React 19 + Vite SPA</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>Offline Sync Queue</span>
            <Layers className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="font-bold text-slate-200">{syncQueue.length} Pending</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Capacitor Preferences</p>
        </div>
      </div>

      {/* Attendance Logs Table */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
            Real-Time Attendance Audit Stream ({filteredLogs.length})
          </h3>

          {/* Filter tabs */}
          <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
            <button
              id="filter-all-logs-btn"
              onClick={() => setFilterPlatform('ALL')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filterPlatform === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Channels
            </button>
            <button
              id="filter-android-logs-btn"
              onClick={() => setFilterPlatform('android')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                filterPlatform === 'android' ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              Android Mobile
            </button>
            <button
              id="filter-web-logs-btn"
              onClick={() => setFilterPlatform('web')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                filterPlatform === 'web' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3 h-3" />
              Web Browser
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Action & Time</th>
                <th className="py-2.5 px-3">Geofence Location</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Origin Device</th>
                <th className="py-2.5 px-3">Mongo Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={log.userAvatar}
                        alt={log.userName}
                        className="w-7 h-7 rounded-lg object-cover border border-slate-700"
                      />
                      <div>
                        <p className="font-semibold text-slate-100">{log.userName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{log.employeeCode}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.type === 'CHECK_IN'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      {log.type}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{log.timestamp}</p>
                  </td>

                  <td className="py-2.5 px-3">
                    <p className="font-medium text-slate-200 truncate max-w-[180px]">{log.zoneName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)} (±{log.accuracy}m)
                    </p>
                  </td>

                  <td className="py-2.5 px-3">
                    {log.status === 'VERIFIED' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Out of Bounds
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      {log.platform === 'android' ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
                          <Smartphone className="w-3.5 h-3.5" />
                          Android
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-indigo-400 text-[11px] font-medium">
                          <Monitor className="w-3.5 h-3.5" />
                          Web
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{log.deviceModel}</p>
                  </td>

                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium">
                      <ShieldCheck className="w-3 h-3" />
                      Synced
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
