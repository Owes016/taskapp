// Configuration for Geo-Task Expo Mobile App
// For an Android emulator running locally, use 10.0.2.2:5000
// For an iOS simulator or web, use localhost:5000
// For a physical device on same WiFi, use your machine's LAN IP: e.g. 192.168.1.50:5000

const BACKEND_HOST = 'http://localhost:5000';

export const CONFIG = {
  API_BASE_URL: `${BACKEND_HOST}/api`,
  SOCKET_URL: BACKEND_HOST,
  // Polling & broadcast intervals
  PROFILE_REFRESH_INTERVAL_MS: 30000,
  SOCKET_BROADCAST_INTERVAL_MS: 10000,
  JITTER_THRESHOLD_METERS: 3
};

export default CONFIG;
