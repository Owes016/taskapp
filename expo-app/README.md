# Geo-Task Mobile App (React Native + Expo)

A complete React Native Expo mobile application for field employee geo-attendance, task check-in/out with selfie verification, and real-time Socket.IO live location tracking.

## Features
- **Mobile + OTP Login**: Auto-advancing 4-digit OTP boxes, auto-submit on the 4th digit (Seed OTP: `1111`).
- **Persistent Session**: Cached user session in AsyncStorage with auto-login on relaunch.
- **Geofencing with Haversine Formula**: High-accuracy continuous location tracking; compares distance to `assignedSite.radiusMeters`. Shows green when inside and red when outside.
- **Speed & Jitter Filtering**: Calculates real-time speed (km/h) and total distance while ignoring noise under 3 meters.
- **Task Management with Photo Check-In/Out**:
  - Check-in: captures selfie photo, calls `POST /attendance/sign-in` and `PUT /user/tasks/:taskId/status` -> `in-progress`.
  - Check-out: captures selfie, calls `PUT /user/tasks/:taskId/status` -> `completed` and `POST /attendance/sign-out`.
- **Live Location Broadcasting**: Broadcasts coordinates every 10s and on movement via Socket.IO (`location:update`); emits `location:stop` on logout.
- **Support Ticket Dispatch**: Sends in-field emergency or assistance tickets with coordinates.
- **Interactive Map Tab**: Shows site geofence buffer circle and live user position.

---

## Setup & Running

```bash
# 1. Install dependencies
cd expo-app
npm install

# 2. Configure Backend Host in config.js
# If running on Android emulator, use: http://10.0.2.2:5000
# If testing on physical phone, use your machine's LAN IP: e.g. http://192.168.1.50:5000
# If running Expo Web on same machine, use: http://localhost:5000

# 3. Start Expo development server
npx expo start
```

Scan the QR code with the **Expo Go** app on your iOS or Android mobile device!
