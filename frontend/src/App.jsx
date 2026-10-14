import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import LiveMonitoringView from './components/LiveMonitoringView';
import VehiclesView from './components/VehiclesView';
import EventsView from './components/EventsView';
import AnalyticsView from './components/AnalyticsView';
import UsersView from './components/UsersView';
import SettingsView from './components/SettingsView';
import GuardStationView from './components/GuardStationView';
import PublicHomeView from './components/PublicHomeView';
import UserProfileView from './components/UserProfileView';
import VehicleDetailsModal from './components/VehicleDetailsModal';
import AddCameraModal from './components/AddCameraModal';
import {
  getCameras,
  getEntries,
  getAuthorizedVehicles,
  addAuthorizedVehicle,
  connectLiveFeed,
  MOCK_CAMERAS,
  MOCK_RECENT_ENTRIES,
  MOCK_REGISTERED_VEHICLES,
  MOCK_SECURITY_EVENTS
} from './services/api';

export default function App() {
  // Navigation & Role states
  const [userRole, setUserRole] = useState('admin'); // 'admin', 'guard', 'public'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appMode, setAppMode] = useState('desktop'); // 'desktop' or 'guard' (mobile frame)
  const [publicPage, setPublicPage] = useState('home'); // 'home', 'settings', 'profile'
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isAddCameraModalOpen, setIsAddCameraModalOpen] = useState(false);
  const [wsStatus, setWsStatus] = useState('DISCONNECTED');
  const [toastMessage, setToastMessage] = useState(null);

  // Core Datasets
  const [stats, setStats] = useState({
    totalToday: 124,
    verifiedToday: 98,
    unknownToday: 12,
    activeAlerts: 5,
    totalRegistered: 256
  });

  const [cameras, setCameras] = useState([]);
  const [recentEntries, setRecentEntries] = useState(MOCK_RECENT_ENTRIES);
  const [registeredVehicles, setRegisteredVehicles] = useState(MOCK_REGISTERED_VEHICLES);
  const [securityEvents, setSecurityEvents] = useState(MOCK_SECURITY_EVENTS);

  const [settingsInitialView, setSettingsInitialView] = useState('overview');

  // Check URL query parameters for direct mobile QR registration link or public mode
  // Opens form in application environment with sidebar and navbar intact!
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'settings' || params.get('view') === 'form' || params.get('action') === 'register') {
      setUserRole('admin');
      setActiveTab('settings');
      setSettingsInitialView('form');
    } else if (params.get('mode') === 'public' || params.get('role') === 'public') {
      setUserRole('public');
    }
  }, []);


  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      const cams = await getCameras();
      if (cams && cams.length > 0) {
        setCameras(cams);
      } else {
        setCameras([]); // Empty by default until camera is configured
      }

      const entries = await getEntries(20);
      if (entries && entries.length > 0) setRecentEntries(entries);

      const auth = await getAuthorizedVehicles();
      if (auth && auth.length > 0) {
        setRegisteredVehicles(auth);
        setStats(prev => ({ ...prev, totalRegistered: auth.length }));
      }
    }
    loadData();


    const cleanupWs = connectLiveFeed(
      (data) => handleIncomingLiveEvent(data),
      (status) => setWsStatus(status)
    );

    return () => cleanupWs();
  }, []);

  // Guard role restrictions enforcement: Guard has access ONLY to Vehicles, Events, and Settings
  useEffect(() => {
    if (userRole === 'guard') {
      const allowedGuardTabs = ['vehicles', 'events', 'settings'];
      if (!allowedGuardTabs.includes(activeTab)) {
        setActiveTab('vehicles');
      }
    }
  }, [userRole, activeTab]);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleIncomingLiveEvent = (data) => {
    const isAuthorized = data.entry_status === 'AUTHORIZED';
    const newEntry = {
      id: data.id || `ent-${Date.now()}`,
      plate_number: data.plate_number || 'UNKNOWN',
      confidence: data.confidence || 0.95,
      entry_status: data.entry_status || (isAuthorized ? 'AUTHORIZED' : 'FLAGGED_UNLISTED'),
      review_reason: data.review_reason || (isAuthorized ? 'Automated Clearance' : 'Manual Guard Check'),
      first_seen_at: data.first_seen_at || new Date().toISOString(),
      camera_name: data.camera_name || 'Gate 1 - Main Entry',
      vehicle_type: 'Car',
      make_model: 'Campus Visitor',
      color: 'Silver',
      owner_name: isAuthorized ? 'Authorized Member' : 'Unregistered Visitor',
      associated_person: isAuthorized ? 'Campus Faculty' : 'Guest Pass',
      image_url: '/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png',
      timeline: [
        {
          time: new Date().toLocaleTimeString(),
          location: 'Gate 1 - Main Entry',
          action: isAuthorized ? 'Entry Granted' : 'Alert Triggered',
          status: isAuthorized ? 'verified' : 'alert'
        }
      ]
    };

    setRecentEntries(prev => [newEntry, ...prev.slice(0, 24)]);
    setStats(prev => ({
      ...prev,
      totalToday: prev.totalToday + 1,
      verifiedToday: isAuthorized ? prev.verifiedToday + 1 : prev.verifiedToday,
      unknownToday: !isAuthorized ? prev.unknownToday + 1 : prev.unknownToday,
      activeAlerts: !isAuthorized ? prev.activeAlerts + 1 : prev.activeAlerts
    }));

    showToast(
      `🚗 ${newEntry.plate_number} detected at Gate 1 — ${newEntry.entry_status}`,
      isAuthorized ? 'success' : 'alert'
    );
  };

  // Demo Ingestion Trigger
  const handleTriggerSimulation = () => {
    const demoPlates = [
      { plate: 'MP07AB1234', status: 'AUTHORIZED', owner: 'Rajesh Gupta', desc: 'Student Pass Verified' },
      { plate: 'MP07XY9999', status: 'FLAGGED_UNLISTED', owner: 'Guest Driver', desc: 'Unknown Vehicle Alert' },
      { plate: 'MP07CD5678', status: 'AUTHORIZED', owner: 'Priya Sharma', desc: 'Faculty Pass Cleared' },
      { plate: 'MP07GH3456', status: 'REVIEW_NEEDED', owner: 'Rohan Singh', desc: 'Pass Expired - Under Inspection' }
    ];
    const pick = demoPlates[Math.floor(Math.random() * demoPlates.length)];

    handleIncomingLiveEvent({
      id: `sim-${Date.now()}`,
      plate_number: pick.plate,
      entry_status: pick.status,
      review_reason: pick.desc,
      first_seen_at: new Date().toISOString(),
      camera_name: 'Gate 1 - Main Entry'
    });
  };

  // Camera Management
  const handleAddCamera = (newCam) => {
    setCameras(prev => [...prev, newCam]);
    showToast(`Camera node "${newCam.name}" configured and active!`, 'success');
  };

  const handleToggleEmptyCameras = () => {
    if (cameras.length > 0) {
      setCameras([]);
      showToast('Cameras cleared (Empty State active on Dashboard)', 'info');
    } else {
      setCameras(MOCK_CAMERAS);
      showToast('Sample cameras restored', 'success');
    }
  };

  // Vehicle Management
  const handleAddVehicle = async (newVehicle) => {
    const saved = await addAuthorizedVehicle(newVehicle);
    setRegisteredVehicles(prev => [saved, ...prev]);
    setStats(prev => ({ ...prev, totalRegistered: prev.totalRegistered + 1 }));
    showToast(`Vehicle ${newVehicle.plate_number} registered successfully!`, 'success');
  };

  const handleUpdateVehicle = (updated) => {
    setRegisteredVehicles(prev => prev.map(v => v.plate_number === updated.plate_number ? { ...v, ...updated } : v));
  };

  const handleDeleteVehicle = (plateNumber) => {
    setRegisteredVehicles(prev => prev.filter(v => v.plate_number !== plateNumber));
    setStats(prev => ({ ...prev, totalRegistered: Math.max(0, prev.totalRegistered - 1) }));
  };

  const handleResolveEvent = (eventId, action) => {
    setSecurityEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        return {
          ...e,
          status: action === 'ALLOW' ? 'Cleared' : 'Intercepted',
          action_taken: action === 'ALLOW' ? 'Guard Overridden - Allowed' : 'Security Patrol Dispatched'
        };
      }
      return e;
    }));
    showToast(`Incident #${eventId} resolved: ${action}`, 'success');
  };

  // If user role is 'public', render the Public Portal Views
  if (userRole === 'public') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#080c14', color: '#f1f5f9' }}>
        {publicPage === 'home' && (
          <PublicHomeView
            onNavigateToSettings={() => {
              setUserRole('admin');
              setActiveTab('settings');
              setSettingsInitialView('form');
            }}
            onNavigateToProfile={() => setPublicPage('profile')}
            onSwitchToAdmin={() => {
              setUserRole('admin');
              setActiveTab('dashboard');
            }}
          />
        )}


        {publicPage === 'profile' && (
          <UserProfileView
            onBackToHome={() => setPublicPage('home')}
            onNavigateToSettings={() => setPublicPage('settings')}
          />
        )}

        {publicPage === 'settings' && (
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '30px 24px' }}>
            <button
              onClick={() => setPublicPage('home')}
              style={{
                backgroundColor: 'transparent',
                color: '#38bdf8',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '16px',
                cursor: 'pointer'
              }}
            >
              ← Back to Public Home
            </button>
            <SettingsView
              vehicles={registeredVehicles}
              onUpdateVehicle={handleUpdateVehicle}
              onDeleteVehicle={handleDeleteVehicle}
              onOpenPublicForm={() => alert('You are already viewing the self-service settings portal.')}
            />
          </div>
        )}
      </div>
    );
  }

  // Admin and Guard Interface
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#080c14' }}>
      {/* Left Sidebar with role-based navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        setUserRole={setUserRole}
        appMode={appMode}
        setAppMode={setAppMode}
        stats={stats}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
        <Header
          onSearch={(query) => console.log('Search:', query)}
          onTriggerSimulation={handleTriggerSimulation}
          wsStatus={wsStatus}
          userRole={userRole}
          setUserRole={setUserRole}
        />

        {/* Dynamic View Router */}
        <main style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
          {appMode === 'guard' ? (
            <GuardStationView
              onAllowEntry={handleTriggerSimulation}
              onRejectEntry={() => showToast('Entry Rejected - Security Intercept Dispatched', 'alert')}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && userRole === 'admin' && (
                <DashboardView
                  stats={stats}
                  cameras={cameras}
                  recentEntries={recentEntries}
                  onSelectEntry={(entry) => setSelectedVehicle(entry)}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onAddCameraClick={() => setIsAddCameraModalOpen(true)}
                  onLoadDemoCameras={() => {
                    setCameras(MOCK_CAMERAS);
                    showToast('Demo cameras loaded!', 'success');
                  }}
                />
              )}

              {activeTab === 'live' && userRole === 'admin' && (
                <LiveMonitoringView
                  cameras={cameras}
                  onAddCameraClick={() => setIsAddCameraModalOpen(true)}
                  onDeleteCamera={(id) => {
                    setCameras(prev => prev.filter(c => c.id !== id));
                    showToast('Camera node removed', 'info');
                  }}
                  onLoadDemoCameras={() => {
                    setCameras(MOCK_CAMERAS);
                    showToast('Demo cameras loaded!', 'success');
                  }}
                  onSelectVehicle={(v) => setSelectedVehicle(v)}
                />
              )}


              {activeTab === 'vehicles' && (
                <VehiclesView
                  vehicles={registeredVehicles}
                  onAddVehicle={handleAddVehicle}
                  onSelectVehicle={(v) => {
                    setSelectedVehicle({
                      ...v,
                      entry_status: 'AUTHORIZED',
                      image_url: '/assets/ChatGPT Image Sep 27, 2026, 11_19_50 AM.png',
                      first_seen_at: new Date().toISOString(),
                      camera_name: 'Gate 1 - Main Entry',
                      timeline: [
                        { time: '10:42:15 AM', location: 'Gate 1 - Main Entry', action: 'Entry Verified', status: 'verified' },
                        { time: '10:48:10 AM', location: 'Parking Area', action: 'Parked (Zone A)', status: 'parked' }
                      ]
                    });
                  }}
                />
              )}

              {activeTab === 'events' && (
                <EventsView
                  events={securityEvents}
                  onResolveEvent={handleResolveEvent}
                />
              )}

              {activeTab === 'analytics' && userRole === 'admin' && (
                <AnalyticsView />
              )}

              {activeTab === 'users' && userRole === 'admin' && (
                <UsersView />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  vehicles={registeredVehicles}
                  onAddVehicle={handleAddVehicle}
                  onUpdateVehicle={handleUpdateVehicle}
                  onDeleteVehicle={handleDeleteVehicle}
                  initialView={settingsInitialView}
                />
              )}

            </>
          )}
        </main>
      </div>

      {/* Add Camera Modal Overlay */}
      <AddCameraModal
        isOpen={isAddCameraModalOpen}
        onClose={() => setIsAddCameraModalOpen(false)}
        onAddCamera={handleAddCamera}
      />

      {/* Vehicle Inspector Modal */}
      {selectedVehicle && (
        <VehicleDetailsModal
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          onTrackOnMap={(v) => {
            setSelectedVehicle(v);
            setActiveTab('live');
          }}
        />
      )}

      {/* Real-time Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: toastMessage.type === 'alert' ? '#1f131a' : '#0f241d',
          border: `1px solid ${toastMessage.type === 'alert' ? '#ef4444' : '#10b981'}`,
          borderRadius: '12px',
          padding: '12px 18px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: toastMessage.type === 'alert' ? '#fca5a5' : '#86efac',
          fontSize: '13px',
          fontWeight: 600
        }}>
          <span>{toastMessage.msg}</span>
        </div>
      )}
    </div>
  );
}
