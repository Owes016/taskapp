import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Camera, CheckCircle, Clock, MapPin, RefreshCw, AlertTriangle, ShieldCheck, UserCheck, Smartphone, Monitor, MessageSquare } from 'lucide-react';
import { User, GeoFenceZone, PlatformType, AttendanceRecord, ChatWebhookConfig } from '../types';
import { capacitorBridge } from '../services/capacitorBridge';

interface CheckInCardProps {
  currentUser: User;
  users: User[];
  onSelectUser: (user: User) => void;
  activeGeofence: GeoFenceZone | null;
  isInGeofence: boolean;
  distanceToGeofence: number;
  currentPlatform: PlatformType;
  userLocation: { latitude: number; longitude: number; accuracy: number };
  onCheckInSuccess: (record: AttendanceRecord) => void;
  chatWebhookConfig?: ChatWebhookConfig;
  onOpenChatWebhookModal?: () => void;
}

export const CheckInCard: React.FC<CheckInCardProps> = ({
  currentUser,
  users,
  onSelectUser,
  activeGeofence,
  isInGeofence,
  distanceToGeofence,
  currentPlatform,
  userLocation,
  onCheckInSuccess,
  chatWebhookConfig,
  onOpenChatWebhookModal
}) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendanceType, setAttendanceType] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');

  const handleCapturePhoto = async () => {
    setIsCapturing(true);
    try {
      const dataUrl = await capacitorBridge.captureAttendancePhoto();
      setPhotoPreview(dataUrl);
    } catch (err) {
      console.error('Camera error:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSubmitAttendance = async () => {
    setIsSubmitting(true);
    try {
      // If photo was not yet captured, auto-capture
      let finalPhoto = photoPreview;
      if (!finalPhoto) {
        finalPhoto = await capacitorBridge.captureAttendancePhoto();
        setPhotoPreview(finalPhoto);
      }

      const status = isInGeofence ? 'VERIFIED' : 'OUT_OF_BOUNDS';
      const zoneName = activeGeofence ? activeGeofence.name : 'Outside Defined Perimeter';

      const newRecord: AttendanceRecord = {
        id: `att_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        employeeCode: currentUser.employeeCode,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: attendanceType,
        status: status,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        accuracy: userLocation.accuracy,
        distanceToPerimeter: distanceToGeofence,
        zoneName: zoneName,
        photoUrl: finalPhoto,
        platform: currentPlatform,
        deviceModel: currentPlatform === 'android' ? 'Android 14 (Capacitor Container)' : 'Chrome Desktop (Web)',
        syncedToMongo: true,
        notes: isInGeofence ? 'Biometrics & GPS Verified' : 'Warning: Geo-perimeter violation logged to Mongo audit'
      };

      // Trigger local sound / confetti
      if (status === 'VERIFIED') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#4f46e5', '#06b6d4', '#10b981']
        });
      }

      // Schedule local push notification on device
      await capacitorBridge.scheduleLocalAlert(
        attendanceType === 'CHECK_IN' ? 'Attendance Recorded ✓' : 'Punch-Out Logged ✓',
        `${currentUser.name} (${currentUser.employeeCode}) at ${zoneName} [${status}]`
      );

      onCheckInSuccess(newRecord);
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-full">
      {/* Top: User Selection & Status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-200 tracking-wide uppercase">Field Employee Terminal</h2>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800">
            {currentPlatform === 'android' ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Native Container</span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-indigo-400 font-semibold">Web View</span>
              </>
            )}
          </span>
        </div>

        {/* User Card Switcher */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-12 h-12 rounded-xl object-cover border border-indigo-500/30 ring-2 ring-indigo-500/20"
            />
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-slate-100">{currentUser.name}</p>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {currentUser.employeeCode}
                </span>
              </div>
              <p className="text-xs text-slate-400">{currentUser.role} • {currentUser.department}</p>
            </div>
          </div>

          {/* Quick User Dropdown */}
          <select
            id="employee-selector"
            value={currentUser.id}
            onChange={(e) => {
              const selected = users.find((u) => u.id === e.target.value);
              if (selected) onSelectUser(selected);
            }}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.employeeCode})
              </option>
            ))}
          </select>
        </div>

        {/* Punch Type Selector */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            id="select-check-in-btn"
            onClick={() => setAttendanceType('CHECK_IN')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              attendanceType === 'CHECK_IN'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>PUNCH IN</span>
          </button>
          <button
            id="select-check-out-btn"
            onClick={() => setAttendanceType('CHECK_OUT')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              attendanceType === 'CHECK_OUT'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>PUNCH OUT</span>
          </button>
        </div>

        {/* Geofence & Liveness Diagnostic Card */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400">Target Geofence:</span>
            </div>
            <span className="text-slate-200 font-semibold truncate max-w-[180px]">
              {activeGeofence ? activeGeofence.name : 'Unknown Zone'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-400">Perimeter Status:</span>
            </div>
            {isInGeofence ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                VERIFIED IN-BOUNDS ({distanceToGeofence}m)
              </span>
            ) : (
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                OUT OF BOUNDS (+{distanceToGeofence}m)
              </span>
            )}
          </div>
        </div>

        {/* Selfie & Camera Biometric Snapshot */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-indigo-400" />
              <span>Face Verification Snapshot</span>
            </label>
            <button
              id="retake-photo-btn"
              onClick={handleCapturePhoto}
              disabled={isCapturing}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isCapturing ? 'animate-spin' : ''}`} />
              {photoPreview ? 'Retake Selfie' : 'Test Camera'}
            </button>
          </div>

          <div
            onClick={handleCapturePhoto}
            className="group relative cursor-pointer h-24 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500/80 bg-slate-950/60 overflow-hidden flex items-center justify-center transition-all"
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Live Verification" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-3">
                <Camera className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 mx-auto mb-1 transition-colors" />
                <p className="text-[11px] text-slate-400">Click to open native Capacitor Camera</p>
              </div>
            )}
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-semibold text-white transition-opacity">
              Tap to Capture
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Main Check-in Action Button */}
      <div className="pt-4 border-t border-slate-800/80 mt-4 space-y-3">
        {chatWebhookConfig && (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px]">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300">Google Chat Webhook:</span>
              {chatWebhookConfig.enabled && chatWebhookConfig.webhookUrl ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Auto-Push Active
                </span>
              ) : (
                <span className="text-slate-500">Not configured</span>
              )}
            </div>
            {onOpenChatWebhookModal && (
              <button
                type="button"
                onClick={onOpenChatWebhookModal}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-medium"
              >
                {chatWebhookConfig.webhookUrl ? 'Settings' : 'Set Webhook'}
              </button>
            )}
          </div>
        )}

        <button
          id="submit-attendance-btn"
          disabled={isSubmitting}
          onClick={handleSubmitAttendance}
          className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 ${
            isInGeofence
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
              : 'bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white shadow-amber-600/30'
          }`}
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>SYNCING TO MONGODB CLUSTER...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>
                {attendanceType === 'CHECK_IN' ? 'CONFIRM CHECK-IN' : 'CONFIRM PUNCH OUT'}{' '}
                {isInGeofence ? '✓' : '(OVERRIDE OUT-OF-BOUNDS)'}
              </span>
            </>
          )}
        </button>

        <p className="text-center text-[10px] text-slate-500 mt-2">
          Syncs instantaneously to MongoDB Replica Set via Express API & emits FCM native push alert
        </p>
      </div>
    </div>
  );
};
