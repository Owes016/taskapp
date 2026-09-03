import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Server,
  Radio,
  Sparkles,
  Database,
  Activity,
  Layers,
  Code2,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Home,
  Play,
  Building2,
  Users,
  ShieldAlert,
  Share2,
  Download
} from 'lucide-react';
import { MobileDeviceFrame } from './components/MobileDeviceFrame';
import { GeoTaskMobileApp } from './components/GeoTaskMobileApp';
import { AdminMonitorPanel } from './components/AdminMonitorPanel';
import { LandingPage } from './components/LandingPage';
import { AdminPortal } from './components/AdminPortal';
import { SuperAdminPortal } from './components/SuperAdminPortal';
import { OrgSignupModal } from './components/OrgSignupModal';
import { PublicTrackingView } from './components/PublicTrackingView';
import { MobileAppDownloadModal } from './components/MobileAppDownloadModal';
import { BackendOverview, GeoTaskLiveLocation } from './types/geoTask';
import { geoTaskApi, getGeoTaskSocket } from './services/geoTaskApi';

type LayoutView =
  | 'LANDING'
  | 'SPLIT'
  | 'MOBILE_ONLY'
  | 'ADMIN_ONLY'
  | 'ADMIN_PORTAL'
  | 'SUPERADMIN'
  | 'PUBLIC_TRACK';

