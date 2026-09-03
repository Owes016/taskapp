import React, { useState } from 'react';
import {
  X,
  Download,
  Smartphone,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Camera,
  MapPin,
  Radio,
  FileCode,
  HardDriveDownload,
  FolderArchive
} from 'lucide-react';

interface MobileAppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileAppDownloadModal: React.FC<MobileAppDownloadModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'APK' | 'QR' | 'GUIDE'>('APK');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Compute live URL for mobile testing
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-yrplatxengbn7rui35wvj7-785081643802.asia-southeast1.run.app';
  const mobileTestUrl = `${currentOrigin}/#/mobile`;

  // QR Code URL using high-reliability QR rendering API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&color=4F46E5&data=${encodeURIComponent(
    mobileTestUrl
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(mobileTestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Smartphone className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-tight">
                  GeoAttend Mobile & APK Download
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  v1.0.0 APK
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Download the installable Android package or test live on your mobile smartphone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('APK')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
              activeTab === 'APK'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDriveDownload className="w-4 h-4" />
            <span>Direct APK Download</span>
          </button>
          <button
            onClick={() => setActiveTab('QR')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
              activeTab === 'QR'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Instant Mobile Test (QR Code)</span>
          </button>
          <button
            onClick={() => setActiveTab('GUIDE')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
              activeTab === 'GUIDE'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Install & Test Guide</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: APK & Project Downloads */}
          {activeTab === 'APK' && (
            <div className="space-y-4">
              {/* Primary APK Download Card */}
              <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-2xl p-4.5 space-y-3 shadow-lg relative overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">GeoAttend-v1.0.apk</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Android Package
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 max-w-md">
                      Standalone Android package for manual installation on Android smartphones or tablets. Includes GPS geofencing, selfie camera verification, and live beacon tracking.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span>📦 <strong>Size:</strong> ~462 KB</span>
                      <span>📱 <strong>Target:</strong> Android 8.0+ (API 26+)</span>
                      <span>🆔 <strong>Package:</strong> com.geoattend.app</span>
                    </div>
                  </div>

                  <a
                    href="/api/download/GeoAttend.apk"
                    download="GeoAttend-v1.0.apk"
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all transform active:scale-95 cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download APK File</span>
                  </a>
                </div>
              </div>

              {/* Secondary Android Studio Project Download */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FolderArchive className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">GeoAttend-Android-Project.zip</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800/40">
                        Full Android Source
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 max-w-md">
                      Complete Android Studio project with Gradle wrapper, Capacitor Android bridge, native camera/GPS plugins, and AndroidManifest.xml ready to compile or customize.
                    </p>
                    <div className="text-[11px] text-slate-500">
                      📦 <strong>Size:</strong> ~518 KB | 🛠️ Open in Android Studio & hit <em>Run 'app'</em>
                    </div>
                  </div>

                  <a
                    href="/api/download/GeoAttend-Android-Project.zip"
                    download="GeoAttend-Android-Project.zip"
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Source (.ZIP)</span>
                  </a>
                </div>
              </div>

              {/* Quick Install Notes */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>How to Install the APK on Your Mobile Phone:</span>
                </h4>
                <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
                  <li>
                    Tap <strong className="text-slate-200">"Download APK File"</strong> directly from your mobile browser (or download on PC and send to your phone via WhatsApp/USB/Drive).
                  </li>
                  <li>
                    Open your mobile's <strong className="text-slate-200">Downloads</strong> folder and tap <strong className="text-slate-200">GeoAttend-v1.0.apk</strong>.
                  </li>
                  <li>
                    If Android prompts <em>"Install unknown apps"</em> or <em>"File might be harmful"</em>, tap <strong className="text-indigo-400">Settings</strong> and enable <strong className="text-slate-200">"Allow from this source"</strong>.
                  </li>
                  <li>
                    Tap <strong className="text-emerald-400">Install</strong>, grant Location & Camera permissions, and start testing!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: Instant Mobile Test via QR Code */}
          {activeTab === 'QR' && (
            <div className="space-y-4 text-center">
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 max-w-sm mx-auto space-y-4 shadow-inner">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Scan with Your Phone Camera</h4>
                  <p className="text-xs text-slate-400">
                    Instantly launches the live mobile client on your physical phone with real GPS & camera support:
                  </p>
                </div>

                <div className="bg-white p-3 rounded-2xl inline-block shadow-lg mx-auto">
                  <img
                    src={qrCodeUrl}
                    alt="Mobile App QR Code"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copied ? 'Copied Link!' : 'Copy Mobile Link'}</span>
                    </button>
                    <a
                      href={mobileTestUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in New Tab</span>
                    </a>
                  </div>

                  <p className="text-[11px] text-slate-500 break-all px-2">
                    {mobileTestUrl}
                  </p>
                </div>
              </div>

              {/* 1-Tap PWA Install Note */}
              <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-3.5 text-left text-xs text-indigo-200 flex items-start gap-2.5 max-w-md mx-auto">
                <Smartphone className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Pro Tip (1-Tap Home Screen App):</strong> When you open the link in Chrome or Samsung Internet on Android, tap the three dots <strong className="text-white">⋮</strong> and select <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong> to run it in full-screen standalone mode like a native app!
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Guide & Testing Features */}
          {activeTab === 'GUIDE' && (
            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                  <span>1. Real-time GPS Geofence Check-in</span>
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  The mobile app uses the device's hardware GPS sensor. When you tap <strong>"Check In"</strong>, the backend verifies whether your current latitude and longitude fall within the site's allowed perimeter radius (calculated via the high-precision Haversine formula).
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>2. Selfie & Facial Verification</span>
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  During attendance recording, the app requests camera access to capture a facial verification selfie. The photo is securely timestamped and attached to the audit record in the cloud.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-400" />
                  <span>3. Live Telemetry & Dispatch Beacon</span>
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  While active, the worker app continuously broadcasts periodic GPS coordinates over Socket.IO. Supervisors can monitor worker locations in real time on the interactive GIS map in the Admin Portal.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-purple-400" />
                  <span>4. Quick Demo Login Credentials</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 pt-1">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Worker Login</span>
                    <strong className="text-white text-xs">Mobile: +1 555-0101</strong> (or any 10-digit mobile)
                    <div className="text-[11px] text-emerald-400 mt-0.5">Demo OTP: 1111</div>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Admin Login</span>
                    <strong className="text-white text-xs">admin@enterprise.com</strong>
                    <div className="text-[11px] text-indigo-400 mt-0.5">Password: admin123</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Android 8.0+ / PWA / WebAPK compatible
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <a
              href="/api/download/GeoAttend.apk"
              download="GeoAttend-v1.0.apk"
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .APK</span>
            </a>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
