import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import LiveMonitor from './components/LiveMonitor';
import AlertCenter from './components/AlertCenter';
import VehicleTracker from './components/VehicleTracker';
import SearchIntelligence from './components/SearchIntelligence';
import WatchlistManager from './components/WatchlistManager';
import CameraNetwork from './components/CameraNetwork';
import CameraLab from './components/CameraLab';
import SystemHealth from './components/SystemHealth';
import AnalyticsIntelligence from './components/AnalyticsIntelligence';
import AdminUsers from './components/AdminUsers';
import AdminSettings from './components/AdminSettings';
import AdminAuditLogs from './components/AdminAuditLogs';
import RestrictedZonesEditor from './components/RestrictedZonesEditor';
import InvestigationModal from './components/InvestigationModal';
import LoginModal from './components/LoginModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('live');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Core Data State
  const [cameras, setCameras] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activePlateForTracking, setActivePlateForTracking] = useState('GJ-01-AB-1234');
  const [prefilledWatchlistPlate, setPrefilledWatchlistPlate] = useState('');
  
  // Real-time Telemetry & Global System State
  const [systemStatus, setSystemStatus] = useState('ONLINE');
  const [aiOnline, setAiOnline] = useState(false);
  const [demoMode, setDemoMode] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);

  // Modals
  const [investigationAlert, setInvestigationAlert] = useState(null);
  const [zonesEditorCamera, setZonesEditorCamera] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Authenticated User & RBAC
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('netra_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      id: 'USR-ADM-001',
      username: 'admin',
      role: 'admin',
      name: 'Chief Administrator'
    };
  });

  const socketRef = useRef(null);

  // Web Audio API Synthesized Alert Sound
  const playAlertChime = (severity = 'high') => {
    if (!audioEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = severity === 'critical' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(severity === 'critical' ? 880 : 587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(severity === 'critical' ? 440 : 880, audioCtx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  // Initial Fetch & WebSocket Initialization
  useEffect(() => {
    fetchInitialData();

    const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[NETRA] Connected to Telemetry Bus');
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[NETRA] Disconnected from Telemetry Bus');
      setSocketConnected(false);
    });

    // Real-Time Incoming Alert
    socket.on('netra_alert', (newAlert) => {
      console.log('[NETRA ALERT RECEIVED]', newAlert);
      setAlerts(prev => [newAlert, ...prev]);
      playAlertChime(newAlert.severity);

      setRecentNotifications(prev => [
        {
          title: `ALERT: ${newAlert.type}`,
          message: `${newAlert.camera_location} - Plate: ${newAlert.plate || 'Perimeter'}`,
          time: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 8)
      ]);
    });

    // Real-Time Camera Status Change
    socket.on('netra_cam_status', (data) => {
      if (data.type === 'STATUS_CHANGE') {
        setCameras(prev => prev.map(c => 
          c.id === data.camera_id ? { ...c, status: data.status, error_message: data.error_message } : c
        ));
      }
    });

    // AI Status Update
    socket.on('netra_ai_status', (data) => {
      setAiOnline(data.ai_online);
    });

    return () => {
      socket.disconnect();
    };
  }, [audioEnabled]);

  const fetchInitialData = async () => {
    try {
      const [camResp, alertResp, healthResp, settingsResp] = await Promise.all([
        axios.get('/api/v1/cameras'),
        axios.get('/api/v1/alerts?limit=50'),
        axios.get('/api/v1/health'),
        axios.get('/api/v1/settings')
      ]);

      if (camResp.data && camResp.data.data) setCameras(camResp.data.data);
      if (alertResp.data && alertResp.data.data) setAlerts(alertResp.data.data);
      if (healthResp.data) {
        setSystemStatus(healthResp.data.status);
        setAiOnline(healthResp.data.components?.ai_processing?.status === 'ONLINE');
      }
      if (settingsResp.data && settingsResp.data.data) {
        setDemoMode(settingsResp.data.data.demo_mode === 'true');
      }
    } catch (e) {
      console.error('[NETRA] Error loading initial telemetry:', e);
    }
  };

  // Toggle Demo Mode
  const handleToggleDemoMode = async () => {
    const nextMode = !demoMode;
    setDemoMode(nextMode);
    try {
      await axios.put('/api/v1/settings', { demo_mode: nextMode ? 'true' : 'false' });
    } catch (e) {}
  };

  // Acknowledge Single Alert
  const handleAcknowledgeAlert = async (id, operator_notes) => {
    try {
      await axios.post(`/api/v1/alerts/${id}/ack`, { operator_notes });
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: 1, acknowledged_by: currentUser.name } : a));
    } catch (e) {}
  };

  // Bulk Acknowledge
  const handleBulkAcknowledge = async (alertIds, operator_notes) => {
    try {
      await axios.post('/api/v1/alerts/bulk-ack', { alertIds, operator_notes });
      setAlerts(prev => prev.map(a => alertIds.includes(a.id) ? { ...a, acknowledged: 1, acknowledged_by: currentUser.name } : a));
    } catch (e) {}
  };

  // Role Switcher for seamless demo
  const handleSwitchRole = (newRole) => {
    const rolesMap = {
      admin: { id: 'USR-ADM-001', username: 'admin', role: 'admin', name: 'Chief Administrator' },
      operator: { id: 'USR-OPR-002', username: 'operator', role: 'operator', name: 'Surveillance Operator Desk 1' },
      auditor: { id: 'USR-AUD-003', username: 'auditor', role: 'auditor', name: 'Vigilance & Oversight Officer' }
    };
    const updated = rolesMap[newRole] || rolesMap.admin;
    setCurrentUser(updated);
    localStorage.setItem('netra_user', JSON.stringify(updated));
  };

  // Navigation Jump Handlers
  const handleSelectPlateForTracking = (plate) => {
    setActivePlateForTracking(plate);
    setActiveTab('tracker');
  };

  const handleAddPlateToWatchlist = (plate) => {
    setPrefilledWatchlistPlate(plate);
    setActiveTab('watchlist');
  };

  const handleTriggerCameraAlert = async (cameraId) => {
    try {
      await axios.post(`/api/v1/cameras/${cameraId}/trigger-demo-event`);
    } catch (e) {
      console.error('Trigger alert error:', e);
    }
  };

  // Stats calculation
  const activeCamerasCount = cameras.filter(c => c.status === 'ONLINE').length;
  const activeThreatsCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-base)' }}>
      {/* Persistent Left Command Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        unacknowledgedAlertsCount={activeThreatsCount}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Command Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Command Bar */}
        <TopBar
          stats={{
            activeCameras: activeCamerasCount,
            totalCameras: cameras.length,
            activeThreats: activeThreatsCount
          }}
          systemStatus={systemStatus}
          aiOnline={aiOnline}
          demoMode={demoMode}
          onToggleDemoMode={handleToggleDemoMode}
          audioEnabled={audioEnabled}
          onToggleAudio={() => setAudioEnabled(!audioEnabled)}
          currentUser={currentUser}
          onSwitchRole={handleSwitchRole}
          onOpenLogin={() => setShowLoginModal(true)}
          onLogout={() => {
            localStorage.removeItem('netra_token');
            handleSwitchRole('operator');
          }}
          onSelectTab={setActiveTab}
          recentNotifications={recentNotifications}
        />

        {/* Tab View Router */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'live' && (
            <LiveMonitor
              cameras={cameras}
              alerts={alerts}
              aiOnline={aiOnline}
              demoMode={demoMode}
              onSelectPlateForTracking={handleSelectPlateForTracking}
              onOpenAlertDossier={(alert) => setInvestigationAlert(alert)}
              onTriggerCameraAlert={handleTriggerCameraAlert}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertCenter
              alerts={alerts}
              onAcknowledge={handleAcknowledgeAlert}
              onBulkAcknowledge={handleBulkAcknowledge}
              onSelectPlateForTracking={handleSelectPlateForTracking}
              onOpenInvestigation={(alert) => setInvestigationAlert(alert)}
            />
          )}

          {activeTab === 'tracker' && (
            <VehicleTracker
              activePlate={activePlateForTracking}
              onSelectPlate={setActivePlateForTracking}
              onOpenInvestigation={(alert) => setInvestigationAlert(alert)}
            />
          )}

          {activeTab === 'search' && (
            <SearchIntelligence
              cameras={cameras}
              onSelectPlateForTracking={handleSelectPlateForTracking}
              onOpenInvestigation={(alert) => setInvestigationAlert(alert)}
              onAddPlateToWatchlist={handleAddPlateToWatchlist}
            />
          )}

          {activeTab === 'watchlist' && (
            <WatchlistManager
              onSelectPlateForTracking={handleSelectPlateForTracking}
              prefilledPlate={prefilledWatchlistPlate}
              onClearPrefill={() => setPrefilledWatchlistPlate('')}
            />
          )}

          {activeTab === 'cameras' && (
            <CameraNetwork
              cameras={cameras}
              onRefreshCameras={fetchInitialData}
              onOpenZonesEditor={(cam) => setZonesEditorCamera(cam)}
            />
          )}

          {activeTab === 'lab' && (
            <CameraLab cameras={cameras} />
          )}

          {activeTab === 'health' && (
            <SystemHealth />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsIntelligence />
          )}

          {activeTab === 'users' && (
            <AdminUsers currentUser={currentUser} />
          )}

          {activeTab === 'settings' && (
            <AdminSettings onSettingsUpdated={() => fetchInitialData()} />
          )}

          {activeTab === 'audit' && (
            <AdminAuditLogs />
          )}
        </main>
      </div>

      {/* Global Forensic Investigation Modal */}
      {investigationAlert && (
        <InvestigationModal
          alert={investigationAlert}
          onClose={() => setInvestigationAlert(null)}
          onSelectPlateForTracking={handleSelectPlateForTracking}
          onAddPlateToWatchlist={handleAddPlateToWatchlist}
          onAcknowledge={handleAcknowledgeAlert}
        />
      )}

      {/* Restricted Zones Geofence Drawer / Modal */}
      {zonesEditorCamera && (
        <RestrictedZonesEditor
          camera={zonesEditorCamera}
          onClose={() => setZonesEditorCamera(null)}
          onZoneSaved={() => fetchInitialData()}
        />
      )}

      {/* Account Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setShowLoginModal(false);
        }}
      />
    </div>
  );
}