export default function App() {
  const [activeLayoutView, setActiveLayoutView] = useState<LayoutView>('LANDING');
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [publicTrackToken, setPublicTrackToken] = useState('DEMO-TRACK-2026');

  const [overview, setOverview] = useState<BackendOverview | null>(null);
  const [liveLocations, setLiveLocations] = useState<GeoTaskLiveLocation[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  // Hash-based route initialization & listener
  const parseRoute = () => {
    const hash = window.location.hash.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();

    if (hash.includes('apk') || hash.includes('download')) {
      setDownloadModalOpen(true);
    }

    if (hash.includes('superadmin') || pathname.includes('/superadmin')) {
      setActiveLayoutView('SUPERADMIN');
    } else if (hash.includes('admin') || pathname.includes('/admin')) {
      setActiveLayoutView('ADMIN_PORTAL');
    } else if (hash.includes('track') || pathname.includes('/track')) {
      // Extract token if present
      const tokenMatch = hash.match(/track\/([a-zA-Z0-9_-]+)/) || pathname.match(/\/track\/([a-zA-Z0-9_-]+)/);
      if (tokenMatch && tokenMatch[1]) {
        setPublicTrackToken(tokenMatch[1]);
      }
      setActiveLayoutView('PUBLIC_TRACK');
    } else if (hash.includes('mobile') || hash.includes('login') || hash.includes('dashboard') || pathname.includes('/login') || pathname.includes('/dashboard')) {
      setActiveLayoutView('MOBILE_ONLY');
    } else if (hash.includes('dual') || hash.includes('simulator')) {
      setActiveLayoutView('SPLIT');
    } else if (hash.includes('signup') || pathname.includes('/signup')) {
      setSignupModalOpen(true);
    }
  };

  const navigateTo = (view: LayoutView, token?: string) => {
    setActiveLayoutView(view);
    if (token) setPublicTrackToken(token);

    // Sync hash
    switch (view) {
      case 'LANDING':
        window.location.hash = '';
        break;
      case 'MOBILE_ONLY':
        window.location.hash = '#/mobile';
        break;
      case 'SPLIT':
        window.location.hash = '#/simulator';
        break;
      case 'ADMIN_ONLY':
        window.location.hash = '#/events';
        break;
      case 'ADMIN_PORTAL':
        window.location.hash = '#/admin';
        break;
      case 'SUPERADMIN':
        window.location.hash = '#/superadmin';
        break;
      case 'PUBLIC_TRACK':
        window.location.hash = `#/track/${token || publicTrackToken}`;
        break;
    }
  };

  // Load backend overview and setup Socket.IO admin listener
  const refreshBackendOverview = async () => {
    try {
      const data = await geoTaskApi.getAdminOverview();
      setOverview(data);
      if (data.liveLocations) {
        setLiveLocations(data.liveLocations);
      }
    } catch (err) {
      console.warn('Failed to fetch backend overview:', err);
    }
  };

  useEffect(() => {
    parseRoute();
    window.addEventListener('hashchange', parseRoute);
    refreshBackendOverview();

    // Setup Socket.IO listener for live employee broadcasts
    const socket = getGeoTaskSocket();

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    const onEmployeeLocation = (data: GeoTaskLiveLocation) => {
      setLiveLocations((prev) => {
        const index = prev.findIndex((item) => item.userId === data.userId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = data;
          return updated;
        }
        return [data, ...prev];
      });
      setLastEvent(`📍 Location received for ${data.userName} (${Number(data.latitude).toFixed(3)}, ${Number(data.longitude).toFixed(3)})`);
    };

    const onEmployeeOffline = ({ userId }: { userId: string }) => {
      setLiveLocations((prev) => prev.filter((item) => item.userId !== userId));
      setLastEvent(`🛑 Employee ${userId} went offline`);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('employee:location', onEmployeeLocation);
    socket.on('employee:offline', onEmployeeOffline);

    if (socket.connected) {
      setSocketConnected(true);
    }

    const interval = setInterval(refreshBackendOverview, 8000);

    return () => {
      window.removeEventListener('hashchange', parseRoute);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('employee:location', onEmployeeLocation);
      socket.off('employee:offline', onEmployeeOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Brand & Status */}
          <div
            onClick={() => navigateTo('LANDING')}
            className="flex items-center gap-3 cursor-pointer group"
            title="Return to Product Landing Page"
          >
            <div className="p-2 rounded-2xl bg-indigo-600 shadow-md shadow-indigo-600/30 text-white group-hover:bg-indigo-500 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                  Geo-Task System
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                  Full Stack
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Attendance, Geofenced Tasks, Self-Service Tenancy, Live Telemetry
              </p>
            </div>
          </div>

          {/* Navigation Role Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Real-time Socket Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] mr-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-300 font-medium hidden sm:inline">
                {socketConnected ? 'Live IO' : 'Offline'}
              </span>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-wrap bg-slate-950 p-1 rounded-xl border border-slate-800 gap-0.5">
              <button
                onClick={() => navigateTo('LANDING')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeLayoutView === 'LANDING'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Product Landing Page"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Tour</span>
              </button>

              <button
                onClick={() => navigateTo('MOBILE_ONLY')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeLayoutView === 'MOBILE_ONLY'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Employee Mobile App (/login & /dashboard)"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Employee</span>
              </button>

              <button
                onClick={() => navigateTo('ADMIN_PORTAL')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeLayoutView === 'ADMIN_PORTAL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Org Admin Console (/admin)"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>

              <button
                onClick={() => navigateTo('SUPERADMIN')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeLayoutView === 'SUPERADMIN'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Super Admin Master Control (/superadmin)"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Super Admin</span>
              </button>

              <button
                onClick={() => navigateTo('PUBLIC_TRACK')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeLayoutView === 'PUBLIC_TRACK'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Public Live Tracking Link (/track/:token)"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Public Track</span>
              </button>

              <button
                onClick={() => navigateTo('SPLIT')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeLayoutView === 'SPLIT'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Side-by-side Mobile & Backend Telemetry"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Dual Sim</span>
              </button>
            </div>

            {/* Download APK Action Button */}
            <button
              onClick={() => setDownloadModalOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-950/40 border border-emerald-500/30 transition-all cursor-pointer ml-1 active:scale-95"
              title="Download Android APK / Mobile App"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download APK</span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] bg-emerald-950/80 text-emerald-200 font-mono">
                v1.0
              </span>
            </button>

            {/* Quick Self-service Org Signup Button */}
            <button
              onClick={() => setSignupModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition-colors cursor-pointer ml-1"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Signup Org</span>
            </button>
          </div>
        </div>
      </header>

      {/* Real-time Ticker */}
      {lastEvent && (
        <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-1 text-center text-[11px] text-slate-400 font-mono flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
          <span>{lastEvent}</span>
        </div>
      )}

      {/* VIEW ROUTING */}
      {activeLayoutView === 'LANDING' && (
        <LandingPage
          onLaunchSimulator={(view) => {
            if (view === 'SIGNUP') {
              setSignupModalOpen(true);
            } else if (view) {
              navigateTo(view as LayoutView);
            } else {
              navigateTo('SPLIT');
            }
          }}
          socketConnected={socketConnected}
          onOpenDownloadModal={() => setDownloadModalOpen(true)}
        />
      )}

      {/* ADMIN PORTAL (/admin) */}
      {activeLayoutView === 'ADMIN_PORTAL' && (
        <div className="flex-1 flex flex-col">
          <AdminPortal />
        </div>
      )}

      {/* SUPER ADMIN MASTER CONTROL (/superadmin) */}
      {activeLayoutView === 'SUPERADMIN' && (
        <div className="flex-1 flex flex-col">
          <SuperAdminPortal />
        </div>
      )}

      {/* PUBLIC CLIENT TRACKING (/track/:token) */}
      {activeLayoutView === 'PUBLIC_TRACK' && (
        <div className="flex-1 flex flex-col">
          <PublicTrackingView
            initialToken={publicTrackToken}
            onBackToApp={() => navigateTo('LANDING')}
          />
        </div>
      )}

      {/* MOBILE ONLY OR SPLIT SIMULATOR */}
      {(activeLayoutView === 'MOBILE_ONLY' || activeLayoutView === 'SPLIT' || activeLayoutView === 'ADMIN_ONLY') && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => navigateTo('LANDING')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>&larr; Back to Product Overview</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
                Active View: <strong className="text-white">{activeLayoutView}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: React Native Expo Mobile App Prototype */}
            {(activeLayoutView === 'SPLIT' || activeLayoutView === 'MOBILE_ONLY') && (
              <div
                className={`${
                  activeLayoutView === 'SPLIT' ? 'lg:col-span-5' : 'lg:col-span-12'
                } flex flex-col items-center`}
              >
                <div className="w-full mb-3 flex items-center justify-between max-w-[390px]">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      PART 2 — React Native (Expo)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Expo Go Simulator
                  </span>
                </div>

                {/* Mobile Chassis Device Frame */}
                <MobileDeviceFrame>
                  <GeoTaskMobileApp
                    onSessionChange={refreshBackendOverview}
                    onLocationBroadcast={(loc) => {
                      setLastEvent(`📍 Broadcasted ${loc.userName} (${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)})`);
                    }}
                  />
                </MobileDeviceFrame>
              </div>
            )}

            {/* RIGHT: Backend Telemetry, In-Memory Database & API Inspector */}
            {(activeLayoutView === 'SPLIT' || activeLayoutView === 'ADMIN_ONLY') && (
              <div
                className={`${
                  activeLayoutView === 'SPLIT' ? 'lg:col-span-7' : 'lg:col-span-12'
                } h-[810px] flex flex-col`}
              >
                <div className="w-full mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      PART 1 — Node.js Express + Socket.IO Backend
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                    In-Memory Mock Store (Zero External DB)
                  </span>
                </div>

                <div className="flex-1 min-h-0">
                  <AdminMonitorPanel
                    overview={overview}
                    liveLocations={liveLocations}
                    socketConnected={socketConnected}
                    onRefreshOverview={refreshBackendOverview}
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* Org Signup Modal */}
      <OrgSignupModal
        isOpen={signupModalOpen}
        onClose={() => setSignupModalOpen(false)}
        onSuccess={(result) => {
          navigateTo('ADMIN_PORTAL');
        }}
      />

      {/* Mobile App & APK Download Modal */}
      <MobileAppDownloadModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
      />
    </div>
  );
}
