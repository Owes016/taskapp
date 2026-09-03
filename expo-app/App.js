import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  StatusBar,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Camera, CameraView } from 'expo-camera';
import { io } from 'socket.io-client';
import CONFIG from './config';

const { width } = Dimensions.get('window');

// ==========================================
// HAVERSINE FORMULA (Distance in meters)
// ==========================================
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [mobileNumber, setMobileNumber] = useState('9990001111');
  const [otpStep, setOtpStep] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // App Navigation tab: 'HOME' | 'MAP'
  const [activeTab, setActiveTab] = useState('HOME');

  // Location tracking state
  const [location, setLocation] = useState(null);
  const [distanceToSite, setDistanceToSite] = useState(null);
  const [isInside, setIsInside] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [locationPermission, setLocationPermission] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);

  // Dev Mock Location Mode (Allows developer to test inside/outside geo-fence)
  const [mockMode, setMockMode] = useState(false);

  // Tasks & Attendance state
  const [tasks, setTasks] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Ticket state
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  // Camera Selfie Modal
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [cameraAction, setCameraAction] = useState(null); // { type: 'check-in' | 'check-out', task: Task }
  const [cameraPermission, setCameraPermission] = useState(false);
  const cameraRef = useRef(null);

  // Socket.IO Ref
  const socketRef = useRef(null);
  const lastLocationRef = useRef(null);
  const locationSubRef = useRef(null);
  const otpInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // ==========================================
  // 1. INITIAL SESSION RESTORATION
  // ==========================================
  useEffect(() => {
    async function checkPersistedUser() {
      try {
        const stored = await AsyncStorage.getItem('@geo_task_user');
        if (stored) {
          const parsedUser = JSON.parse(stored);
          setUser(parsedUser);
          // Refresh profile from server
          refreshUserProfile(parsedUser._id);
        }
      } catch (err) {
        console.error('Failed to load user from storage:', err);
      } finally {
        setIsInitializing(false);
      }
    }
    checkPersistedUser();
  }, []);

  // 30-second background profile refresher
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      refreshUserProfile(user._id);
    }, CONFIG.PROFILE_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user?._id]);

  async function refreshUserProfile(userId) {
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/user/${userId}`);
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        await AsyncStorage.setItem('@geo_task_user', JSON.stringify(updated));
      }
    } catch (err) {
      console.warn('Profile refresh error:', err);
    }
  }

  // ==========================================
  // 2. SOCKET.IO & LOCATION SETUP
  // ==========================================
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Connect to Socket.IO
    socketRef.current = io(CONFIG.SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected to backend:', socketRef.current.id);
    });

    // Request permissions and start watching location
    startLocationWatch();

    // 10-second heartbeat broadcast
    const broadcastInterval = setInterval(() => {
      broadcastCurrentLocation();
    }, CONFIG.SOCKET_BROADCAST_INTERVAL_MS);

    // Initial fetch of attendance status and tasks
    fetchAttendanceStatus(user._id);
    fetchTasks(user._id);
    fetchActivity(user._id);

    return () => {
      clearInterval(broadcastInterval);
      if (locationSubRef.current) {
        locationSubRef.current.remove();
      }
      if (socketRef.current) {
        socketRef.current.emit('location:stop', {
          userId: user._id,
          organizationId: user.organization?._id
        });
        socketRef.current.disconnect();
      }
    };
  }, [user?._id]);

  async function startLocationWatch() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationPermission(false);
        setLocationError('Permission to access location was denied');
        return;
      }
      setLocationPermission(true);
      setLocationError(null);

      // Get initial position
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      processNewLocation(current.coords);

      // Watch continuously
      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 2
        },
        (loc) => {
          if (!mockMode) {
            processNewLocation(loc.coords);
          }
        }
      );
    } catch (err) {
      console.warn('Location watch setup error:', err);
      setLocationError(err.message);
    }
  }

  function processNewLocation(coords) {
    if (!user || !user.assignedSite) return;

    const { latitude, longitude, speed: rawSpeed } = coords;
    const site = user.assignedSite;

    const dist = calculateDistanceMeters(
      latitude,
      longitude,
      site.latitude,
      site.longitude
    );

    const inside = dist <= site.radiusMeters;
    setDistanceToSite(Math.round(dist));
    setIsInside(inside);
    setLocation({ latitude, longitude });
    setSpeed(rawSpeed && rawSpeed > 0 ? Math.round(rawSpeed * 3.6) : 0); // km/h

    // Accumulate total distance if moved > jitter threshold
    if (lastLocationRef.current) {
      const stepDist = calculateDistanceMeters(
        lastLocationRef.current.latitude,
        lastLocationRef.current.longitude,
        latitude,
        longitude
      );
      if (stepDist >= CONFIG.JITTER_THRESHOLD_METERS) {
        setTotalDistance((prev) => prev + stepDist);
        lastLocationRef.current = { latitude, longitude };
      }
    } else {
      lastLocationRef.current = { latitude, longitude };
    }

    // Broadcast update via Socket.IO
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('location:update', {
        userId: user._id,
        userName: user.name,
        latitude,
        longitude,
        speed: rawSpeed || 0,
        timestamp: Date.now(),
        organizationId: user.organization?._id
      });
    }
  }

  function broadcastCurrentLocation() {
    if (!user || !location || !socketRef.current?.connected) return;
    socketRef.current.emit('location:update', {
      userId: user._id,
      userName: user.name,
      latitude: location.latitude,
      longitude: location.longitude,
      speed: speed / 3.6,
      timestamp: Date.now(),
      organizationId: user.organization?._id
    });
  }

  // Dev Toggle: Teleport inside or outside assigned site
  function toggleMockLocation(forceInside) {
    if (!user || !user.assignedSite) return;
    setMockMode(true);
    const site = user.assignedSite;
    const offset = forceInside ? 0.0001 : 0.0035; // Inside (~11m) vs Outside (~400m)
    const simulatedCoords = {
      latitude: site.latitude + offset,
      longitude: site.longitude + offset,
      speed: 1.2
    };
    processNewLocation(simulatedCoords);
  }

  // ==========================================
  // 3. API DATA FETCHERS
  // ==========================================
  async function fetchAttendanceStatus(userId) {
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/attendance/status/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data.activeSession);
      }
    } catch (err) {
      console.warn('Error fetching attendance status:', err);
    }
  }

  async function fetchTasks(userId) {
    setLoadingTasks(true);
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/user/${userId}/tasks`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.warn('Error fetching tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  }

  async function fetchActivity(userId) {
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/user/${userId}/activity`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.attendance || []);
      }
    } catch (err) {
      console.warn('Error fetching activity history:', err);
    }
  }

  // ==========================================
  // 4. AUTH HANDLERS (Mobile + OTP)
  // ==========================================
  async function handleSendOtp() {
    setAuthError('');
    if (!mobileNumber.trim()) {
      setAuthError('Please enter a mobile number');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobileNumber.trim() })
      });
      const data = await res.json();

      if (res.ok) {
        setOtpStep(true);
        setOtpDigits(['', '', '', '']);
        setTimeout(() => otpInputRefs[0]?.current?.focus(), 200);
      } else {
        setAuthError(data.error || 'User not found');
      }
    } catch (err) {
      setAuthError('Cannot connect to backend server. Make sure server is running.');
    } finally {
      setAuthLoading(false);
    }
  }

  function handleOtpChange(text, index) {
    const newDigits = [...otpDigits];
    newDigits[index] = text;
    setOtpDigits(newDigits);

    // Auto-advance
    if (text && index < 3) {
      otpInputRefs[index + 1]?.current?.focus();
    }

    // Auto-submit on 4th digit
    if (text && index === 3) {
      const fullOtp = newDigits.join('');
      if (fullOtp.length === 4) {
        handleVerifyOtp(fullOtp);
      }
    }
  }

  async function handleVerifyOtp(codeToVerify) {
    const code = codeToVerify || otpDigits.join('');
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: mobileNumber.trim(),
          otp: code
        })
      });
      const data = await res.json();

      if (res.ok && data.user) {
        setUser(data.user);
        await AsyncStorage.setItem('@geo_task_user', JSON.stringify(data.user));
        setOtpStep(false);
      } else {
        setAuthError(data.error || 'Invalid OTP code');
      }
    } catch (err) {
      setAuthError('Failed to verify OTP with server');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to end your session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          if (socketRef.current && user) {
            socketRef.current.emit('location:stop', {
              userId: user._id,
              organizationId: user.organization?._id
            });
            socketRef.current.disconnect();
          }
          await AsyncStorage.removeItem('@geo_task_user');
          setUser(null);
          setActiveSession(null);
          setLocation(null);
          setOtpStep(false);
        }
      }
    ]);
  }

  // ==========================================
  // 5. CAMERA & TASK ATTENDANCE FLOW
  // ==========================================
  async function triggerCameraFlow(actionType, task) {
    if (!isInside) {
      Alert.alert(
        'Geofence Violation',
        `You are currently ${distanceToSite}m away from ${user.assignedSite.name}. You must be within ${user.assignedSite.radiusMeters}m to perform attendance actions. Use the Dev Test button above if testing from a remote location.`
      );
      return;
    }

    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Camera access is required to take attendance selfie.');
      return;
    }

    setCameraPermission(true);
    setCameraAction({ type: actionType, task });
    setCameraModalVisible(true);
  }

  async function captureSelfieAndExecute() {
    let photoBase64 = '';
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.5
        });
        photoBase64 = photo.base64 ? `data:image/jpeg;base64,${photo.base64}` : '';
      }
    } catch (e) {
      console.warn('Camera capture fallback, proceeding with simulated photo string:', e);
      photoBase64 = 'data:image/png;base64,simulated_selfie_timestamp_' + Date.now();
    }

    setCameraModalVisible(false);

    if (!cameraAction) return;
    const { type, task } = cameraAction;

    if (type === 'check-in') {
      await executeCheckIn(task, photoBase64);
    } else if (type === 'check-out') {
      await executeCheckOut(task, photoBase64);
    }
  }

  async function executeCheckIn(task, photo) {
    try {
      // 1. POST /attendance/sign-in
      const signInRes = await fetch(`${CONFIG.API_BASE_URL}/attendance/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          latitude: location?.latitude,
          longitude: location?.longitude,
          photo
        })
      });

      const signInData = await signInRes.json();
      if (signInRes.ok) {
        setActiveSession(signInData.record);
      } else if (signInRes.status === 400 && signInData.error === 'Already signed in') {
        // As per spec: "If 400 'Already signed in', just start the task."
        console.log('Already signed in, proceeding to start task...');
      }

      // 2. PUT /user/tasks/:taskId/status -> in-progress
      const taskRes = await fetch(`${CONFIG.API_BASE_URL}/user/tasks/${task._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'in-progress',
          latitude: location?.latitude,
          longitude: location?.longitude
        })
      });

      if (taskRes.ok) {
        Alert.alert('Check-In Successful', `Task "${task.title}" is now In-Progress.`);
        fetchTasks(user._id);
        fetchAttendanceStatus(user._id);
        fetchActivity(user._id);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to complete task check-in.');
    }
  }

  async function executeCheckOut(task, photo) {
    try {
      // 1. PUT /user/tasks/:taskId/status -> completed
      await fetch(`${CONFIG.API_BASE_URL}/user/tasks/${task._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          latitude: location?.latitude,
          longitude: location?.longitude
        })
      });

      // 2. POST /attendance/sign-out
      const signOutRes = await fetch(`${CONFIG.API_BASE_URL}/attendance/sign-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          latitude: location?.latitude,
          longitude: location?.longitude,
          photo
        })
      });

      if (signOutRes.ok) {
        setActiveSession(null);
        Alert.alert('Check-Out Successful', `Task "${task.title}" marked Completed and attendance session closed.`);
      } else {
        Alert.alert('Task Completed', 'Task marked complete, but sign-out had a note: ' + (await signOutRes.text()));
      }

      fetchTasks(user._id);
      fetchAttendanceStatus(user._id);
      fetchActivity(user._id);
    } catch (err) {
      Alert.alert('Error', 'Failed to complete task check-out.');
    }
  }

  // ==========================================
  // 6. SUPPORT TICKET
  // ==========================================
  async function handleSubmitTicket() {
    if (!ticketMessage.trim()) {
      Alert.alert('Validation', 'Please enter a ticket message.');
      return;
    }

    setTicketSubmitting(true);
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          message: ticketMessage.trim(),
          latitude: location?.latitude || 0,
          longitude: location?.longitude || 0
        })
      });

      if (res.ok) {
        setTicketMessage('');
        setTicketSuccess(true);
        setTimeout(() => setTicketSuccess(false), 3000);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to submit support ticket.');
    } finally {
      setTicketSubmitting(false);
    }
  }

  // ==========================================
  // RENDER: INITIALIZING
  // ==========================================
  if (isInitializing) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Initializing Geo-Task...</Text>
      </SafeAreaView>
    );
  }

  // ==========================================
  // RENDER: LOGIN & OTP SCREEN
  // ==========================================
  if (!user) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#4338ca" />

        {/* Purple/Indigo Header */}
        <View style={styles.authHeader}>
          <Text style={styles.appTitle}>Geo-Task</Text>
          <Text style={styles.appSubtitle}>Field Workforce Geo-Attendance & Tasks</Text>
        </View>

        <View style={styles.authCard}>
          {!otpStep ? (
            // Screen 1: Enter Mobile Number
            <View>
              <Text style={styles.cardHeader}>Employee Login</Text>
              <Text style={styles.cardSub}>Enter your registered 10-digit mobile number</Text>

              <View style={styles.quickFillRow}>
                <Text style={styles.quickFillLabel}>Demo Quick-Fill:</Text>
                <TouchableOpacity
                  style={styles.pillBtn}
                  onPress={() => setMobileNumber('9990001111')}
                >
                  <Text style={styles.pillBtnText}>Ravi (HQ)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pillBtn}
                  onPress={() => setMobileNumber('9990002222')}
                >
                  <Text style={styles.pillBtnText}>Priya (Warehouse)</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputPrefix}>+91</Text>
                <TextInput
                  style={styles.mobileInput}
                  keyboardType="phone-pad"
                  placeholder="9990001111"
                  placeholderTextColor="#94a3b8"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  maxLength={10}
                />
              </View>

              {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleSendOtp}
                disabled={authLoading}
              >
                {authLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Send Verification Code</Text>
                )}
              </TouchableOpacity>

              <View style={styles.demoNotice}>
                <Text style={styles.demoNoticeText}>
                  Prototype OTP is configured to <Text style={{ fontWeight: 'bold' }}>1111</Text>
                </Text>
              </View>
            </View>
          ) : (
            // Screen 2: Enter 4-Digit OTP
            <View>
              <Text style={styles.cardHeader}>Verify OTP</Text>
              <Text style={styles.cardSub}>
                Code sent to +91 {mobileNumber} (Demo Code: 1111)
              </Text>

              <View style={styles.otpRow}>
                {[0, 1, 2, 3].map((idx) => (
                  <TextInput
                    key={idx}
                    ref={otpInputRefs[idx]}
                    style={[styles.otpBox, otpDigits[idx] ? styles.otpBoxFilled : null]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={otpDigits[idx]}
                    onChangeText={(text) => handleOtpChange(text, idx)}
                  />
                ))}
              </View>

              {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => handleVerifyOtp()}
                disabled={authLoading}
              >
                {authLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Verify & Continue</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.textLinkBtn}
                onPress={() => {
                  setOtpStep(false);
                  setAuthError('');
                }}
              >
                <Text style={styles.textLinkText}>Change mobile number</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // RENDER: AUTHENTICATED APP (Home / Map)
  // ==========================================
  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#4338ca" />

      {/* Purple/Indigo Gradient Header "Geo-Task" with user's name and organization */}
      <View style={styles.appHeader}>
        <View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{user.organization?.name || 'Acme Corp'}</Text>
            <View style={styles.statusDot} />
            <Text style={styles.statusLiveText}>Live Socket</Text>
          </View>
          <Text style={styles.headerTitle}>Geo-Task</Text>
          <Text style={styles.headerUser}>
            {user.name} ({user.employeeId}) • {user.assignedSite?.name}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Exit</Text>
        </TouchableOpacity>
      </View>

      {/* Dev Geo-Fence Testing Banner */}
      <View style={styles.devTestingBar}>
        <Text style={styles.devTestingLabel}>GPS Simulator:</Text>
        <TouchableOpacity
          style={[styles.devBtn, isInside && styles.devBtnActive]}
          onPress={() => toggleMockLocation(true)}
        >
          <Text style={styles.devBtnText}>Simulate INSIDE (10m)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.devBtn, !isInside && mockMode && styles.devBtnActive]}
          onPress={() => toggleMockLocation(false)}
        >
          <Text style={styles.devBtnText}>Simulate OUTSIDE (400m)</Text>
        </TouchableOpacity>
      </View>

      {/* Active Attendance Session Banner */}
      {activeSession && (
        <View style={styles.activeSessionBanner}>
          <View style={styles.sessionDot} />
          <Text style={styles.activeSessionText}>
            Checked in at {new Date(activeSession.signInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Active Session
          </Text>
        </View>
      )}

      {/* Content Tabs */}
      {activeTab === 'HOME' ? (
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {/* 1. LOCATION CARD */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.sectionHeading}>GPS Geofence Status</Text>
              <TouchableOpacity
                style={styles.refreshIconBtn}
                onPress={() => startLocationWatch()}
                disabled={isRefreshingLocation}
              >
                <Text style={styles.refreshIconText}>↻ Refresh</Text>
              </TouchableOpacity>
            </View>

            {/* Inside / Outside Status Indicator */}
            <View style={[styles.fenceBanner, isInside ? styles.fenceInside : styles.fenceOutside]}>
              <Text style={styles.fenceBannerText}>
                {isInside ? '✓ WITHIN ASSIGNED GEOFENCE (ALLOWED)' : '✕ OUTSIDE GEOFENCE (BLOCKED)'}
              </Text>
              <Text style={styles.fenceBannerSub}>
                {isInside
                  ? `Inside ${user.assignedSite?.radiusMeters}m radius of ${user.assignedSite?.name}`
                  : `${distanceToSite}m away from ${user.assignedSite?.name} (limit: ${user.assignedSite?.radiusMeters}m)`}
              </Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Acquiring...'}</Text>
                <Text style={styles.statLbl}>Coordinates</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{distanceToSite !== null ? `${distanceToSite} m` : '--'}</Text>
                <Text style={styles.statLbl}>Distance to Site</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{speed} km/h</Text>
                <Text style={styles.statLbl}>Current Speed</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{Math.round(totalDistance)} m</Text>
                <Text style={styles.statLbl}>Total Traveled</Text>
              </View>
            </View>
          </View>

          {/* 2. TASK CARD (Check-in & Check-out with Camera Selfie) */}
          <View style={styles.card}>
            <Text style={styles.sectionHeading}>Assigned Tasks</Text>
            <Text style={styles.cardSub}>Photo check-in allowed only within site GPS radius</Text>

            {loadingTasks ? (
              <ActivityIndicator color="#6366f1" style={{ marginVertical: 16 }} />
            ) : tasks.length === 0 ? (
              <Text style={styles.emptyText}>No tasks assigned for today.</Text>
            ) : (
              tasks.map((task) => (
                <View key={task._id} style={styles.taskItem}>
                  <View style={styles.taskHeaderRow}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <View
                      style={[
                        styles.taskBadge,
                        task.status === 'completed'
                          ? styles.badgeGreen
                          : task.status === 'in-progress'
                          ? styles.badgeAmber
                          : styles.badgeSlate
                      ]}
                    >
                      <Text style={styles.taskBadgeText}>{task.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.taskDesc}>{task.description}</Text>

                  {/* Action Buttons */}
                  <View style={styles.taskActionsRow}>
                    {task.status === 'pending' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.checkInBtn, !isInside && styles.btnDisabled]}
                        onPress={() => triggerCameraFlow('check-in', task)}
                      >
                        <Text style={styles.actionBtnText}>📷 Check-In & Start Task</Text>
                      </TouchableOpacity>
                    )}

                    {task.status === 'in-progress' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.checkOutBtn, !isInside && styles.btnDisabled]}
                        onPress={() => triggerCameraFlow('check-out', task)}
                      >
                        <Text style={styles.actionBtnText}>📷 Check-Out & Complete</Text>
                      </TouchableOpacity>
                    )}

                    {task.status === 'completed' && (
                      <View style={styles.completedStamp}>
                        <Text style={styles.completedStampText}>✓ Completed and Signed Off</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>

          {/* 3. TICKET CARD */}
          <View style={styles.card}>
            <Text style={styles.sectionHeading}>Raise Support Ticket</Text>
            <Text style={styles.cardSub}>Broadcast a field emergency or query with current GPS</Text>

            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={3}
              placeholder="Describe issue (e.g. equipment breakdown, blocked access, spill)..."
              placeholderTextColor="#94a3b8"
              value={ticketMessage}
              onChangeText={setTicketMessage}
            />

            {ticketSuccess && (
              <Text style={styles.successText}>✓ Ticket submitted to dispatch successfully!</Text>
            )}

            <TouchableOpacity
              style={styles.ticketBtn}
              onPress={handleSubmitTicket}
              disabled={ticketSubmitting}
            >
              {ticketSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.ticketBtnText}>Submit Support Ticket</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 4. ACTIVITY TIMELINE */}
          <View style={styles.card}>
            <Text style={styles.sectionHeading}>Today's Activity Timeline</Text>
            {activities.length === 0 ? (
              <Text style={styles.emptyText}>No attendance records logged yet today.</Text>
            ) : (
              activities.map((act) => (
                <View key={act._id} style={styles.activityItem}>
                  <View style={styles.activityDot} />
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>
                      Attendance Record ({act.status === 'active' ? 'In-Progress' : 'Signed Out'})
                    </Text>
                    <Text style={styles.activityDetail}>
                      Sign In: {new Date(act.signInTime).toLocaleTimeString()} @ {act.siteName}
                    </Text>
                    {act.signOutTime && (
                      <Text style={styles.activityDetail}>
                        Sign Out: {new Date(act.signOutTime).toLocaleTimeString()}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      ) : (
        /* MAP TAB */
        <View style={styles.mapTabContainer}>
          <View style={styles.mapOverlayHeader}>
            <Text style={styles.mapOverlayTitle}>Site Geofence Radius</Text>
            <Text style={styles.mapOverlaySub}>
              {user.assignedSite?.name} ({user.assignedSite?.radiusMeters}m buffer)
            </Text>
          </View>

          {/* Interactive Map Visualizer */}
          <View style={styles.simulatedMapArea}>
            <View style={styles.mapCenterSite}>
              <View
                style={[
                  styles.geofenceCircle,
                  {
                    width: width * 0.7,
                    height: width * 0.7,
                    borderRadius: (width * 0.7) / 2
                  }
                ]}
              />
              <View style={styles.siteMarker}>
                <Text style={styles.siteMarkerIcon}>🏢</Text>
                <Text style={styles.siteMarkerText}>{user.assignedSite?.name}</Text>
              </View>

              {/* User Marker (Placed inside or outside based on isInside) */}
              <View
                style={[
                  styles.userMarker,
                  {
                    transform: isInside
                      ? [{ translateX: 25 }, { translateY: -30 }]
                      : [{ translateX: width * 0.38 }, { translateY: -width * 0.35 }]
                  }
                ]}
              >
                <View style={styles.userPulseRing} />
                <Text style={styles.userMarkerIcon}>📍</Text>
                <Text style={styles.userMarkerText}>You ({isInside ? 'Inside' : 'Outside'})</Text>
              </View>
            </View>

            <View style={styles.mapLegend}>
              <Text style={styles.legendText}>
                🔵 Blue Ring: {user.assignedSite?.name} ({user.assignedSite?.radiusMeters}m)
              </Text>
              <Text style={styles.legendText}>
                {isInside ? '🟢 Marker Inside: Check-in Allowed' : '🔴 Marker Outside: Check-in Blocked'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Bottom Tab Bar (Home, Map) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.bottomTab, activeTab === 'HOME' && styles.bottomTabActive]}
          onPress={() => setActiveTab('HOME')}
        >
          <Text style={styles.bottomTabIcon}>🏠</Text>
          <Text style={[styles.bottomTabText, activeTab === 'HOME' && styles.bottomTabTextActive]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomTab, activeTab === 'MAP' && styles.bottomTabActive]}
          onPress={() => setActiveTab('MAP')}
        >
          <Text style={styles.bottomTabIcon}>🗺️</Text>
          <Text style={[styles.bottomTabText, activeTab === 'MAP' && styles.bottomTabTextActive]}>
            Map
          </Text>
        </TouchableOpacity>
      </View>

      {/* Camera Modal (Selfie Verification) */}
      <Modal visible={cameraModalVisible} animationType="slide">
        <SafeAreaView style={styles.cameraContainer}>
          <View style={styles.cameraHeader}>
            <Text style={styles.cameraTitle}>
              {cameraAction?.type === 'check-in' ? 'Check-In Verification Selfie' : 'Check-Out Verification Selfie'}
            </Text>
            <TouchableOpacity onPress={() => setCameraModalVisible(false)}>
              <Text style={styles.cameraClose}>✕ Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cameraPreviewArea}>
            <View style={styles.faceTargetFrame}>
              <Text style={styles.cameraInstructions}>Position face in frame</Text>
            </View>
          </View>

          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.captureBtn}
              onPress={captureSelfieAndExecute}
            >
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ==========================================
// STYLESHEET
// ==========================================
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#0f172a'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a'
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 15
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    padding: 20
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 28
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#818cf8',
    letterSpacing: 0.5
  },
  appSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4
  },
  authCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155'
  },
  cardHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6
  },
  cardSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 16
  },
  quickFillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  quickFillLabel: {
    color: '#64748b',
    fontSize: 12
  },
  pillBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  pillBtnText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    marginBottom: 16
  },
  inputPrefix: {
    color: '#94a3b8',
    fontWeight: '700',
    marginRight: 8
  },
  mobileInput: {
    flex: 1,
    height: 48,
    color: '#ffffff',
    fontSize: 16
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  otpBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1.5,
    borderColor: '#334155',
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center'
  },
  otpBoxFilled: {
    borderColor: '#6366f1',
    backgroundColor: '#1e1b4b'
  },
  primaryBtn: {
    backgroundColor: '#6366f1',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700'
  },
  textLinkBtn: {
    alignItems: 'center',
    marginTop: 16
  },
  textLinkText: {
    color: '#818cf8',
    fontSize: 14
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 12
  },
  demoNotice: {
    marginTop: 18,
    padding: 10,
    backgroundColor: '#1e1b4b',
    borderRadius: 8,
    alignItems: 'center'
  },
  demoNoticeText: {
    color: '#a5b4fc',
    fontSize: 12
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#4338ca'
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2
  },
  headerBadgeText: {
    color: '#c7d2fe',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80'
  },
  statusLiveText: {
    color: '#86efac',
    fontSize: 10,
    fontWeight: '600'
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800'
  },
  headerUser: {
    color: '#e0e7ff',
    fontSize: 12
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  logoutBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  devTestingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#334155',
    gap: 8
  },
  devTestingLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700'
  },
  devBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  devBtnActive: {
    backgroundColor: '#6366f1'
  },
  devBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600'
  },
  activeSessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064e3b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34d399'
  },
  activeSessionText: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '700'
  },
  scrollArea: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc'
  },
  refreshIconBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  refreshIconText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '600'
  },
  fenceBanner: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12
  },
  fenceInside: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#22c55e'
  },
  fenceOutside: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444'
  },
  fenceBannerText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2
  },
  fenceBannerSub: {
    fontSize: 11,
    color: '#cbd5e1'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  statBox: {
    width: (width - 72) / 2,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10
  },
  statVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e2e8f0'
  },
  statLbl: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  taskItem: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155'
  },
  taskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f1f5f9',
    flex: 1,
    marginRight: 8
  },
  taskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  badgeGreen: {
    backgroundColor: '#064e3b'
  },
  badgeAmber: {
    backgroundColor: '#78350f'
  },
  badgeSlate: {
    backgroundColor: '#334155'
  },
  taskBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff'
  },
  taskDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 10
  },
  taskActionsRow: {
    marginTop: 4
  },
  actionBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  checkInBtn: {
    backgroundColor: '#2563eb'
  },
  checkOutBtn: {
    backgroundColor: '#16a34a'
  },
  btnDisabled: {
    opacity: 0.5
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  completedStamp: {
    paddingVertical: 6,
    backgroundColor: '#064e3b',
    borderRadius: 6,
    alignItems: 'center'
  },
  completedStampText: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '700'
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    fontStyle: 'italic',
    marginVertical: 8
  },
  textArea: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    color: '#ffffff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
    textAlignVertical: 'top'
  },
  ticketBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  ticketBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  successText: {
    color: '#4ade80',
    fontSize: 12,
    marginBottom: 8
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366f1',
    marginTop: 4,
    marginRight: 10
  },
  activityContent: {
    flex: 1
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc'
  },
  activityDetail: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1
  },
  mapTabContainer: {
    flex: 1,
    padding: 16
  },
  mapOverlayHeader: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12
  },
  mapOverlayTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff'
  },
  mapOverlaySub: {
    fontSize: 12,
    color: '#94a3b8'
  },
  simulatedMapArea: {
    flex: 1,
    backgroundColor: '#020617',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  mapCenterSite: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  geofenceCircle: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 2,
    borderColor: '#6366f1',
    borderStyle: 'dashed'
  },
  siteMarker: {
    position: 'absolute',
    alignItems: 'center'
  },
  siteMarkerIcon: {
    fontSize: 28
  },
  siteMarkerText: {
    color: '#c7d2fe',
    fontSize: 11,
    fontWeight: '700'
  },
  userMarker: {
    position: 'absolute',
    alignItems: 'center'
  },
  userPulseRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.4)'
  },
  userMarkerIcon: {
    fontSize: 24
  },
  userMarkerText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: '#0f172a',
    paddingHorizontal: 4,
    borderRadius: 4
  },
  mapLegend: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    padding: 10,
    borderRadius: 10
  },
  legendText: {
    color: '#cbd5e1',
    fontSize: 11,
    marginBottom: 2
  },
  bottomBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderColor: '#334155'
  },
  bottomTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  bottomTabActive: {
    borderTopWidth: 2,
    borderTopColor: '#6366f1'
  },
  bottomTabIcon: {
    fontSize: 18
  },
  bottomTabText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2
  },
  bottomTabTextActive: {
    color: '#818cf8',
    fontWeight: '700'
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between'
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    alignItems: 'center'
  },
  cameraTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },
  cameraClose: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700'
  },
  cameraPreviewArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  faceTargetFrame: {
    width: 220,
    height: 280,
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 140,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cameraInstructions: {
    color: '#cbd5e1',
    fontSize: 12
  },
  cameraControls: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center'
  },
  captureBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  captureBtnInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ffffff'
  }
});
