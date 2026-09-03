export const ANDROID_MANIFEST_TEMPLATE = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.geoattend.app">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths"></meta-data>
        </provider>

        <!-- Firebase Cloud Messaging Push Service -->
        <service
            android:name="com.capacitorjs.plugins.pushnotifications.PushNotificationsService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>

        <!-- Default Push Notification Channel Icon & Color -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@mipmap/ic_launcher" />
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_color"
            android:resource="@color/colorPrimary" />
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="geoattend_high_importance_channel" />

    </application>

    <!-- Permissions required for Geo-Attendance & Push -->
    <!-- 1. Internet & Network for MongoDB Sync -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- 2. Precise & Coarse GPS Location for Geofencing -->
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-feature android:name="android.hardware.location.gps" />

    <!-- 3. Camera & Gallery for Facial Check-in Verification -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

    <!-- 4. Push Notifications (Android 13+ Tiramisu) -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

</manifest>`;

export const CAPACITOR_CONFIG_TEMPLATE = `import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.geoattend.app',
  appName: 'GeoAttend',
  webDir: 'dist',
  server: {
    // Android emulator can access your local backend via 10.0.2.2 or your machine IP:
    // url: 'http://10.0.2.2:5000',
    cleartext: true,
    androidScheme: 'https'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#4F46E5',
      sound: 'beep.wav'
    }
  }
};

export default config;`;

export const MONGO_BACKEND_SYNC_TEMPLATE = `// =========================================================================
// Node.js + Express + MongoDB Real-Time Sync & FCM Push Notification Server
// =========================================================================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '15mb' }));

// 1. Initialize Firebase Admin for Push Notifications (FCM)
// Download your serviceAccountKey.json from Firebase Console -> Project Settings -> Service Accounts
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 2. Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:pass@cluster0.mongodb.net/geoattend';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected to Real-time Cluster'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// 3. Define Schemas
const UserSchema = new mongoose.Schema({
  employeeCode: { type: String, unique: true },
  name: String,
  email: String,
  role: String,
  department: String,
  // Stores FCM Tokens across multiple mobile devices:
  fcmTokens: [{ type: String }],
  lastActive: Date
});

const AttendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  employeeCode: String,
  userName: String,
  type: { type: String, enum: ['CHECK_IN', 'CHECK_OUT'] },
  status: { type: String, enum: ['VERIFIED', 'OUT_OF_BOUNDS', 'FLAGGED'] },
  timestamp: { type: Date, default: Date.now },
  latitude: Number,
  longitude: Number,
  accuracy: Number,
  distanceToPerimeter: Number,
  zoneName: String,
  photoUrl: String,
  platform: { type: String, enum: ['android', 'web', 'ios'] },
  deviceModel: String,
  syncedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Attendance = mongoose.model('Attendance', AttendanceSchema);

// 4. API: Register FCM Device Token from Capacitor Mobile App
app.post('/api/push/register-token', async (req, res) => {
  try {
    const { employeeCode, token, platform } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    // Store or update device token in MongoDB
    await User.findOneAndUpdate(
      { employeeCode },
      { $addToSet: { fcmTokens: token }, lastActive: new Date() },
      { upsert: true }
    );

    console.log(\`Device registered for push [\${platform}]: \${token.substring(0, 15)}...\`);
    res.json({ success: true, message: 'Device token synchronized to MongoDB' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. API: Submit Real-Time Attendance Check-in (Web or Android Mobile)
app.post('/api/attendance/check-in', async (req, res) => {
  try {
    const record = new Attendance(req.body);
    await record.save();

    // Trigger Instant FCM Push Notification back to the Employee & Managers
    const user = await User.findOne({ employeeCode: req.body.employeeCode });
    if (user && user.fcmTokens && user.fcmTokens.length > 0) {
      const message = {
        notification: {
          title: 'Attendance Confirmed ✓',
          body: \`\${req.body.type === 'CHECK_IN' ? 'Check-in' : 'Check-out'} recorded at \${req.body.zoneName} (\${req.body.status})\`
        },
        data: {
          attendanceId: record._id.toString(),
          type: 'attendance_confirmed',
          timestamp: new Date().toISOString()
        },
        tokens: user.fcmTokens
      };

      // Send multicast push to user's registered Android devices
      await admin.messaging().sendEachForMulticast(message);
    }

    res.status(201).json({ success: true, record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. API: Dispatch Custom Push Notifications (Broadcast / Geofence Alerts)
app.post('/api/push/dispatch', async (req, res) => {
  try {
    const { title, body, targetRole, type } = req.body;
    
    // Find matching users in MongoDB
    const query = targetRole && targetRole !== 'All' ? { role: targetRole } : {};
    const users = await User.find(query);
    
    const allTokens = users.flatMap(u => u.fcmTokens || []).filter(Boolean);
    if (allTokens.length === 0) {
      return res.json({ success: true, count: 0, message: 'No registered device tokens found' });
    }

    const payload = {
      notification: { title, body },
      data: { type: type || 'admin_broadcast' },
      tokens: allTokens
    };

    const response = await admin.messaging().sendEachForMulticast(payload);
    res.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Real-time Attendance & Push Backend running on port \${PORT}\`);
});`;

export const SENIOR_CONVERSION_STEPS = [
  {
    step: 1,
    title: 'Install Capacitor Dependencies in React Project',
    summary: 'Add the core Capacitor packages and Android native engine to your existing React Vite app.',
    command: 'npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/camera @capacitor/geolocation @capacitor/push-notifications @capacitor/local-notifications @capacitor/preferences',
    notes: 'Capacitor does not alter your existing React source code; it acts as a lightweight native bridge wrapper.'
  },
  {
    step: 2,
    title: 'Initialize Capacitor & Set App Identifiers',
    summary: 'Generate the capacitor.config.ts file with your unique App ID (e.g. com.company.geoattend).',
    command: 'npx cap init "GeoAttend" "com.geoattend.app" --web-dir=dist',
    notes: 'Make sure webDir matches your Vite production output folder (default is "dist").'
  },
  {
    step: 3,
    title: 'Build the React App & Add the Android Native Platform',
    summary: 'Compile the React code with Vite and create the native Android Studio project folder.',
    command: 'npm run build\nnpx cap add android',
    notes: 'This creates an /android directory containing full Gradle scripts, AndroidManifest.xml, and Java/Kotlin entry points.'
  },
  {
    step: 4,
    title: 'Configure Firebase Push Notifications (google-services.json)',
    summary: 'Place the Firebase configuration file inside the native Android folder for FCM messaging.',
    command: 'cp google-services.json android/app/',
    notes: 'Download google-services.json from Firebase Console matching your package name "com.geoattend.app".'
  },
  {
    step: 5,
    title: 'Sync Web Assets to Native Android & Open in Android Studio',
    summary: 'Every time you update your React code, run sync and launch Android Studio to generate the APK.',
    command: 'npm run build\nnpx cap sync\nnpx cap open android',
    notes: 'In Android Studio, click "Build > Build Bundle(s) / APK(s) > Build APK(s)" or plug in an Android phone with USB Debugging enabled.'
  }
];
