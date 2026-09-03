import React, { useState } from 'react';
import {
  ShieldCheck,
  MapPin,
  Camera,
  Radio,
  Terminal,
  Smartphone,
  Server,
  Layers,
  CheckCircle2,
  ArrowRight,
  Activity,
  Clock,
  Compass,
  Users,
  FileCheck2,
  LifeBuoy,
  AlertTriangle,
  Copy,
  Check,
  Zap,
  Play,
  RotateCcw,
  Lock,
  ChevronRight,
  Award
} from 'lucide-react';
import { calculateHaversineDistanceMeters, formatDistance } from '../utils/haversine';

interface LandingPageProps {
  onLaunchSimulator: (view?: 'SPLIT' | 'MOBILE_ONLY' | 'ADMIN_ONLY' | 'ADMIN_PORTAL' | 'SUPERADMIN' | 'SIGNUP' | 'PUBLIC_TRACK') => void;
  socketConnected: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchSimulator,
  socketConnected
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Interactive Geofence Teaser state on the landing page
  const hqSite = {
    name: 'HQ Operations - New Delhi',
    latitude: 28.6139,
    longitude: 77.2090,
    radiusMeters: 100
  };

  const [simDistanceMeters, setSimDistanceMeters] = useState<number>(24);
  const isInsidePreview = simDistanceMeters <= hqSite.radiusMeters;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="w-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 overflow-hidden">
        {/* Subtle grid backdrop */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, #6366f1 1px, transparent 1px), radial-gradient(circle, #6366f1 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            backgroundPosition: '0 0, 16px 16px'
          }}
        />

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[280px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Top Pill Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Geo-Task v1.0 Production Architecture
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              {socketConnected ? 'Socket.IO Server Connected' : 'In-Memory Engine Ready'}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold">
              Zero External DB Required
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Enterprise Field Workforce Attendance & Geofenced Tasks
            </h1>
            <p className="text-base sm:text-lg text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed">
              Real-time location telemetry with <strong className="text-white font-semibold">Socket.IO</strong>, zero-spoof <strong className="text-white font-semibold">Haversine geofence validation</strong>, biometric selfie verification, and self-contained in-memory dispatch.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onLaunchSimulator('SPLIT')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Live Simulator</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => onLaunchSimulator('MOBILE_ONLY')}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <span>Mobile App (Employee)</span>
            </button>

            <button
              onClick={() => onLaunchSimulator('ADMIN_PORTAL')}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Admin Console</span>
            </button>

            <button
              onClick={() => onLaunchSimulator('SUPERADMIN')}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Super Admin</span>
            </button>
          </div>

          {/* Quick Access Badges for Other Endpoints */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <button
              onClick={() => onLaunchSimulator('SIGNUP')}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Self-Service Org Registration (POST /api/signup)</span>
            </button>

            <button
              onClick={() => onLaunchSimulator('PUBLIC_TRACK')}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Client Live Tracking (GET /track/:token)</span>
            </button>
          </div>

          {/* Four Key Quantitative Metrics */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="block text-2xl sm:text-3xl font-black text-indigo-400">100m - 150m</span>
              <span className="text-xs font-semibold text-slate-300 mt-1 block">Calibrated Geofence</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Strict Haversine radius enforcement</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="block text-2xl sm:text-3xl font-black text-emerald-400">10 sec</span>
              <span className="text-xs font-semibold text-slate-300 mt-1 block">Telemetry Heartbeat</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Continuous background Socket.IO stream</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="block text-2xl sm:text-3xl font-black text-violet-400">0 ms</span>
              <span className="text-xs font-semibold text-slate-300 mt-1 block">External DB Latency</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">In-memory mock store, zero cloud lock-in</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="block text-2xl sm:text-3xl font-black text-amber-400">Dual Part</span>
              <span className="text-xs font-semibold text-slate-300 mt-1 block">Complete Architecture</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">React Native (Expo) + Node.js Express</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE GEOFENCE RADAR SIMULATOR (TRY IT HERE) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-950 border-b border-slate-800/80">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 flex items-center justify-center gap-1.5 mb-2">
              <Compass className="w-4 h-4" /> Live Mathematical Engine
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Test Haversine Geofence Calculation Instantly
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto mt-2">
              The application uses spherical trigonometry (Haversine formula) to compare worker coordinates with site boundaries. Slide or select a preset to evaluate the live rule engine:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            {/* SVG Visualizer Canvas */}
            <div className="md:col-span-6 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-[320px] aspect-square rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
                {/* Radar sweep circle */}
                <svg viewBox="0 0 300 300" className="w-full h-full">
                  <defs>
                    <radialGradient id="landingGeofenceGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                      <stop offset="70%" stopColor="#6366f1" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
                    </radialGradient>
                  </defs>

                  {/* Concentric rings */}
                  <circle cx="150" cy="150" r="40" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2 3" />
                  <circle cx="150" cy="150" r="80" fill="url(#landingGeofenceGlow)" stroke="#6366f1" strokeWidth="2" strokeDasharray="5 3" />
                  <circle cx="150" cy="150" r="120" fill="none" stroke="#1e293b" strokeWidth="1" />

                  {/* Site Center (HQ Office) */}
                  <g transform="translate(150, 150)">
                    <circle r="10" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
                    <circle r="4" fill="#c7d2fe" />
                    <text x="0" y="20" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">
                      HQ (100m Radius)
                    </text>
                  </g>

                  {/* Dynamic User Marker */}
                  {/* Map distance to radius: 100m = 80px */}
                  {(() => {
                    const radiusPx = (simDistanceMeters / 100) * 80;
                    const angleRad = (45 * Math.PI) / 180;
                    const userPxX = 150 + radiusPx * Math.cos(angleRad);
                    const userPxY = 150 - radiusPx * Math.sin(angleRad);
                    const clampedX = Math.max(20, Math.min(280, userPxX));
                    const clampedY = Math.max(20, Math.min(280, userPxY));

                    return (
                      <g transform={`translate(${clampedX}, ${clampedY})`} className="transition-all duration-300">
                        <circle
                          r="14"
                          fill={isInsidePreview ? '#22c55e' : '#ef4444'}
                          opacity="0.3"
                          className="animate-ping"
                        />
                        <circle
                          r="8"
                          fill={isInsidePreview ? '#16a34a' : '#dc2626'}
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        <text
                          x="0"
                          y="-12"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="bold"
                        >
                          {isInsidePreview ? 'ALLOWED' : 'BLOCKED'}
                        </text>
                      </g>
                    );
                  })()}
                </svg>

                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 font-mono">
                  Site: Delhi HQ
                </div>
              </div>
            </div>

            {/* Interactive Controls & Rule Verification */}
            <div className="md:col-span-6 space-y-4">
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isInsidePreview
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isInsidePreview ? (
                    <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wide">
                      {isInsidePreview ? 'Geofence Verified: Action Permitted' : 'Geofence Breach: Action Blocked'}
                    </h4>
                    <p className="text-xs mt-0.5 opacity-90 leading-snug">
                      {isInsidePreview
                        ? `Worker is ${simDistanceMeters}m from center. Inside the 100m perimeter. Selfie check-in and task completion are ENABLED.`
                        : `Worker is ${simDistanceMeters}m from center (${simDistanceMeters - 100}m outside perimeter). Attendance & task transitions are BLOCKED.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Slider for Distance */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-slate-400">Simulate Distance from Site Center:</span>
                  <span className="font-mono font-bold text-white text-sm">{simDistanceMeters} meters</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="350"
                  step="5"
                  value={simDistanceMeters}
                  onChange={(e) => setSimDistanceMeters(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0m (Center)</span>
                  <span className="text-indigo-400 font-bold">100m (Perimeter Threshold)</span>
                  <span>350m (Off-Site)</span>
                </div>
              </div>

              {/* Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400">Quick Test Scenarios:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSimDistanceMeters(18)}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-semibold text-center transition-colors"
                  >
                    Inside (~18m)
                  </button>
                  <button
                    onClick={() => setSimDistanceMeters(96)}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-semibold text-center transition-colors"
                  >
                    Border (~96m)
                  </button>
                  <button
                    onClick={() => setSimDistanceMeters(320)}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-semibold text-center transition-colors"
                  >
                    Outside (~320m)
                  </button>
                </div>
              </div>

              {/* Action Button to launch simulator */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => onLaunchSimulator('SPLIT')}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Open Interactive Mobile Simulator to Test Live</span>
                </button>
                <p className="text-[11px] text-center text-slate-400">
                  🗺️ Supports interactive <strong className="text-slate-200">OpenStreetMap / CARTO Street Tiles</strong> &amp; <strong className="text-slate-200">Satellite Imagery</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SIX CORE CAPABILITIES */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 mb-2 block">
              Engineered for Real-World Field Operations
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              End-to-End Mobile & Dispatch Architecture
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto mt-2">
              Every component is designed to run locally, handle weak GPS signals, and prevent spoofing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Haversine Geofencing */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  Haversine Geofencing
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Spherical great-circle trigonometry calculates exact distance to site coordinates. Jitter under 3 meters is automatically filtered to conserve mobile battery.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-indigo-300 font-semibold">
                <span>Tolerance: &plusmn;5 meters</span>
                <span>Configurable Radii</span>
              </div>
            </div>

            {/* Card 2: Biometric Selfie Verification */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  Photo & Selfie Verification
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Mandatory front-camera photo capture during shift check-in and checkout. Prevents buddy punching with timestamped visual audit logs stored as clean base64 data.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-300 font-semibold">
                <span>In-Camera Live Feed</span>
                <span>Audit Trail Records</span>
              </div>
            </div>

            {/* Card 3: Real-Time Socket.IO Telemetry */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-4">
                  <Radio className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  Live Socket.IO Stream
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Mobile client transmits <code className="text-violet-300 bg-violet-950/40 px-1 py-0.5 rounded text-[10px]">location:update</code> beacons every 10 seconds. The server re-broadcasts them immediately to all connected dispatch consoles.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-violet-300 font-semibold">
                <span>10s Heartbeat Beacon</span>
                <span>Live Dispatch Relay</span>
              </div>
            </div>

            {/* Card 4: Shift Task Lifecycle Machine */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  Task State Automation
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Field tasks automatically progress from <span className="text-slate-300 font-bold">pending</span> to <span className="text-amber-400 font-bold">in-progress</span> upon check-in and lock to <span className="text-emerald-400 font-bold">completed</span> upon verified check-out.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-amber-300 font-semibold">
                <span>Site Synchronization</span>
                <span>Geofence Gated</span>
              </div>
            </div>

            {/* Card 5: Field Incident & Emergency Dispatch */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
                  <LifeBuoy className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  Incident Support Tickets
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Workers can file field hazard reports, equipment failures, or emergency tickets in one tap. Each ticket is automatically stamped with precision GPS coordinates.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-rose-300 font-semibold">
                <span>Instant HQ Notification</span>
                <span>Lat/Lng Stamped</span>
              </div>
            </div>

            {/* Card 6: Standalone In-Memory Engine */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-4">
                  <Server className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  Zero External DB Required
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Completely self-contained in-memory arrays. Exportable into standalone directories (<code className="text-sky-300 text-[10px]">backend/</code> and <code className="text-sky-300 text-[10px]">expo-app/</code>) to run on localhost or physical devices.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-sky-300 font-semibold">
                <span>Instant Cold Start</span>
                <span>Ready to Clone</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRE-SEEDED DEMO EMPLOYEES QUICK ACCESS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-slate-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 mb-1 block">
              Instant Testing Credentials
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Pre-Seeded Field Personnel
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select either employee to launch the mobile simulator pre-configured with their credentials:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Employee 1 */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    EMP001
                  </span>
                  <span className="text-xs font-mono text-slate-400">OTP: 1111</span>
                </div>
                <h3 className="text-base font-bold text-white">Ravi Kumar</h3>
                <p className="text-xs text-slate-400 mt-0.5">Senior Field Engineer</p>

                <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                  <div className="text-slate-300">
                    <strong>Site:</strong> HQ Office (New Delhi)
                  </div>
                  <div className="text-slate-400 font-mono text-[10px]">
                    Mobile: +91 9990001111 • Perimeter: 100m
                  </div>
                </div>
              </div>

              <button
                onClick={() => onLaunchSimulator('SPLIT')}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Launch Simulator with Ravi</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Employee 2 */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    EMP002
                  </span>
                  <span className="text-xs font-mono text-slate-400">OTP: 1111</span>
                </div>
                <h3 className="text-base font-bold text-white">Priya Shah</h3>
                <p className="text-xs text-slate-400 mt-0.5">Logistics Coordinator</p>

                <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                  <div className="text-slate-300">
                    <strong>Site:</strong> Central Logistics Warehouse (Mumbai)
                  </div>
                  <div className="text-slate-400 font-mono text-[10px]">
                    Mobile: +91 9990002222 • Perimeter: 150m
                  </div>
                </div>
              </div>

              <button
                onClick={() => onLaunchSimulator('SPLIT')}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Launch Simulator with Priya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CODE EXPORT & REPOSITORY BLUEPRINT */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 mb-1 block">
              Standalone Deliverables
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Export to Your Local Workstation
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
              All backend and React Native Expo files are cleanly generated inside this repository:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Backend Directory */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white">PART 1: Express + Socket.IO Backend</h3>
                </div>
                <button
                  onClick={() => handleCopy('cd backend && npm install && npm start', 'cmd1')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  {copiedSection === 'cmd1' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedSection === 'cmd1' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800 overflow-x-auto">
{`cd backend
npm install
npm start
# Runs Express on port 5000 with Socket.IO`}
              </pre>
              <ul className="text-[11px] text-slate-400 space-y-1">
                <li>• <strong className="text-slate-300">backend/server.js:</strong> Complete REST routes + Socket handlers</li>
                <li>• <strong className="text-slate-300">backend/package.json:</strong> Standalone dependencies</li>
              </ul>
            </div>

            {/* Expo App Directory */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-white">PART 2: React Native (Expo) Client</h3>
                </div>
                <button
                  onClick={() => handleCopy('cd expo-app && npm install && npx expo start', 'cmd2')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  {copiedSection === 'cmd2' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedSection === 'cmd2' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800 overflow-x-auto">
{`cd expo-app
npm install
npx expo start
# Scan QR code with Expo Go app`}
              </pre>
              <ul className="text-[11px] text-slate-400 space-y-1">
                <li>• <strong className="text-slate-300">expo-app/App.js:</strong> Complete cross-platform React Native screen</li>
                <li>• <strong className="text-slate-300">expo-app/config.js:</strong> Configurable backend IP endpoint</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION FOOTER */}
      <footer className="py-14 px-4 sm:px-6 lg:px-8 bg-slate-950 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-600/30 text-white">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Ready to test the Geo-Task system?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Experience the full live mobile app simulator with selfie camera verification, GPS teleportation testing, and real-time Socket.IO dispatch stream.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onLaunchSimulator('SPLIT')}
              className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Interactive Simulator Now</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 pt-6">
            Geo-Task Prototype • Built with React Native (Expo) & Express + Socket.IO • Port 3000
          </p>
        </div>
      </footer>
    </div>
  );
};
