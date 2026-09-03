import React, { useState, useEffect } from 'react';
import {
  Radio,
  MapPin,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { geoTaskApi, getGeoTaskSocket } from '../services/geoTaskApi';
import { AdminFleetMap } from './AdminFleetMap';
import { LiveShareLink, Organization, Site, GeoTaskLiveLocation, GeoTaskItem } from '../types/geoTask';

interface PublicTrackingViewProps {
  initialToken?: string;
  onBackToApp?: () => void;
}

export const PublicTrackingView: React.FC<PublicTrackingViewProps> = ({
  initialToken = 'DEMO-TRACK-2026',
  onBackToApp
}) => {
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [currentToken, setCurrentToken] = useState(initialToken);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trackingData, setTrackingData] = useState<{
    link: LiveShareLink;
    organization: Organization;
    sites: Site[];
    liveLocations: GeoTaskLiveLocation[];
    activeTasks: GeoTaskItem[];
  } | null>(null);

  const loadTracking = async (tokenToFetch: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await geoTaskApi.getPublicTracking(tokenToFetch.trim());
      setTrackingData(data);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired share token');
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentToken) {
      loadTracking(currentToken);
    }

    // Connect socket for real-time live movements
    const socket = getGeoTaskSocket();
    const handleLocation = (loc: GeoTaskLiveLocation) => {
      setTrackingData((prev) => {
        if (!prev || loc.organizationId !== prev.organization._id) return prev;
        const locations = [...prev.liveLocations];
        const idx = locations.findIndex((l) => l.userId === loc.userId);
        if (idx >= 0) {
          locations[idx] = loc;
        } else {
          locations.push(loc);
        }
        return { ...prev, liveLocations: locations };
      });
    };

    socket.on('employee:location', handleLocation);
    return () => {
      socket.off('employee:location', handleLocation);
    };
  }, [currentToken]);

  return (
    <div className="min-h-full bg-slate-950 text-slate-100 flex flex-col font-sans p-4 sm:p-6 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Public Live Tracking Gateway
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono">
                GET /track/:token
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Authorized real-time viewer for clients, partners, and external stakeholders.
            </p>
          </div>
        </div>

        {/* Token Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Enter share token..."
              className="bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
          <button
            onClick={() => setCurrentToken(tokenInput)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-colors cursor-pointer"
          >
            Load
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => {
              setTokenInput('DEMO-TRACK-2026');
              setCurrentToken('DEMO-TRACK-2026');
            }}
            className="px-3 py-1 bg-rose-900/60 hover:bg-rose-800 text-white rounded-lg font-semibold cursor-pointer"
          >
            Try Demo Token
          </button>
        </div>
      )}

      {trackingData && (
        <div className="space-y-6">
          {/* Org & Link Metadata Card */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Organization</span>
              <p className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>{trackingData.organization.name}</span>
              </p>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-medium">Tracking Mission</span>
              <p className="text-sm font-bold text-emerald-400 mt-0.5">
                {trackingData.link.name}
              </p>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-medium">Token Expiration</span>
              <p className="text-sm font-mono text-slate-300 mt-0.5">
                {new Date(trackingData.link.expiresAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Live Fleet Map */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h3 className="text-sm font-bold text-white">Live Field Position Broadcast</h3>
              </div>
              <span className="text-xs text-slate-400">
                Active Workers: <strong className="text-emerald-400">{trackingData.liveLocations.length}</strong>
              </span>
            </div>

            <div className="h-[480px] rounded-xl overflow-hidden border border-slate-800">
              <AdminFleetMap
                sites={trackingData.sites}
                liveLocations={trackingData.liveLocations}
                users={[]}
              />
            </div>
          </div>

          {/* Active Tasks in Progress */}
          {trackingData.activeTasks.length > 0 && (
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Active Tasks in Progress ({trackingData.activeTasks.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {trackingData.activeTasks.map((t) => (
                  <div key={t._id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">{t.site?.name}</span>
                    <h4 className="font-bold text-white mt-1">{t.title}</h4>
                    <p className="text-slate-400 mt-0.5">{t.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
