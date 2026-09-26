import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEMO_PARCELS, DEMO_LOCATIONS, ROLES, KPI_DATA } from '../data/mockData';
import { getParcels, getParcelByUlpin } from '../api/parcels';
import { getNotifications, markNotificationRead as apiMarkRead, markAllNotificationsRead as apiMarkAllRead } from '../api/notifications';
import { login } from '../api/auth';
import { submitFieldVerification } from '../api/ai';
import { translate, SUPPORTED_LANGUAGES } from '../data/translations';

const AppContext = createContext();

const ROLE_CREDENTIALS = {
  citizen: { username: 'citizen@plot360.gov.in', password: 'Plot360Pass123!' },
  revenue_officer: { username: 'revenue@plot360.gov.in', password: 'Plot360Pass123!' },
  registration_officer: { username: 'registration@plot360.gov.in', password: 'Plot360Pass123!' },
  planning_officer: { username: 'planning@plot360.gov.in', password: 'Plot360Pass123!' },
  municipal_officer: { username: 'municipal@plot360.gov.in', password: 'Plot360Pass123!' },
  tax_officer: { username: 'tax@plot360.gov.in', password: 'Plot360Pass123!' },
  administrator: { username: 'admin@plot360.gov.in', password: 'Plot360Pass123!' },
  auditor: { username: 'auditor@plot360.gov.in', password: 'Plot360Pass123!' }
};

const ROLE_ALIAS = {
  admin: 'administrator',
  planning: 'planning_officer',
  revenue: 'revenue_officer',
  registration: 'registration_officer',
  tax: 'tax_officer',
  municipal: 'municipal_officer',
  citizen: 'citizen',
  auditor: 'auditor'
};

