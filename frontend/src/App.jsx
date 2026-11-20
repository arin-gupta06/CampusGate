import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import LiveMonitoringView from './components/LiveMonitoringView';
import VehiclesView from './components/VehiclesView';
import EventsView from './components/EventsView';
import AnalyticsView from './components/AnalyticsView';
import SettingsView from './components/SettingsView';
import InfrastructureView from './components/InfrastructureView';
import GuardStationView from './components/GuardStationView';
import PublicHomeView from './components/PublicHomeView';
import UserProfileView from './components/UserProfileView';
import VehicleDetailsModal from './components/VehicleDetailsModal';
import AddCameraModal from './components/AddCameraModal';
import AuthModal from './components/AuthModal';
import GoogleLandingView from './components/GoogleLandingView';
import DeveloperView from './components/DeveloperView';
import {
  getCameras,
  addCamera,
  deleteCamera,
  getEntries,
  getEntriesSummary,
  getAuthorizedVehicles,
  addAuthorizedVehicle,
  updateAuthorizedVehicle,
  deleteAuthorizedVehicle,
  triggerSimulation,
  controlBarrier,
  resolveEntryReview,
  connectLiveFeed,
  getStoredUser,
  setStoredAuth,
  clearStoredAuth,
  MOCK_CAMERAS,
  MOCK_RECENT_ENTRIES,
  MOCK_REGISTERED_VEHICLES,
  MOCK_SECURITY_EVENTS
} from './services/api';

