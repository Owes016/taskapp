# Geo-Task Backend (Node.js + Express + Socket.IO)

A lightweight, self-contained Express server with in-memory mock data and real-time Socket.IO live location tracking. Runs with **no external database or cloud services**.

## Quick Start

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Start server (runs on port 5000 by default)
npm start
```

Base URL: `http://localhost:5000/api`  
Socket.IO URL: `http://localhost:5000`

---

## Seed Users & Mock OTP

| Employee Name | Mobile Number | Employee ID | Assigned Site | Demo OTP |
| :--- | :--- | :--- | :--- | :--- |
| **Ravi Kumar** | `9990001111` | `EMP001` | HQ Office (Delhi, lat: 28.6139, lng: 77.2090, 100m) | `1111` |
| **Priya Shah** | `9990002222` | `EMP002` | Warehouse (Mumbai, lat: 19.0760, lng: 72.8777, 150m) | `1111` |

---

## REST Endpoints

- `POST /api/auth/send-otp` — `{ mobile }` -> returns `{ success: true }` if mobile matches seeded user.
- `POST /api/auth/verify-otp` — `{ mobile, otp }` -> returns `{ user }` if `otp === "1111"`.
- `GET /api/user/:userId` — Returns user profile with assigned site.
- `GET /api/user/:userId/tasks` — Returns tasks assigned to user.
- `GET /api/attendance/status/:userId` — Returns `{ activeSession }` if currently signed in.
- `POST /api/attendance/sign-in` — `{ userId, latitude, longitude, photo }` -> Creates attendance record.
- `POST /api/attendance/sign-out` — `{ userId, latitude, longitude, photo }` -> Closes open session with `signOutTime`.
- `PUT /api/user/tasks/:taskId/status` — `{ status: "in-progress"|"completed", latitude, longitude }`.
- `GET /api/user/:userId/activity?date=YYYY-MM-DD` — Returns attendance + tasks for the day.
- `POST /api/tickets` — `{ userId, message, latitude, longitude }` -> Stores support ticket.

---

## Socket.IO Events

- `location:update` `{ userId, userName, latitude, longitude, speed, timestamp, organizationId }` -> stores and re-broadcasts `employee:location`.
- `location:stop` `{ userId, organizationId }` -> removes live location and broadcasts `employee:offline` `{ userId }`.