export function AppProvider({ children }) {
  // Centralized Location & Jurisdiction State
  const [selectedLocationId, setSelectedLocationId] = useState('chandigarh');
  const currentLocation = DEMO_LOCATIONS.find(l => l.id === selectedLocationId) || DEMO_LOCATIONS[0];
  const selectedLocation = currentLocation.name;
  const [selectedJurisdiction, setSelectedJurisdiction] = useState(currentLocation.jurisdiction);

  // Active Parcel (P-1027 is default selected parcel as required)
  const [activeParcelId, setActiveParcelId] = useState('P-1027');
  const activeParcel = activeParcelId ? (DEMO_PARCELS.find(p => p.parcel_id === activeParcelId) || null) : null;
  const activeULPIN = activeParcel ? activeParcel.ulpin : '';

  // In-map notification / toast for geolocation and search feedback
  const [locationToast, setLocationToast] = useState(null);
  const showLocationToast = (message, type = 'info', duration = 3500) => {
    setLocationToast({ message, type });
    setTimeout(() => {
      setLocationToast(null);
    }, duration);
  };

  // Change jurisdiction with location filtering and cross-location sync
  const changeJurisdiction = (jurisdictionName) => {
    if (!jurisdictionName) return;
    if (jurisdictionName === 'All' || jurisdictionName === 'All Jurisdictions') {
      setSelectedJurisdiction('All Jurisdictions');
      return;
    }
    setSelectedJurisdiction(jurisdictionName);
    const matchingLocations = DEMO_LOCATIONS.filter(
      l => l.jurisdiction.toLowerCase() === jurisdictionName.toLowerCase() ||
           l.state.toLowerCase().includes(jurisdictionName.toLowerCase())
    );
    if (matchingLocations.length > 0) {
      const isCurrentInJurisdiction = matchingLocations.some(l => l.id === selectedLocationId);
      if (!isCurrentInJurisdiction) {
        changeLocation(matchingLocations[0].id);
      }
    }
  };

  // Change location with complete context update
  const changeLocation = (locationIdOrName) => {
    if (!locationIdOrName) return;
    const query = locationIdOrName.toString().trim().toLowerCase();
    const targetLoc = DEMO_LOCATIONS.find(
      l => l.id.toLowerCase() === query || l.name.toLowerCase() === query
    );
    if (targetLoc) {
      setSelectedLocationId(targetLoc.id);
      setSelectedJurisdiction(targetLoc.jurisdiction);
      setActiveParcelId(targetLoc.defaultParcelId);
    }
  };

  // Select parcel with cross-location synchronization
  const selectParcel = (parcelId) => {
    if (!parcelId) {
      setActiveParcelId(null);
      return;
    }
    const found = DEMO_PARCELS.find(p => p.parcel_id === parcelId || p.ulpin === parcelId);
    if (found) {
      setActiveParcelId(found.parcel_id);
      if (found.location_id && found.location_id !== selectedLocationId) {
        const targetLoc = DEMO_LOCATIONS.find(l => l.id === found.location_id);
        if (targetLoc) {
          setSelectedLocationId(targetLoc.id);
          setSelectedJurisdiction(targetLoc.jurisdiction);
        }
      }
    }
  };

  // Active Navigation Module
  const [activeModule, setActiveModule] = useState('explorer');

  // Real Mobile Sidebar Drawer State
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  // Synchronized Parcels & Notifications State
  const [backendParcels, setBackendParcels] = useState(DEMO_PARCELS);
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'New Service Request', desc: 'Demarcation request filed for P-1026', time: '10m ago', unread: true },
    { id: '2', title: 'AI Alert Requiring Review', desc: 'Potential new development flagged on P-1027', time: '1h ago', unread: true },
    { id: '3', title: 'Data Conflict Assigned', desc: 'Area mismatch flagged between RoR and Tax for P-1028', time: '3h ago', unread: true }
  ]);

  // Role Based Access Control with server-authenticated token
  const [currentRole, setCurrentRoleState] = useState('planning_officer');

  const setCurrentRole = (newRole) => {
    const canonicalRole = ROLE_ALIAS[newRole] || newRole;
    setCurrentRoleState(canonicalRole);

    // Invalidate old role's sensitive notifications and cached state immediately (Parts 37, 38, 39)
    setNotifications([]);

    const creds = ROLE_CREDENTIALS[canonicalRole];
    if (creds) {
      login(creds.username, creds.password)
        .then(() => {
          // Re-fetch authorized parcels
          getParcels({ location: selectedLocationId })
            .then(data => {
              if (Array.isArray(data) && data.length > 0) {
                setBackendParcels(data);
              }
            })
            .catch(() => {});

          // Re-fetch authorized notifications
          getNotifications()
            .then(data => {
              if (Array.isArray(data)) {
                setNotifications(data.map(n => ({
                  id: String(n.id),
                  title: n.title,
                  desc: n.message,
                  time: 'Recent',
                  unread: !n.is_read
                })));
              }
            })
            .catch(() => {});
        })
        .catch(err => {
          console.warn('Role auth sync warning:', err);
        });
    }
  };

  // Initial authentication on mount
  useEffect(() => {
    const creds = ROLE_CREDENTIALS[currentRole] || ROLE_CREDENTIALS['planning_officer'];
    if (creds) {
      login(creds.username, creds.password).catch(() => {});
    }
  }, []);

  // Theme: Dark by default (as in authoritative mockup), light mode also supported
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('plot360_theme') || 'dark';
  });

  // Device simulation: desktop, tablet, mobile
  const [deviceMode, setDeviceMode] = useState('desktop');

  // Lightweight low-bandwidth mode
  const [lightweightMode, setLightweightMode] = useState(false);

  // Language with safe persistence and fallback
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('plot360_language');
      if (saved && ['en', 'hi', 'pa', 'mr'].includes(saved)) return saved;
      if (saved === 'pb') return 'pa';
    } catch {
      // localStorage may be disabled
    }
    return 'en';
  });

  const setLanguage = (newLang) => {
    const norm = (newLang === 'pb' ? 'pa' : newLang) || 'en';
    setLanguageState(norm);
    try {
      localStorage.setItem('plot360_language', norm);
    } catch {
      // ignore
    }
  };

  const t = (key, params) => translate(language, key, params);

  // Map Basemap & Layer Controls
  const [mapType, setMapType] = useState('satellite');
  // Fullscreen MUST BE FALSE by default
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [layers, setLayers] = useState({
    parcels: true,
    labels: true,
    boundaries: true,
    zoning: true,
    satellite: true,
    revenue: true,
    survey: true,
    utilities: false,
    protected: false
  });

  const toggleLayer = (layerKey) => {
    setLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Field Verification State (persisted in localStorage)
  const [fieldVerificationStatus, setFieldVerificationStatus] = useState(() => {
    return localStorage.getItem('plot360_field_status') || 'UNDER_REVIEW';
  });
  const [fieldVerificationNotes, setFieldVerificationNotes] = useState(() => {
    return localStorage.getItem('plot360_field_notes') || 'Site inspection ordered for agricultural parcel boundary cross-check.';
  });

  const updateFieldVerification = (status, notes) => {
    setFieldVerificationStatus(status);
    setFieldVerificationNotes(notes);
    localStorage.setItem('plot360_field_status', status);
    localStorage.setItem('plot360_field_notes', notes);
    const target = activeULPIN || activeParcelId || 'P-1027';
    submitFieldVerification(target, status, notes).catch(() => {});
  };

  // Modals & Panels
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [unifiedReportOpen, setUnifiedReportOpen] = useState(false);
  const [layersDrawerOpen, setLayersDrawerOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [platformModalOpen, setPlatformModalOpen] = useState(false);

  // Global Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications Handlers
  const handleMarkNotificationRead = (notifId) => {
    setNotifications(prev => prev.map(n => n.id === String(notifId) ? { ...n, unread: false } : n));
    apiMarkRead(notifId).catch(() => {});
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    apiMarkAllRead().catch(() => {});
  };

  // Synchronize parcels with backend
  useEffect(() => {
    let isMounted = true;
    getParcels({ location: selectedLocationId })
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setBackendParcels((prev) => {
            const map = new Map(prev.map(p => [p.parcel_id, p]));
            data.forEach(p => map.set(p.parcel_id, { ...map.get(p.parcel_id), ...p }));
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [selectedLocationId]);

  // Synchronize notifications with backend
  useEffect(() => {
    let isMounted = true;
    getNotifications()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setNotifications(data.map(n => ({
            id: String(n.id),
            title: n.title,
            desc: n.message,
            time: 'Recent',
            unread: !n.is_read
          })));
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('plot360_theme', theme);
  }, [theme]);

  // Parcels available for the currently selected location
  const locationParcels = backendParcels.filter(
    p => !selectedLocationId || p.location_id === selectedLocationId || p.location?.toLowerCase().includes(selectedLocationId.toLowerCase())
  );

  return (
    <AppContext.Provider
      value={{
        selectedLocationId,
        setSelectedLocationId,
        selectedLocation,
        currentLocation,
        selectedJurisdiction,
        setSelectedJurisdiction,
        changeJurisdiction,
        changeLocation,
        demoLocations: DEMO_LOCATIONS,
        activeParcelId,
        setActiveParcelId,
        activeParcel,
        activeULPIN,
        selectParcel,
        locationParcels,
        locationToast,
        showLocationToast,
        activeModule,
        setActiveModule,
        currentRole,
        setCurrentRole,
        roles: ROLES,
        theme,
        setTheme,
        deviceMode,
        setDeviceMode,
        lightweightMode,
        setLightweightMode,
        language,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
        mapType,
        setMapType,
        isFullscreen,
        setIsFullscreen,
        layers,
        toggleLayer,
        fieldVerificationStatus,
        fieldVerificationNotes,
        updateFieldVerification,
        evidenceModalOpen,
        setEvidenceModalOpen,
        fieldModalOpen,
        setFieldModalOpen,
        unifiedReportOpen,
        setUnifiedReportOpen,
        layersDrawerOpen,
        setLayersDrawerOpen,
        helpModalOpen,
        setHelpModalOpen,
        platformModalOpen,
        setPlatformModalOpen,
        searchQuery,
        setSearchQuery,
        notifications,
        unreadCount,
        markNotificationRead: handleMarkNotificationRead,
        markAllNotificationsRead: handleMarkAllNotificationsRead,
        kpiData: KPI_DATA,
        parcels: backendParcels,
        sidebarMobileOpen,
        setSidebarMobileOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