export default function App() {
  // Global Authentication State - returns null if not signed in to show Landing Screen
  const [currentUser, setCurrentUser] = useState(() => {
    return getStoredUser() || null;
  });

  const handleSignOut = () => {
    clearStoredAuth();
    setCurrentUser(null);
    showToast('Signed out of CampusGate', 'info');
  };

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const user = getStoredUser();
    if (!user || user.role === 'user') return 'profile';
    if (user.role === 'guard') return 'guard_console';
    return 'overview';
  });
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isAddCameraModalOpen, setIsAddCameraModalOpen] = useState(false);
  const [wsStatus, setWsStatus] = useState('DISCONNECTED');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Theme state (White & Black dual-mode, defaulting to 'light')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('campusgate_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('campusgate_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Switch persona or login
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    showToast(`Welcome back, ${user.name}! Signed in as ${user.role.toUpperCase()}`, 'success');
    if (user.role === 'guard') {
      setActiveTab('guard_console');
    } else if (user.role === 'admin') {
      setActiveTab('overview');
    } else {
      setActiveTab('profile'); // Normal user lands straight on Digital Gate Pass!
    }
  };

  // Core Datasets
  const [stats, setStats] = useState({
    totalToday: 142,
    verifiedToday: 128,
    unknownToday: 14,
    activeAlerts: 4,
    totalRegistered: 256
  });

  const [cameras, setCameras] = useState([]);
  const [recentEntries, setRecentEntries] = useState(MOCK_RECENT_ENTRIES);
  const [registeredVehicles, setRegisteredVehicles] = useState(MOCK_REGISTERED_VEHICLES);
  const [securityEvents, setSecurityEvents] = useState(MOCK_SECURITY_EVENTS);
  const [settingsInitialView, setSettingsInitialView] = useState('overview');

  // Check URL query parameters or pathname for direct navigation or OAuth callbacks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname.toLowerCase();

    // Check for Google OAuth redirect callback tokens
    const token = params.get('token') || params.get('jwt') || params.get('access_token');
    const authError = params.get('auth_error');

    if (authError) {
      showToast(`Google Sign-In failed: ${decodeURIComponent(authError)}`, 'error');
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    } else if (token) {
      localStorage.setItem('campusgate_jwt', token);
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.user) {
            setStoredAuth(token, data.user);
            setCurrentUser(data.user);
            showToast(`Welcome back, ${data.user.name}! Signed in via Google OAuth.`, 'success');
            if (data.user.role === 'guard') setActiveTab('guard_console');
            else if (data.user.role === 'admin') setActiveTab('overview');
            else setActiveTab('profile');
          }
        })
        .catch(err => console.warn('Could not verify OAuth token profile:', err));

      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    if (path === '/developer' || path === '/developers' || params.get('tab') === 'developer') {
      setActiveTab('developer');
    } else if (params.get('tab') === 'settings' || params.get('view') === 'form' || params.get('action') === 'register') {
      setActiveTab('apply_pass');
    }
  }, []);

  // Fetch initial data & connect WebSocket
  useEffect(() => {
    async function loadData() {
      // 1. Fetch live audit summary from database/redis
      try {
        const summary = await getEntriesSummary();
        if (summary) {
          setStats(prev => ({
            ...prev,
            totalToday: summary.total_entries > 0 ? summary.total_entries : prev.totalToday,
            verifiedToday: summary.authorized_count > 0 ? summary.authorized_count : prev.verifiedToday,
            unknownToday: (summary.unauthorized_count + summary.review_required_count) > 0 ? (summary.unauthorized_count + summary.review_required_count) : prev.unknownToday,
            activeAlerts: (summary.review_required_count + summary.unresolved_count) > 0 ? (summary.review_required_count + summary.unresolved_count) : prev.activeAlerts
          }));
        }
      } catch (e) {
        console.warn('Error loading summary:', e);
      }

      // 2. Fetch live cameras
      const cams = await getCameras();
      if (cams && cams.length > 0) {
        setCameras(cams);
      } else {
        setCameras(MOCK_CAMERAS);
      }

      // 3. Fetch recent entry audit trail
      const entries = await getEntries(30);
      if (entries && entries.length > 0) setRecentEntries(entries);

      // 4. Fetch authorized vehicles roster
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

  const handleIncomingLiveEvent = (data) => {
    const isAuthorized = data.entry_status === 'AUTHORIZED';
    const newEntry = {
      id: data.id || `ent-${Date.now()}`,
      plate_number: data.plate_number || 'UNKNOWN',
      confidence: data.confidence || 0.96,
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

    setRecentEntries(prev => [newEntry, ...prev.slice(0, 29)]);
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

  // Live Ingestion & Backend Simulation Trigger
  const handleTriggerSimulation = async () => {
    try {
      const liveSim = await triggerSimulation();
      if (liveSim) {
        showToast(`🚗 Simulated arrival processed: ${liveSim.plate_number}`, 'success');
        return;
      }
    } catch (err) {
      console.warn('Simulation backend offline, using fallback:', err);
    }

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

  // Vehicle Management - Wired to Backend Database
  const handleAddVehicle = async (newVehicle) => {
    const saved = await addAuthorizedVehicle(newVehicle);
    setRegisteredVehicles(prev => [saved, ...prev]);
    setStats(prev => ({ ...prev, totalRegistered: prev.totalRegistered + 1 }));
    showToast(`Vehicle ${newVehicle.plate_number} registered successfully!`, 'success');
  };

  const handleUpdateVehicle = async (updated) => {
    setRegisteredVehicles(prev => prev.map(v => v.plate_number === updated.plate_number ? { ...v, ...updated } : v));
    try {
      await updateAuthorizedVehicle(updated.plate_number, updated);
      showToast(`Vehicle ${updated.plate_number} details saved!`, 'success');
    } catch (e) {
      console.warn('Update vehicle failed:', e);
    }
  };

  const handleDeleteVehicle = async (plateNumber) => {
    setRegisteredVehicles(prev => prev.filter(v => v.plate_number !== plateNumber));
    setStats(prev => ({ ...prev, totalRegistered: Math.max(0, prev.totalRegistered - 1) }));
    try {
      await deleteAuthorizedVehicle(plateNumber);
      showToast(`Vehicle ${plateNumber} removed from database registry`, 'info');
    } catch (e) {
      console.warn('Delete vehicle failed:', e);
    }
  };

  const handleResolveEvent = async (eventId, action) => {
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
    try {
      await resolveEntryReview(eventId, action === 'ALLOW' ? 'APPROVED' : 'REJECTED');
    } catch (e) {
      console.warn('Resolve event failed:', e);
    }
    showToast(`Incident #${eventId} resolved: ${action}`, 'success');
  };

  const handleBarrierAction = async (action, plate = null) => {
    try {
      await controlBarrier(action, 'Gate 1 - Main Ingress', plate);
      showToast(`Gate Barrier ${action === 'OPEN' ? 'Raised' : 'Lowered'}`, 'success');
    } catch (e) {
      console.warn('Barrier action failed:', e);
    }
  };

  const handleIssueVisitorPass = (plateNumber, visitorData) => {
    handleAddVehicle({
      id: Date.now(),
      plate_number: plateNumber,
      owner_name: visitorData.driverName,
      associated_person: `Visitor (Host: ${visitorData.hostPerson})`,
      department: `Visitor Pass - ${visitorData.purpose}`,
      vehicle_type: visitorData.vehicleType || 'Car',
      valid_till: 'Today (Temporary Clearance)',
      status: 'Active',
      passes_issued: 1
    });
    showToast(`1-Day Visitor Pass generated for ${plateNumber}!`, 'success');
  };

  const role = currentUser?.role || 'user';
  const isGuardOrAdmin = role === 'guard' || role === 'admin';
  const isAdmin = role === 'admin';

  // If not authenticated, render the dedicated 1-page Google Sign-In Landing View
  if (!currentUser) {
    return <GoogleLandingView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'hidden',
      backgroundColor: 'var(--bg-base)',
      color: 'var(--text-main)'
    }}>
      {/* Role-Aware Global Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        stats={stats}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%', overflowX: 'hidden' }}>
        {/* Top Header with User Profile & Simulation Actions */}
        <Header
          onSearch={(query) => console.log('Search:', query)}
          onTriggerSimulation={handleTriggerSimulation}
          wsStatus={wsStatus}
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onSignOut={handleSignOut}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        {/* Global Router Canvas */}
        <main style={{
          flex: 1,
          padding: (activeTab === 'home' || activeTab === 'landing') ? 0 : '24px 28px',
          overflowY: 'auto',
          overflowX: 'hidden',
          minWidth: 0,
          width: '100%'
        }}>
          {/* =========================================================
              1. MEMBER BASE APPS (Strictly for all authenticated users)
             ========================================================= */}
          {(activeTab === 'digital_pass' || activeTab === 'profile') && (
            <UserProfileView
              currentUser={currentUser}
              onBackToHome={() => setActiveTab(isGuardOrAdmin ? 'overview' : 'profile')}
              onNavigateToSettings={() => setActiveTab('apply_pass')}
            />
          )}

          {activeTab === 'apply_pass' && (
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <SettingsView
                vehicles={registeredVehicles}
                onAddVehicle={handleAddVehicle}
                onUpdateVehicle={handleUpdateVehicle}
                onDeleteVehicle={handleDeleteVehicle}
                initialView="overview"
              />
            </div>
          )}

          {(activeTab === 'home' || activeTab === 'landing') && (
            <GoogleLandingView
              currentUser={currentUser}
              onLoginSuccess={handleLoginSuccess}
              onOpenApplyPass={() => setActiveTab('apply_pass')}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'developer' && (
            <DeveloperView />
          )}

          {/* =========================================================
              2. EXTRA: GUARD OPERATIONS TABS (Guard + Admin only)
              (Administrative CCTV & Ingress Overview are strictly protected)
             ========================================================= */}
          {isGuardOrAdmin && (
            <>
              {activeTab === 'overview' && (
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
              {activeTab === 'guard_console' && (
                <GuardStationView
                  onAllowEntry={async () => {
                    await handleBarrierAction('OPEN');
                    handleTriggerSimulation();
                  }}
                  onRejectEntry={async () => {
                    await handleBarrierAction('CLOSE');
                    showToast('Entry Denied - Gate Barrier Locked Down', 'alert');
                  }}
                  onIssueVisitorPass={handleIssueVisitorPass}
                  recentEntries={recentEntries}
                />
              )}

              {activeTab === 'events' && (
                <EventsView
                  events={securityEvents}
                  vehicles={registeredVehicles}
                  onResolveEvent={handleResolveEvent}
                  onAddVehicle={handleAddVehicle}
                  onUpdateVehicle={handleUpdateVehicle}
                  onTransferOwnership={(plateNumber, transferData) => {
                    handleIssueVisitorPass(plateNumber, transferData);
                    handleResolveEvent(transferData.eventId, 'ALLOW');
                  }}
                  onIssueVisitorPass={(plateNumber, visitorData) => {
                    handleIssueVisitorPass(plateNumber, visitorData);
                    handleResolveEvent(visitorData.eventId, 'ALLOW');
                  }}
                />
              )}
            </>
          )}

          {/* =========================================================
              3. EXTRA: ADMIN GOVERNANCE TABS (Admin only)
             ========================================================= */}
          {isAdmin && (
            <>
              {activeTab === 'live' && (
                <LiveMonitoringView
                  cameras={cameras}
                  onAddCameraClick={() => setIsAddCameraModalOpen(true)}
                  onDeleteCamera={async (id) => {
                    setCameras(prev => prev.filter(c => c.id !== id));
                    await deleteCamera(id);
                    showToast('Camera node removed from database', 'info');
                  }}
                  onLoadDemoCameras={() => {
                    setCameras(MOCK_CAMERAS);
                    showToast('Demo cameras loaded!', 'success');
                  }}
                  onSelectVehicle={(v) => setSelectedVehicle(v)}
                />
              )}

              {/* Infrastructure & Nodes strictly restricted to Admin */}
              {activeTab === 'settings' && (
                <InfrastructureView
                  cameras={cameras}
                  onAddCameraClick={() => setIsAddCameraModalOpen(true)}
                  onDeleteCamera={async (id) => {
                    setCameras(prev => prev.filter(c => c.id !== id));
                    await deleteCamera(id);
                    showToast('Camera node removed from database', 'info');
                  }}
                  onLoadDemoCameras={() => {
                    setCameras(MOCK_CAMERAS);
                    showToast('Default gate camera nodes loaded!', 'success');
                  }}
                />
              )}

              {activeTab === 'roster' && (
                <VehiclesView
                  vehicles={registeredVehicles}
                  onAddVehicle={handleAddVehicle}
                  onUpdateVehicle={handleUpdateVehicle}
                  onDeleteVehicle={handleDeleteVehicle}
                  onSelectVehicle={(v) => setSelectedVehicle(v)}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsView />
              )}
            </>
          )}
        </main>
      </div>

      {/* OAuth Login & Persona Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentUser={currentUser}
      />

      {/* Add Camera Modal Overlay */}
      <AddCameraModal
        isOpen={isAddCameraModalOpen}
        onClose={() => setIsAddCameraModalOpen(false)}
        onAddCamera={async (newCam) => {
          const saved = await addCamera(newCam);
          setCameras(prev => [...prev, saved]);
          showToast(`Camera node "${newCam.name}" configured and active!`, 'success');
        }}
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

      {/* Real-Time Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: toastMessage.type === 'alert' ? 'var(--color-crimson-bg)' : 'var(--color-emerald-bg)',
          border: `1px solid ${toastMessage.type === 'alert' ? 'var(--color-crimson-border)' : 'var(--color-emerald-border)'}`,
          borderRadius: '12px',
          padding: '12px 18px',
          boxShadow: 'var(--shadow-elevated)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: toastMessage.type === 'alert' ? 'var(--color-crimson)' : 'var(--color-emerald)',
          fontSize: '13px',
          fontWeight: 700
        }}>
          <span>{toastMessage.msg}</span>
        </div>
      )}
    </div>
  );
}
