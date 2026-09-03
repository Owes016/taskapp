import { useState, useEffect, useCallback, useRef } from 'react';
import { AttendanceRecord, ChatWebhookConfig, ChatWebhookDeliveryLog } from '../types';

const STORAGE_KEY = 'geoattend_chat_webhook_config';
const DEFAULT_CONFIG: ChatWebhookConfig = {
  webhookUrl: '',
  spaceName: 'Field Operations & Attendance Alert Room',
  enabled: true,
  notifyOnCheckIn: true,
  notifyOnCheckOut: true,
  notifyOnOutOfBounds: true,
  lastStatus: 'idle'
};

/**
 * Builds Google Chat message payload with formatted Markdown and rich CardsV2 representation.
 */
export function buildGoogleChatAttendancePayload(record: AttendanceRecord) {
  const isCheckIn = record.type === 'CHECK_IN';
  const typeEmoji = isCheckIn ? '🟢' : '🔴';
  const typeText = isCheckIn ? 'CHECK IN' : 'CHECK OUT';
  const statusBadge =
    record.status === 'VERIFIED'
      ? '✅ VERIFIED'
      : record.status === 'OUT_OF_BOUNDS'
      ? '⚠️ OUT OF BOUNDS'
      : record.status === 'FLAGGED'
      ? '🚨 FLAGGED'
      : '📡 OFFLINE SYNCED';

  const timeFormatted = new Date(record.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const dateFormatted = new Date(record.timestamp).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const textSummary = `${typeEmoji} *GeoAttend Live Alert* | *${record.userName}* (${record.employeeCode}) logged *${typeText}*\n🏢 *Site*: ${record.zoneName} (${record.distanceToPerimeter}m from center)\n📊 *Status*: ${statusBadge} | *Time*: ${timeFormatted}\n📱 *Device*: ${record.deviceModel} (${record.platform.toUpperCase()})`;

  const cardPayload = {
    text: textSummary,
    cardsV2: [
      {
        cardId: `att-${record.id}`,
        card: {
          header: {
            title: `GeoAttend Verification Alert: ${typeText}`,
            subtitle: `${record.userName} • ${record.zoneName}`,
            imageUrl: isCheckIn
              ? 'https://fonts.gstatic.com/s/i/short-term/release/googlestore/verified_user/default/24px.svg'
              : 'https://fonts.gstatic.com/s/i/short-term/release/googlestore/logout/default/24px.svg',
            imageType: 'CIRCLE'
          },
          sections: [
            {
              header: 'Attendance Record Details',
              widgets: [
                {
                  decoratedText: {
                    topLabel: 'Staff Member & Code',
                    text: `<b>${record.userName}</b> (#${record.employeeCode})`,
                    bottomLabel: `Platform: ${record.platform.toUpperCase()} (${record.deviceModel})`
                  }
                },
                {
                  decoratedText: {
                    topLabel: 'Site Location & Geofence',
                    text: `<b>${record.zoneName}</b>`,
                    bottomLabel: `Distance to perimeter: ${record.distanceToPerimeter}m | Accuracy: ±${record.accuracy}m`
                  }
                },
                {
                  decoratedText: {
                    topLabel: 'Verification Outcome',
                    text: `<b>${statusBadge}</b>`,
                    bottomLabel: `${dateFormatted} at ${timeFormatted}`
                  }
                },
                ...(record.notes
                  ? [
                      {
                        decoratedText: {
                          topLabel: 'Shift Notes',
                          text: record.notes
                        }
                      }
                    ]
                  : [])
              ]
            }
          ]
        }
      }
    ]
  };

  return cardPayload;
}

/**
 * Hook for automatically dispatching real-time attendance logs to a Google Chat space via Webhook.
 */
export function useAttendanceChatWebhook() {
  const [config, setConfig] = useState<ChatWebhookConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load webhook config from localStorage', e);
    }
    return DEFAULT_CONFIG;
  });

  const [deliveryLogs, setDeliveryLogs] = useState<ChatWebhookDeliveryLog[]>([]);
  const [isSending, setIsSending] = useState(false);
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save webhook config to localStorage', e);
    }
  }, [config]);

  const updateConfig = useCallback((partial: Partial<ChatWebhookConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  /**
   * Dispatches an attendance record to the configured Google Chat webhook URL or connected Chat space.
   */
  const sendAttendanceWebhook = useCallback(
    async (
      record: AttendanceRecord,
      options?: {
        customWebhookUrl?: string;
        oauthToken?: string | null;
        chatSpaceName?: string;
      }
    ): Promise<{ success: boolean; error?: string; message?: string }> => {
      const currentConf = configRef.current;

      // Check if feature is enabled
      if (!currentConf.enabled && !options?.customWebhookUrl) {
        return { success: false, error: 'Google Chat automated webhook is disabled in settings.' };
      }

      // Check event filters
      if (record.type === 'CHECK_IN' && !currentConf.notifyOnCheckIn) {
        return { success: false, error: 'Check-in notifications are toggled off.' };
      }
      if (record.type === 'CHECK_OUT' && !currentConf.notifyOnCheckOut) {
        return { success: false, error: 'Check-out notifications are toggled off.' };
      }
      if (record.status === 'OUT_OF_BOUNDS' && !currentConf.notifyOnOutOfBounds) {
        return { success: false, error: 'Out-of-bounds notifications are toggled off.' };
      }

      const targetUrl = (options?.customWebhookUrl || currentConf.webhookUrl || '').trim();
      const payload = buildGoogleChatAttendancePayload(record);
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setIsSending(true);

      // Branch 1: If an incoming webhook URL is provided, POST to Google Chat Webhook endpoint
      if (targetUrl) {
        try {
          const res = await fetch(targetUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify(payload)
          });

          const isSuccess = res.ok || res.status === 200 || res.status === 204;
          let errMsg: string | undefined = undefined;

          if (!isSuccess) {
            const errData = await res.json().catch(() => ({}));
            errMsg = errData.error?.message || `HTTP ${res.status} ${res.statusText}`;
          }

          const newLog: ChatWebhookDeliveryLog = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            timestamp,
            attendanceId: record.id,
            userName: record.userName,
            type: record.type,
            zoneName: record.zoneName,
            status: isSuccess ? 'SUCCESS' : 'FAILED',
            responseStatus: res.status,
            errorMessage: errMsg,
            target: targetUrl.split('?')[0] || targetUrl,
            payloadSummary: `${record.type} for ${record.userName} at ${record.zoneName}`
          };

          setDeliveryLogs((prev) => [newLog, ...prev.slice(0, 49)]);

          setConfig((prev) => ({
            ...prev,
            lastDispatchedAt: timestamp,
            lastStatus: isSuccess ? 'success' : 'error',
            lastErrorMessage: errMsg
          }));

          return {
            success: isSuccess,
            error: errMsg,
            message: isSuccess
              ? `Status update sent to Google Chat space (${currentConf.spaceName})`
              : errMsg
          };
        } catch (error: any) {
          const errMsg = error?.message || 'Network error or CORS rejection on webhook endpoint.';
          const newLog: ChatWebhookDeliveryLog = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            timestamp,
            attendanceId: record.id,
            userName: record.userName,
            type: record.type,
            zoneName: record.zoneName,
            status: 'FAILED',
            errorMessage: errMsg,
            target: targetUrl.split('?')[0] || targetUrl,
            payloadSummary: `${record.type} for ${record.userName} at ${record.zoneName}`
          };

          setDeliveryLogs((prev) => [newLog, ...prev.slice(0, 49)]);
          setConfig((prev) => ({
            ...prev,
            lastDispatchedAt: timestamp,
            lastStatus: 'error',
            lastErrorMessage: errMsg
          }));

          return { success: false, error: errMsg };
        } finally {
          setIsSending(false);
        }
      }

      // Branch 2: Fallback to Google Chat REST API if OAuth token and space name are present
      if (options?.oauthToken && options?.chatSpaceName) {
        try {
          const spaceRes = await fetch(
            `https://chat.googleapis.com/v1/${options.chatSpaceName}/messages`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${options.oauthToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                text: payload.text
              })
            }
          );

          const isSuccess = spaceRes.ok;
          let errMsg: string | undefined = undefined;
          if (!isSuccess) {
            const errData = await spaceRes.json().catch(() => ({}));
            errMsg = errData.error?.message || `HTTP ${spaceRes.status}`;
          }

          const newLog: ChatWebhookDeliveryLog = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            timestamp,
            attendanceId: record.id,
            userName: record.userName,
            type: record.type,
            zoneName: record.zoneName,
            status: isSuccess ? 'SUCCESS' : 'FAILED',
            responseStatus: spaceRes.status,
            errorMessage: errMsg,
            target: options.chatSpaceName,
            payloadSummary: `${record.type} for ${record.userName} at ${record.zoneName}`
          };

          setDeliveryLogs((prev) => [newLog, ...prev.slice(0, 49)]);

          setConfig((prev) => ({
            ...prev,
            lastDispatchedAt: timestamp,
            lastStatus: isSuccess ? 'success' : 'error',
            lastErrorMessage: errMsg
          }));

          return {
            success: isSuccess,
            error: errMsg,
            message: `Sent to space ${options.chatSpaceName}`
          };
        } catch (error: any) {
          const errMsg = error?.message || 'Chat API error';
          return { success: false, error: errMsg };
        } finally {
          setIsSending(false);
        }
      }

      setIsSending(false);
      // No URL or OAuth space configured
      const newLog: ChatWebhookDeliveryLog = {
        id: `log_${Date.now()}`,
        timestamp,
        attendanceId: record.id,
        userName: record.userName,
        type: record.type,
        zoneName: record.zoneName,
        status: 'FAILED',
        errorMessage: 'No Google Chat incoming webhook URL configured.',
        target: 'Unset Webhook URL',
        payloadSummary: `${record.type} for ${record.userName} at ${record.zoneName}`
      };
      setDeliveryLogs((prev) => [newLog, ...prev.slice(0, 49)]);
      return {
        success: false,
        error: 'No Google Chat Webhook URL configured. Please paste your space incoming webhook URL in the settings.'
      };
    },
    []
  );

  /**
   * Sends a test ping to verify that the webhook is operational.
   */
  const testWebhook = useCallback(
    async (
      overrideUrl?: string
    ): Promise<{ success: boolean; message: string }> => {
      const url = (overrideUrl || configRef.current.webhookUrl || '').trim();
      if (!url) {
        return {
          success: false,
          message: 'Please provide a valid Google Chat webhook URL first.'
        };
      }

      setIsSending(true);
      const testRecord: AttendanceRecord = {
        id: `test_${Date.now()}`,
        userId: 'test-user',
        userName: 'Alex Johnson (Field Supervisor)',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        employeeCode: 'EMP-900',
        timestamp: new Date().toISOString(),
        type: 'CHECK_IN',
        status: 'VERIFIED',
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 5,
        distanceToPerimeter: 18,
        zoneName: 'Tech Center HQ',
        platform: 'android',
        deviceModel: 'Samsung Galaxy S24 Ultra',
        syncedToMongo: true,
        notes: 'Webhook test ping triggered manually from GeoAttend.'
      };

      const res = await sendAttendanceWebhook(testRecord, { customWebhookUrl: url });
      setIsSending(false);

      if (res.success) {
        return {
          success: true,
          message: 'Test message delivered successfully to Google Chat space!'
        };
      } else {
        return {
          success: false,
          message: res.error || 'Failed to dispatch test message to webhook.'
        };
      }
    },
    [sendAttendanceWebhook]
  );

  const clearDeliveryLogs = useCallback(() => {
    setDeliveryLogs([]);
  }, []);

  return {
    config,
    updateConfig,
    deliveryLogs,
    isSending,
    sendAttendanceWebhook,
    testWebhook,
    clearDeliveryLogs
  };
}
