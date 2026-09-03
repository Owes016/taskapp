import React, { useState } from 'react';
import {
  FileCode,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  Download,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Database,
  Bell,
  Cpu,
  Layers,
  ArrowRight,
  X
} from 'lucide-react';
import {
  ANDROID_MANIFEST_TEMPLATE,
  CAPACITOR_CONFIG_TEMPLATE,
  MONGO_BACKEND_SYNC_TEMPLATE,
  SENIOR_CONVERSION_STEPS
} from '../data/androidTemplates';

interface SeniorGuideHubProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const SeniorGuideHub: React.FC<SeniorGuideHubProps> = ({ onClose, isModal = false }) => {
  const [activeTab, setActiveTab] = useState<'STEPS' | 'CONFIGS' | 'BACKEND' | 'FAQ'>('STEPS');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDownloadConfigs = () => {
    const zipData = {
      'capacitor.config.ts': CAPACITOR_CONFIG_TEMPLATE,
      'AndroidManifest.xml': ANDROID_MANIFEST_TEMPLATE,
      'server.js': MONGO_BACKEND_SYNC_TEMPLATE
    };

    const blob = new Blob([JSON.stringify(zipData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'GeoAttend-Capacitor-Android-Package.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const content = (
    <div className="space-y-6 text-slate-200">
      {/* Hero: Direct Answer to the User & Senior */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>YES, 100% FEASIBLE WITH CAPACITOR — 0 REWRITE NEEDED</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            How to Convert This React Web App to Native Android APK
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            You can wrap your exact existing React + Vite + Tailwind + Leaflet codebase into a production-ready Android APK using{' '}
            <strong className="text-white">Capacitor</strong>. Your hosted MongoDB backend, REST APIs, and FCM Push Notifications will function seamlessly across both mobile and web with zero code duplication.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="download-android-configs-btn"
              onClick={handleDownloadConfigs}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export Android Native Package (.JSON)</span>
            </button>

            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Production Ready for Android Studio & Google Play
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          id="tab-senior-steps-btn"
          onClick={() => setActiveTab('STEPS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'STEPS'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>1. Step-by-Step Commands</span>
        </button>

        <button
          id="tab-senior-configs-btn"
          onClick={() => setActiveTab('CONFIGS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'CONFIGS'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>2. AndroidManifest & Capacitor Config</span>
        </button>

        <button
          id="tab-senior-backend-btn"
          onClick={() => setActiveTab('BACKEND')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'BACKEND'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>3. Node.js + MongoDB + FCM Pipeline</span>
        </button>

        <button
          id="tab-senior-faq-btn"
          onClick={() => setActiveTab('FAQ')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'FAQ'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>4. Senior Architecture FAQ</span>
        </button>
      </div>

      {/* Tab 1: Step-by-Step Commands */}
      {activeTab === 'STEPS' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Run these 5 exact commands in your terminal to transform the React web project into an Android Studio build.
          </p>

          <div className="space-y-3">
            {SENIOR_CONVERSION_STEPS.map((s) => (
              <div
                key={s.step}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                      {s.step}
                    </span>
                    <h3 className="font-bold text-sm text-slate-100">{s.title}</h3>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium hidden sm:inline">Ready to Run</span>
                </div>

                <p className="text-xs text-slate-300">{s.summary}</p>

                {/* Code Box */}
                <div className="relative">
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto select-all">
                    {s.command}
                  </pre>
                  <button
                    id={`copy-step-${s.step}-btn`}
                    onClick={() => handleCopy(s.command, `step_${s.step}`)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                    title="Copy command"
                  >
                    {copiedCode === `step_${s.step}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 italic">💡 {s.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: AndroidManifest & Capacitor Config */}
      {activeTab === 'CONFIGS' && (
        <div className="space-y-4 text-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span>1. capacitor.config.ts (Project Root)</span>
              </h3>
              <button
                id="copy-cap-config-btn"
                onClick={() => handleCopy(CAPACITOR_CONFIG_TEMPLATE, 'cap_cfg')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                {copiedCode === 'cap_cfg' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy Config</span>
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-indigo-200 overflow-x-auto max-h-60">
              {CAPACITOR_CONFIG_TEMPLATE}
            </pre>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span>2. android/app/src/main/AndroidManifest.xml (Native Permissions & FCM)</span>
              </h3>
              <button
                id="copy-manifest-btn"
                onClick={() => handleCopy(ANDROID_MANIFEST_TEMPLATE, 'manifest_cfg')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                {copiedCode === 'manifest_cfg' ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>Copy Manifest</span>
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-200 overflow-x-auto max-h-72">
              {ANDROID_MANIFEST_TEMPLATE}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Node.js + MongoDB + FCM Pipeline */}
      {activeTab === 'BACKEND' && (
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>How the Same Backend Serves Both Web and Mobile</span>
            </h3>
            <p className="text-slate-300 leading-relaxed">
              Your existing Node.js + Express + MongoDB backend does not need to be rewritten. It simply exposes standard REST & WebSocket/SSE endpoints. When an employee logs in via Android, Capacitor registers their FCM token and sends it to{' '}
              <code className="text-indigo-300 font-mono">/api/push/register-token</code>.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">Complete server.js with MongoDB & Firebase Admin FCM:</span>
              <button
                id="copy-backend-code-btn"
                onClick={() => handleCopy(MONGO_BACKEND_SYNC_TEMPLATE, 'backend_cfg')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                {copiedCode === 'backend_cfg' ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>Copy server.js</span>
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-200 overflow-x-auto max-h-80">
              {MONGO_BACKEND_SYNC_TEMPLATE}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 4: Senior Architecture FAQ */}
      {activeTab === 'FAQ' && (
        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-slate-100 text-sm">Q1: Does Capacitor require rewriting our React components?</h4>
            <p className="text-slate-300 leading-relaxed">
              <strong>No.</strong> Capacitor loads your bundled Vite output (`dist/`) into a hardware-accelerated Android WebView. All React hooks, state, Tailwind CSS, and Leaflet map layers run natively at 60fps with zero modifications.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-slate-100 text-sm">
              Q2: How do native push notifications work with our MongoDB backend?
            </h4>
            <p className="text-slate-300 leading-relaxed">
              When the Android app boots, the Capacitor Push Notifications plugin contacts Google Firebase Cloud Messaging (FCM) to obtain a unique device token. The app saves this token in your MongoDB <code className="text-indigo-300 font-mono">User.fcmTokens</code> collection. Whenever an attendance event or manager announcement occurs, your backend calls Firebase Admin SDK to push directly to the device tray.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-slate-100 text-sm">
              Q3: How do we handle API URLs for local testing vs production?
            </h4>
            <p className="text-slate-300 leading-relaxed">
              For production, point your frontend API base URL to your hosted server (e.g.{' '}
              <code className="text-indigo-300 font-mono">https://api.yourdomain.com</code>). For local testing in the Android Emulator, use <code className="text-indigo-300 font-mono">http://10.0.2.2:5000</code>, which maps directly to your host machine's localhost.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-slate-100 text-sm">
              Q4: What about offline field attendance if an employee loses 4G/5G?
            </h4>
            <p className="text-slate-300 leading-relaxed">
              We implemented the offline queue using <code className="text-indigo-300 font-mono">@capacitor/preferences</code> (encrypted device storage). Check-ins made without internet are safely stored locally with GPS timestamps, and automatically synchronized to MongoDB the moment network connectivity resumes.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">Senior Conversion Guide & Android APK Hub</h2>
                <p className="text-xs text-slate-400">Complete architectural roadmap, CLI scripts, and native configs</p>
              </div>
            </div>
            {onClose && (
              <button
                id="close-senior-guide-modal-btn"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="p-6 overflow-y-auto flex-1">{content}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      {content}
    </div>
  );
};
