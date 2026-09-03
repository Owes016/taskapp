import React, { useState, useEffect, useRef } from 'react';
import {
  GeoTaskUser,
  GeoTaskItem,
  GeoTaskAttendanceRecord,
  Site,
  GeoTaskLiveLocation
} from '../types/geoTask';
import { geoTaskApi, getGeoTaskSocket } from '../services/geoTaskApi';
import { calculateHaversineDistanceMeters, formatDistance } from '../utils/haversine';
import { CameraSelfieModal } from './CameraSelfieModal';
import { InteractiveMapTab } from './InteractiveMapTab';
import {
  MapPin,
  Camera,
  CheckCircle2,
  Clock,
  LogOut,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Send,
  Navigation,
  Compass,
  Building2,
  Phone,
  KeyRound,
  Sparkles,
  LifeBuoy,
  Layers,
  Activity
} from 'lucide-react';

interface GeoTaskMobileAppProps {
  onLocationBroadcast?: (loc: GeoTaskLiveLocation) => void;
  onSessionChange?: () => void;
}

export const GeoTaskMobileApp: React.FC<GeoTaskMobileAppProps> = ({
  onLocationBroadcast,
  onSessionChange
}) => {
  // Auth State
  const [user, setUser] = useState<GeoTaskUser | null>(null);
  const [mobileNumber, setMobileNumber] = useState('9990001111');
  const [otpStep, setOtpStep] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // App Navigation: 'HOME' | 'MAP'
  const [activeTab, setActiveTab] = useState<'HOME' | 'MAP'>('HOME');

  // Location State
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distanceToSite, setDistanceToSite] = useState<number | null>(null);
  const [isInside, setIsInside] = useState<boolean>(false);
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [totalDistanceMeters, setTotalDistanceMeters] = useState<number>(0);
  const [isRefreshingGps, setIsRefreshingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isSimulatedGps, setIsSimulatedGps] = useState(true);

  // Tasks & Attendance State
  const [tasks, setTasks] = useState<GeoTaskItem[]>([]);
  const [activeSession, setActiveSession] = useState<GeoTaskAttendanceRecord | null>(null);
  const [activityRecords, setActivityRecords] = useState<GeoTaskAttendanceRecord[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Ticket State
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketFeedback, setTicketFeedback] = useState<string | null>(null);

  // Camera Selfie Modal
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<{
    type: 'check-in' | 'check-out';
    task: GeoTaskItem;
  } | null>(null);

  const lastCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const otpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // 1. Initial Session Check (LocalStorage)
  useEffect(() => {
    const saved = localStorage.getItem('@geo_task_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        // Refresh profile
        geoTaskApi.getUser(parsed._id).then((fresh) => {
          setUser(fresh);
          localStorage.setItem('@geo_task_user', JSON.stringify(fresh));
        }).catch(console.warn);
      } catch (e) {
        localStorage.removeItem('@geo_task_user');
      }
    }
  }, []);

  // 2. 30-Second Background Profile Refresher
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      geoTaskApi.getUser(user._id).then((fresh) => {
        setUser(fresh);
        localStorage.setItem('@geo_task_user', JSON.stringify(fresh));
      }).catch(console.warn);
    }, 30000);
    return () => clearInterval(interval);
  }, [user?._id]);

  // 3. User Login Initialization (Socket & Data)
  useEffect(() => {
    if (!user) return;

    // Load initial tasks and active session
    loadUserData(user._id);

    // Initial position default: Set tester right at assigned site
    if (user.assignedSite) {
      updateUserPosition(user.assignedSite.latitude + 0.0001, user.assignedSite.longitude + 0.0001, 1.4);
    }

    // Connect Socket.IO
    const socket = getGeoTaskSocket();

    // 10-Second Heartbeat Broadcast
    const broadcastInterval = setInterval(() => {
      broadcastLocation(user, userCoords, speedKmh);
    }, 10000);

    return () => {
      clearInterval(broadcastInterval);
    };
  }, [user?._id]);

  const loadUserData = async (userId: string) => {
    setLoadingTasks(true);
    try {
      const [tasksData, statusData, activityData] = await Promise.all([
        geoTaskApi.getUserTasks(userId).catch(() => []),
        geoTaskApi.getAttendanceStatus(userId).catch(() => ({ activeSession: null })),
        geoTaskApi.getUserActivity(userId).catch(() => ({ attendance: [], tasks: [] }))
      ]);

      setTasks(tasksData);
      setActiveSession(statusData.activeSession);
      setActivityRecords(activityData.attendance || []);
      onSessionChange?.();
    } catch (err) {
      console.warn('Failed to load user data:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Location Calculation with Haversine
  const updateUserPosition = (lat: number, lng: number, speedMps = 0) => {
    const coords = { latitude: lat, longitude: lng };
    setUserCoords(coords);

    if (user && user.assignedSite) {
      const dist = calculateHaversineDistanceMeters(
        lat,
        lng,
        user.assignedSite.latitude,
        user.assignedSite.longitude
      );
      const roundedDist = Math.round(dist);
      setDistanceToSite(roundedDist);
      const inside = roundedDist <= user.assignedSite.radiusMeters;
      setIsInside(inside);

      // Track speed
      const speedKm = Math.round(speedMps * 3.6);
      setSpeedKmh(speedKm);

      // Total distance tracking (ignore jitter < 3m)
      if (lastCoordsRef.current) {
        const step = calculateHaversineDistanceMeters(
          lastCoordsRef.current.latitude,
          lastCoordsRef.current.longitude,
          lat,
          lng
        );
        if (step >= 3) {
          setTotalDistanceMeters((prev) => prev + step);
          lastCoordsRef.current = coords;
        }
      } else {
        lastCoordsRef.current = coords;
      }

      // Broadcast immediately on coordinate change
      broadcastLocation(user, coords, speedKm);
    }
  };

  const broadcastLocation = (
    currentUser: GeoTaskUser,
    coords: { latitude: number; longitude: number } | null,
    speed: number
  ) => {
    if (!currentUser || !coords) return;
    const socket = getGeoTaskSocket();
    const payload: GeoTaskLiveLocation = {
      userId: currentUser._id,
      userName: currentUser.name,
      latitude: coords.latitude,
      longitude: coords.longitude,
      speed: speed / 3.6,
      timestamp: Date.now(),
      organizationId: currentUser.organization?._id || 'org1'
    };

    if (socket.connected) {
      socket.emit('location:update', payload);
    }
    onLocationBroadcast?.(payload);
  };

  // Acquire Real GPS if user desires
  const handleAcquireRealGps = () => {
    setIsRefreshingGps(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      setIsRefreshingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsSimulatedGps(false);
        updateUserPosition(
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.speed || 0
        );
        setIsRefreshingGps(false);
      },
      (err) => {
        setGpsError('Could not acquire device GPS. Reverting to simulator coordinates.');
        setIsRefreshingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Teleport to assigned site
  const handleTeleportToSite = (inside: boolean) => {
    if (!user || !user.assignedSite) return;
    setIsSimulatedGps(true);
    const site = user.assignedSite;
    // Inside: 10m away; Outside: ~400m away
    const offset = inside ? 0.00009 : 0.0038;
    updateUserPosition(site.latitude + offset, site.longitude + offset, inside ? 1.5 : 4.2);
  };

  // Auth Handlers
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);
    if (!mobileNumber.trim()) {
      setAuthError('Please enter your 10-digit mobile number');
      return;
    }

    setAuthLoading(true);
    try {
      const data = await geoTaskApi.sendOtp(mobileNumber.trim());
      if (data.success) {
        setOtpStep(true);
        setOtpDigits(['', '', '', '']);
        setTimeout(() => otpInputRefs[0].current?.focus(), 150);
      } else {
        setAuthError(data.error || 'User not registered with this mobile number');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Cannot reach server');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOtpDigitChange = (index: number, val: string) => {
    const digit = val.slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = digit;
    setOtpDigits(nextDigits);

    // Auto-advance
    if (digit && index < 3) {
      otpInputRefs[index + 1].current?.focus();
    }

    // Auto-submit on 4th digit
    if (digit && index === 3) {
      const fullCode = nextDigits.join('');
      if (fullCode.length === 4) {
        handleVerifyOtp(fullCode);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    setAuthError(null);
    setAuthLoading(true);

    try {
      const data = await geoTaskApi.verifyOtp(mobileNumber.trim(), code);
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('@geo_task_user', JSON.stringify(data.user));
        setOtpStep(false);
      } else {
        setAuthError(data.error || 'Invalid OTP code');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Verification error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    if (user) {
      const socket = getGeoTaskSocket();
      if (socket.connected) {
        socket.emit('location:stop', {
          userId: user._id,
          organizationId: user.organization?._id
        });
      }
    }
    localStorage.removeItem('@geo_task_user');
    setUser(null);
    setActiveSession(null);
    setOtpStep(false);
    onSessionChange?.();
  };

  // Attendance & Tasks Flow
  const startCameraAction = (type: 'check-in' | 'check-out', task: GeoTaskItem) => {
    if (!isInside) {
      alert(
        `Geofence Violation: You are ${distanceToSite}m from ${user?.assignedSite.name}. Attendance photo check-in is restricted to inside the ${user?.assignedSite.radiusMeters}m perimeter.`
      );
      return;
    }
    setCameraTarget({ type, task });
    setCameraModalOpen(true);
  };

  const handleSelfieCaptured = async (photoBase64: string) => {
    if (!user || !cameraTarget || !userCoords) return;
    const { type, task } = cameraTarget;

    try {
      if (type === 'check-in') {
        // 1. POST /api/attendance/sign-in
        try {
          const signInRes = await geoTaskApi.signIn({
            userId: user._id,
            latitude: userCoords.latitude,
            longitude: userCoords.longitude,
            photo: photoBase64
          });
          setActiveSession(signInRes.record);
        } catch (signInErr: any) {
          // Spec: If 400 "Already signed in", just start the task
          console.log('User already signed in, starting task directly...');
        }

        // 2. PUT /api/user/tasks/:taskId/status -> in-progress
        await geoTaskApi.updateTaskStatus(task._id, 'in-progress', userCoords);
      } else {
        // Check-Out flow
        // 1. PUT /api/user/tasks/:taskId/status -> completed
        await geoTaskApi.updateTaskStatus(task._id, 'completed', userCoords);

        // 2. POST /api/attendance/sign-out
        try {
          await geoTaskApi.signOut({
            userId: user._id,
            latitude: userCoords.latitude,
            longitude: userCoords.longitude,
            photo: photoBase64
          });
          setActiveSession(null);
        } catch (signOutErr) {
          console.warn('Sign-out note:', signOutErr);
        }
      }

      // Reload fresh data
      loadUserData(user._id);
    } catch (err: any) {
      alert(`Error updating attendance: ${err.message}`);
    }
  };

  // Support Ticket Submission
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !ticketMessage.trim()) return;

    setTicketSubmitting(true);
    setTicketFeedback(null);
    try {
      await geoTaskApi.submitTicket({
        userId: user._id,
        message: ticketMessage.trim(),
        latitude: userCoords?.latitude || 0,
        longitude: userCoords?.longitude || 0
      });
      setTicketMessage('');
      setTicketFeedback('Support ticket dispatched to operations control.');
      setTimeout(() => setTicketFeedback(null), 4000);
      onSessionChange?.();
    } catch (err: any) {
      setTicketFeedback(`Error submitting ticket: ${err.message}`);
    } finally {
      setTicketSubmitting(false);
    }
  };

  // ==========================================
  // RENDER: LOGIN / OTP SCREEN
  // ==========================================
  if (!user) {
    return (
      <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-6 justify-center">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-xl shadow-indigo-600/30 mb-3">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Geo-Task</h1>
          <p className="text-xs text-slate-400 mt-1">Field Workforce Geo-Attendance & Tasks</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          {!otpStep ? (
            <div>
              <div className="mb-4">
                <h2 className="text-base font-bold text-white">Employee Login</h2>
                <p className="text-xs text-slate-400">Enter your registered mobile number</p>
              </div>

              {/* Quick-Fill Buttons for Seeded Employees */}
              <div className="mb-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                  <span className="flex items-center gap-1 text-indigo-400">
                    <Sparkles className="w-3 h-3" /> Seed Test Users:
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">OTP: 1111</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileNumber('9990001111')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all text-left truncate ${
                      mobileNumber === '9990001111'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    Ravi K. (HQ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileNumber('9990002222')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all text-left truncate ${
                      mobileNumber === '9990002222'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    Priya S. (Warehouse)
                  </button>
                </div>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Mobile Number
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-bold text-slate-500">+91</span>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="9990001111"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-12 pr-4 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                      maxLength={10}
                      autoFocus
                    />
                  </div>
                </div>

                {authError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Phone className="w-3.5 h-3.5" />
                      Send Verification Code
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <h2 className="text-base font-bold text-white">Enter OTP</h2>
                <p className="text-xs text-slate-400">
                  4-digit verification code sent to +91 {mobileNumber}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                  Demo OTP is 1111
                </span>
              </div>

              {/* 4 Auto-advancing boxes */}
              <div className="flex justify-between gap-3 mb-5">
                {[0, 1, 2, 3].map((idx) => (
                  <input
                    key={idx}
                    ref={otpInputRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={otpDigits[idx]}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-14 h-14 text-center text-xl font-bold bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                ))}
              </div>

              {authError && (
                <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={authLoading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    Verify & Login
                  </>
                )}
              </button>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep(false);
                    setAuthError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 underline"
                >
                  Change mobile number
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: AUTHENTICATED APP
  // ==========================================
  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* 1. Purple/Indigo Gradient Header "Geo-Task" with User and Org */}
      <div className="p-4 bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 text-white shadow-lg shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-200">
                {user.organization?.name || 'Acme Corp'}
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-300">Live Socket</span>
            </div>
            <h1 className="text-lg font-black tracking-tight text-white leading-tight">Geo-Task</h1>
            <p className="text-xs text-indigo-100 font-medium">
              {user.name} ({user.employeeId}) • <span className="underline">{user.assignedSite?.name}</span>
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Dev Geo-Fence Testing Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
          <Compass className="w-3.5 h-3.5 text-indigo-400" />
          <span>GPS Simulator:</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleTeleportToSite(true)}
            className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all border ${
              isInside && isSimulatedGps
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            Inside (10m)
          </button>
          <button
            onClick={() => handleTeleportToSite(false)}
            className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all border ${
              !isInside && isSimulatedGps
                ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            Outside (400m)
          </button>
          <button
            onClick={handleAcquireRealGps}
            disabled={isRefreshingGps}
            className="px-2 py-1 rounded-lg text-[10px] font-extrabold bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 hover:bg-indigo-900/60 transition-all flex items-center gap-1"
          >
            <Navigation className={`w-3 h-3 ${isRefreshingGps ? 'animate-spin' : ''}`} />
            Real GPS
          </button>
        </div>
      </div>

      {/* 3. Active Session Status Pill */}
      {activeSession && (
        <div className="px-3 py-1.5 bg-emerald-950/70 border-b border-emerald-500/30 flex items-center justify-between text-[11px] text-emerald-300 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold">Active Attendance Session</span>
            <span className="text-emerald-400/80">
              (Since {new Date(activeSession.signInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
            </span>
          </div>
          <span className="font-semibold text-[10px] bg-emerald-900/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
            {activeSession.siteName}
          </span>
        </div>
      )}

      {/* 4. Tab Body Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'HOME' ? (
          <div className="p-4 space-y-4 pb-20">
            {/* 1. LOCATION CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" /> GPS Geofence Radar
                </span>
                <button
                  onClick={handleAcquireRealGps}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshingGps ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {/* Inside / Outside Banner */}
              <div
                className={`p-3.5 rounded-2xl border mb-3 transition-colors ${
                  isInside
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isInside ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <h3 className="text-xs font-extrabold tracking-tight">
                      {isInside ? 'WITHIN ASSIGNED GEOFENCE (ALLOWED)' : 'OUTSIDE GEOFENCE (BLOCKED)'}
                    </h3>
                    <p className="text-[11px] opacity-90 mt-0.5 leading-snug">
                      {isInside
                        ? `You are inside ${user.assignedSite.name} perimeter (${distanceToSite}m from center, radius: ${user.assignedSite.radiusMeters}m).`
                        : `You are ${distanceToSite}m from ${user.assignedSite.name}. Check-in permitted only within ${user.assignedSite.radiusMeters}m.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Coordinates & Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Coordinates</span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {userCoords ? `${userCoords.latitude.toFixed(4)}, ${userCoords.longitude.toFixed(4)}` : '--'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Distance to Site</span>
                  <span
                    className={`text-xs font-mono font-bold ${
                      isInside ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {distanceToSite !== null ? formatDistance(distanceToSite) : '--'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Speed</span>
                  <span className="text-xs font-mono font-bold text-slate-200">{speedKmh} km/h</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Total Traveled</span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {formatDistance(totalDistanceMeters)}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. TASK CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" /> Assigned Shift Tasks
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  {tasks.filter((t) => t.status === 'completed').length} / {tasks.length} Done
                </span>
              </div>

              {loadingTasks ? (
                <div className="py-8 text-center">
                  <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 mt-2">Loading tasks...</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No tasks assigned to your employee profile.
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task._id}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-white leading-snug">{task.title}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0 ${
                            task.status === 'completed'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : task.status === 'in-progress'
                              ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{task.description}</p>

                      {/* Action buttons */}
                      <div>
                        {task.status === 'pending' && (
                          <button
                            onClick={() => startCameraAction('check-in', task)}
                            disabled={!isInside}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                              isInside
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <Camera className="w-3.5 h-3.5" />
                            {isInside ? 'Selfie Check-In & Start Task' : 'Geofence Blocked (Move Inside)'}
                          </button>
                        )}

                        {task.status === 'in-progress' && (
                          <button
                            onClick={() => startCameraAction('check-out', task)}
                            disabled={!isInside}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                              isInside
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isInside ? 'Selfie Check-Out & Complete' : 'Geofence Blocked (Move Inside)'}
                          </button>
                        )}

                        {task.status === 'completed' && (
                          <div className="py-1.5 px-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Task Verified & Completed
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. SUPPORT TICKET CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-md">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                <LifeBuoy className="w-3.5 h-3.5 text-rose-400" /> Raise Support Ticket
              </span>
              <p className="text-[11px] text-slate-400 mb-3">
                Report on-site issues or emergencies with real-time GPS coordinates to dispatch.
              </p>

              <form onSubmit={handleSubmitTicket} className="space-y-3">
                <textarea
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Describe field issue (e.g., equipment malfunction, road blocked, safety incident)..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                />

                {ticketFeedback && (
                  <p className="text-[11px] font-semibold text-emerald-400">{ticketFeedback}</p>
                )}

                <button
                  type="submit"
                  disabled={ticketSubmitting || !ticketMessage.trim()}
                  className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  {ticketSubmitting ? 'Transmitting...' : 'Submit Support Ticket'}
                </button>
              </form>
            </div>

            {/* 4. ACTIVITY TIMELINE */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-md">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-3">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> Today's Activity Timeline
              </span>

              {activityRecords.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No attendance records logged for today yet.
                </div>
              ) : (
                <div className="space-y-3 border-l-2 border-slate-800 pl-3 ml-2">
                  {activityRecords.map((rec) => (
                    <div key={rec._id} className="relative">
                      <span className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-slate-900" />
                      <div className="text-xs font-bold text-white">
                        Attendance Session ({rec.status === 'active' ? 'Active' : 'Closed'})
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        In: {new Date(rec.signInTime).toLocaleTimeString()} @ {rec.siteName}
                        {rec.signOutTime && (
                          <span> • Out: {new Date(rec.signOutTime).toLocaleTimeString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* MAP TAB */
          <InteractiveMapTab
            site={user.assignedSite}
            userCoords={userCoords}
            distanceToSite={distanceToSite}
            isInside={isInside}
            onSimulateCoordinates={(lat, lng) => {
              setIsSimulatedGps(true);
              updateUserPosition(lat, lng, 1.2);
            }}
          />
        )}
      </div>

      {/* 5. Bottom Navigation Bar (Home & Map) */}
      <div className="absolute bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-6 py-2 flex items-center justify-around z-30">
        <button
          onClick={() => setActiveTab('HOME')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === 'HOME'
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('MAP')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === 'MAP'
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span className="text-[10px]">Map</span>
        </button>
      </div>

      {/* 6. Selfie Verification Camera Modal */}
      <CameraSelfieModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={handleSelfieCaptured}
        actionTitle={cameraTarget?.type === 'check-in' ? 'Check-In Verification' : 'Check-Out Verification'}
        taskTitle={cameraTarget?.task.title || ''}
      />
    </div>
  );
};
