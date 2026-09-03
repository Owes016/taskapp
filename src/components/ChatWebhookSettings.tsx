import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  AlertTriangle,
  X,
  Radio,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { ChatWebhookConfig, ChatWebhookDeliveryLog } from '../types';

interface ChatWebhookSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  config: ChatWebhookConfig;
  onUpdateConfig: (partial: Partial<ChatWebhookConfig>) => void;
  deliveryLogs: ChatWebhookDeliveryLog[];
  onTestWebhook: (url?: string) => Promise<{ success: boolean; message: string }>;
  onClearLogs: () => void;
  isSending: boolean;
}

export const ChatWebhookSettings: React.FC<ChatWebhookSettingsProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  deliveryLogs,
  onTestWebhook,
  onClearLogs,
  isSending
}) => {
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'CONFIG' | 'PREVIEW' | 'LOGS'>('CONFIG');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTestPing = async () => {
    setTestResult(null);
    const res = await onTestWebhook();
    setTestResult(res);
  };

  const handleCopySampleWebhook = () => {
    const sample = 'https://chat.googleapis.com/v1/spaces/AAAAxxxxxx/messages?key=AIzaSyAABBCCDDEE&token=abc123xyz';
    navigator.clipboard.writeText(sample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Google Chat Webhook Automation</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Real-Time Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automatically push attendance events to your team's Google Chat space
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-800 bg-slate-950/40 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('CONFIG')}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === 'CONFIG'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Webhook Configuration
          </button>
          <button
            onClick={() => setActiveTab('PREVIEW')}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === 'PREVIEW'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Card V2 Preview
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'LOGS'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Delivery Logs</span>
            {deliveryLogs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                {deliveryLogs.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {activeTab === 'CONFIG' && (
            <div className="space-y-5">
              {/* Master Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>Automated Google Chat Updates</span>
                    {config.enabled ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    When active, check-in and punch-out events are dispatched immediately upon confirmation.
                  </p>
                </div>
                <button
                  onClick={() => onUpdateConfig({ enabled: !config.enabled })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    config.enabled ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md transition-transform" />
                </button>
              </div>

              {/* Webhook URL Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span>Google Chat Incoming Webhook URL</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <button
                    onClick={handleCopySampleWebhook}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Sample Copied!' : 'Copy Sample Format'}</span>
                  </button>
                </div>
                <input
                  type="url"
                  value={config.webhookUrl}
                  onChange={(e) => onUpdateConfig({ webhookUrl: e.target.value })}
                  placeholder="https://chat.googleapis.com/v1/spaces/AAAAxxxxxx/messages?key=AIzaSy...&token=..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  In Google Chat: Click Space Name &rarr; <b>Apps & Integrations</b> &rarr; <b>Manage webhooks</b> &rarr; <b>Add webhook</b>. Copy and paste the resulting URL here.
                </p>
              </div>

              {/* Space Name / Label */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Target Space / Channel Label
                </label>
                <input
                  type="text"
                  value={config.spaceName}
                  onChange={(e) => onUpdateConfig({ spaceName: e.target.value })}
                  placeholder="e.g. Field Ops Attendance Alert Room"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Event Triggers Filter */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-slate-300">
                  Trigger Conditions
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={config.notifyOnCheckIn}
                      onChange={(e) => onUpdateConfig({ notifyOnCheckIn: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0"
                    />
                    <span className="text-xs text-slate-200">Notify on Check-In</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={config.notifyOnCheckOut}
                      onChange={(e) => onUpdateConfig({ notifyOnCheckOut: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0"
                    />
                    <span className="text-xs text-slate-200">Notify on Punch-Out</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={config.notifyOnOutOfBounds}
                      onChange={(e) => onUpdateConfig({ notifyOnOutOfBounds: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-rose-600 focus:ring-0"
                    />
                    <span className="text-xs text-slate-200">Out of Bounds Flags</span>
                  </label>
                </div>
              </div>

              {/* Status & Test Controls */}
              <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Last status:</span>
                  {config.lastStatus === 'success' && (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Delivered ({config.lastDispatchedAt})
                    </span>
                  )}
                  {config.lastStatus === 'error' && (
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Failed ({config.lastDispatchedAt})
                    </span>
                  )}
                  {(!config.lastStatus || config.lastStatus === 'idle') && (
                    <span className="text-slate-500">Idle / Ready</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleTestPing}
                  disabled={isSending || !config.webhookUrl}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                >
                  {isSending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Send Test Ping</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    testResult.success
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold">{testResult.success ? 'Success' : 'Dispatch Notice'}</div>
                    <div className="text-[11px] mt-0.5 opacity-90">{testResult.message}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'PREVIEW' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>
                  Below is a visual simulation of how attendance events appear inside Google Chat when posted via incoming webhook.
                </span>
              </div>

              {/* Chat Card Simulation */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    GA
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>GeoAttend Bot</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400 font-normal">
                        APP
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">Google Chat Webhook • Just now</div>
                  </div>
                </div>

                {/* Card V2 Container */}
                <div className="rounded-xl bg-slate-900 border border-slate-700/60 p-4 space-y-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">GeoAttend Verification Alert: CHECK IN</h4>
                      <p className="text-[11px] text-slate-400">Jane Doe • Tech Center HQ</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                    <div className="p-2 rounded-lg bg-slate-950/60">
                      <span className="text-[10px] text-slate-400 block uppercase">Staff Member</span>
                      <span className="font-semibold text-slate-200">Jane Doe (#EMP-102)</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60">
                      <span className="text-[10px] text-slate-400 block uppercase">Verification Status</span>
                      <span className="font-semibold text-emerald-400">✅ VERIFIED (GPS 12m)</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60">
                      <span className="text-[10px] text-slate-400 block uppercase">Location / Zone</span>
                      <span className="font-semibold text-slate-200">Tech Center HQ</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60">
                      <span className="text-[10px] text-slate-400 block uppercase">Device & Time</span>
                      <span className="font-semibold text-slate-200">Android Mobile • 08:05 AM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'LOGS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Recent Webhook Dispatch History</span>
                {deliveryLogs.length > 0 && (
                  <button
                    onClick={onClearLogs}
                    className="text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Logs</span>
                  </button>
                )}
              </div>

              {deliveryLogs.length === 0 ? (
                <div className="text-center py-10 rounded-xl bg-slate-950/50 border border-slate-800/60 text-slate-500 text-xs">
                  No webhook dispatches recorded yet. Complete an attendance check-in or send a test ping to generate logs.
                </div>
              ) : (
                <div className="space-y-2">
                  {deliveryLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {log.status}
                          </span>
                          <span className="font-semibold text-slate-200">{log.userName}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">{log.type}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{log.payloadSummary}</p>
                        {log.errorMessage && (
                          <p className="text-[11px] text-rose-400 font-mono">{log.errorMessage}</p>
                        )}
                      </div>
                      <div className="text-right text-[11px] text-slate-500 shrink-0">
                        <div className="flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          <span>{log.timestamp}</span>
                        </div>
                        {log.responseStatus && (
                          <span className="text-[10px] text-slate-600 font-mono">
                            HTTP {log.responseStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
