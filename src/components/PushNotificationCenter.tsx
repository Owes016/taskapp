import React, { useState } from 'react';
import { Bell, Send, CheckCircle2, ShieldAlert, Clock, Sparkles, X, Smartphone, Trash2 } from 'lucide-react';
import { PushNotificationItem, User } from '../types';
import { capacitorBridge } from '../services/capacitorBridge';

interface PushNotificationCenterProps {
  notifications: PushNotificationItem[];
  currentUser: User;
  onSendTestNotification: (notification: PushNotificationItem) => void;
  onClearNotifications: () => void;
  onClose: () => void;
  fcmToken: string | null;
}

export const PushNotificationCenter: React.FC<PushNotificationCenterProps> = ({
  notifications,
  currentUser,
  onSendTestNotification,
  onClearNotifications,
  onClose,
  fcmToken
}) => {
  const [customTitle, setCustomTitle] = useState('Immediate Shift Notification');
  const [customBody, setCustomBody] = useState('All field engineers must submit daily inspection report by 5:00 PM.');
  const [selectedType, setSelectedType] = useState<PushNotificationItem['type']>('admin_broadcast');
  const [isSending, setIsSending] = useState(false);

  const handleTriggerQuickPush = async (type: PushNotificationItem['type'], title: string, body: string) => {
    setIsSending(true);
    const item: PushNotificationItem = {
      id: `push_${Date.now()}`,
      title,
      body,
      receivedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      read: false,
      priority: 'high'
    };

    // Trigger local alert / notification via Capacitor bridge
    await capacitorBridge.scheduleLocalAlert(title, body, { type });
    onSendTestNotification(item);
    setTimeout(() => setIsSending(false), 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">FCM Push Notification Hub</h2>
              <p className="text-xs text-slate-400">Capacitor Push Service & Real-Time MongoDB Dispatcher</p>
            </div>
          </div>
          <button
            id="close-push-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* FCM Token Registration Banner */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                Active Device Push Token (Stored in MongoDB):
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <p className="font-mono text-[11px] text-slate-300 bg-slate-950/80 p-2 rounded-lg border border-slate-800 break-all select-all">
              {fcmToken || 'fcm_cap_android_99x81_sample_token'}
            </p>
            <p className="text-[10px] text-slate-400">
              When running on native Android, Capacitor generates this FCM registration token and synchronizes it to{' '}
              <code className="text-indigo-300">users.fcmTokens[]</code> in MongoDB.
            </p>
          </div>

          {/* Quick Push Preset Triggers */}
          <div>
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3">
              1-Click Senior Demonstration Triggers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                id="push-preset-shift-btn"
                disabled={isSending}
                onClick={() =>
                  handleTriggerQuickPush(
                    'shift_reminder',
                    'Shift Reminder (9:00 AM)',
                    `Hey ${currentUser.name}, you have not punched in yet. Your scheduled shift begins in 15 mins.`
                  )
                }
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-indigo-400 font-bold mb-1">
                  <Clock className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>Shift Alert</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">Sends automated check-in reminder to field worker</p>
              </button>

              <button
                id="push-preset-geofence-btn"
                disabled={isSending}
                onClick={() =>
                  handleTriggerQuickPush(
                    'geofence_entry',
                    'Geofence Boundary Entered 📍',
                    'Tech Center HQ perimeter detected (Distance: 15m). Quick Punch In is now unlocked.'
                  )
                }
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>Geofence Entry</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">Triggered when GPS enters office perimeter</p>
              </button>

              <button
                id="push-preset-manager-btn"
                disabled={isSending}
                onClick={() =>
                  handleTriggerQuickPush(
                    'manager_approval',
                    'Manager Overtime Approved ✓',
                    'Marcus Chen approved your 2-hour weekend overtime request.'
                  )
                }
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>Manager Action</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">Real-time sync from admin dashboard</p>
              </button>
            </div>
          </div>

          {/* Custom Notification Composer */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Custom Notification Dispatcher
            </h3>
            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-medium">Notification Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. Critical Safety Alert"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-medium">Message Body</label>
                <textarea
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
                  placeholder="e.g. Please proceed to Zone 2..."
                />
              </div>
            </div>

            <button
              id="dispatch-custom-push-btn"
              disabled={isSending}
              onClick={() => handleTriggerQuickPush(selectedType, customTitle, customBody)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch FCM Push to Mobile Device</span>
            </button>
          </div>

          {/* Incoming Push History Log */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                Received Notification Feed ({notifications.length})
              </h3>
              {notifications.length > 0 && (
                <button
                  id="clear-all-push-btn"
                  onClick={onClearNotifications}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-950/60 border border-slate-800 text-slate-500">
                No push notifications received yet. Click any preset trigger above to test!
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-1"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mt-0.5">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-200 text-xs">{n.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{n.body}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">{n.receivedAt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            id="done-push-modal-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
