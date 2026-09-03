import React from 'react';
import { Smartphone, Monitor, Bell, Database, Wifi, ShieldCheck, HelpCircle, Calendar, MessageSquare } from 'lucide-react';
import { PlatformType, BackendSyncStats, ChatWebhookConfig } from '../types';
import { User as FirebaseUser } from 'firebase/auth';

interface HeaderProps {
  currentPlatform: PlatformType;
  onTogglePlatform: (platform: PlatformType) => void;
  isMobilePreview: boolean;
  onToggleMobilePreview: () => void;
  syncStats: BackendSyncStats;
  unreadNotifications: number;
  onOpenNotifications: () => void;
  onOpenGuide: () => void;
  googleUser?: FirebaseUser | null;
  onOpenWorkspace?: () => void;
  chatWebhookConfig?: ChatWebhookConfig;
  onOpenChatWebhook?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPlatform,
  onTogglePlatform,
  isMobilePreview,
  onToggleMobilePreview,
  syncStats,
  unreadNotifications,
  onOpenNotifications,
  onOpenGuide,
  googleUser,
  onOpenWorkspace,
  chatWebhookConfig,
  onOpenChatWebhook,
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Brand & Status */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100 tracking-tight">GeoAttend</h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                  Capacitor Bridge
                </span>
              </div>
              <p className="text-xs text-slate-400">Cross-Platform React & Android Geofence Hub</p>
            </div>
          </div>

          {/* Quick guide button on mobile */}
          <button
            id="mobile-quick-guide-btn"
            onClick={onOpenGuide}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Senior Guide</span>
          </button>
        </div>

        {/* Center: Live Sync & Workspace Indicator */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300">MongoDB:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Replica Set Synced
            </span>
          </div>

          {onOpenChatWebhook && (
            <button
              onClick={onOpenChatWebhook}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                chatWebhookConfig?.enabled && chatWebhookConfig.webhookUrl
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Google Chat Webhook Automation"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chat Webhook:</span>
              <span
                className={
                  chatWebhookConfig?.enabled && chatWebhookConfig.webhookUrl
                    ? 'text-emerald-400 font-semibold flex items-center gap-1'
                    : 'text-slate-500 font-medium'
                }
              >
                {chatWebhookConfig?.enabled && chatWebhookConfig.webhookUrl ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live Push
                  </>
                ) : (
                  'Config'
                )}
              </span>
            </button>
          )}

          {onOpenWorkspace && (
            <button
              onClick={onOpenWorkspace}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                googleUser
                  ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/40'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Google Workspace Suite"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Workspace:</span>
              <span className={googleUser ? 'text-emerald-400 font-semibold' : 'text-slate-500 font-medium'}>
                {googleUser ? 'Connected' : 'Sign In'}
              </span>
            </button>
          )}
        </div>

        {/* Right: Controls & Toggles */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Platform Mode Selector */}
          <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            <button
              id="platform-android-btn"
              onClick={() => onTogglePlatform('android')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentPlatform === 'android'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android APK</span>
            </button>
            <button
              id="platform-web-btn"
              onClick={() => onTogglePlatform('web')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentPlatform === 'web'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Web Browser</span>
            </button>
          </div>

          {/* Toggle Mobile Phone Mockup */}
          <button
            id="toggle-phone-mockup-btn"
            onClick={onToggleMobilePreview}
            title={isMobilePreview ? "Switch to Wide View" : "Simulate Mobile Device Shell"}
            className={`p-2 rounded-xl border transition-all text-xs font-medium flex items-center gap-1.5 ${
              isMobilePreview
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">{isMobilePreview ? 'Phone Shell ON' : 'Phone Frame'}</span>
          </button>

          {/* Push Notification Center Trigger */}
          <button
            id="open-notifications-btn"
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            title="Push Notification Center"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {unreadNotifications}
              </span>
            )}
          </button>

          {/* Senior Conversion Guide Modal Trigger */}
          <button
            id="senior-build-guide-btn"
            onClick={onOpenGuide}
            className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Senior Guide & APK Build</span>
          </button>
        </div>
      </div>
    </header>
  );
};
