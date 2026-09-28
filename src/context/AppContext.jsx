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
  auditor: 'auditor',

  // Canonical role specification aliases
  super_admin: 'administrator',
  town_planner: 'planning_officer',
  registrar: 'registration_officer',
  surveyor: 'surveyor'
};

export function normalizeRole(role) {
  if (!role) return 'citizen';
  const r = String(role).trim().toLowerCase();
  return ROLE_ALIAS[r] || r;
}

/**
 * Authoritative module access matrix derived directly from backend RBAC
 * granular permissions (backend/app/auth/permissions.py):
 * - explorer: parcel:read (All roles)
 * - intelligence: parcel:read + privileged/officer area measurement & valuation
 * - records: ror:read/write, registration:read/write (Revenue, Registrar, Admin, Auditor)
 * - planning: planning:read/write, building:read/write (Town Planner, Municipal, Admin, Auditor)
 * - citizen: service_request:create/read (Citizen, Revenue Officer, Admin, Auditor)
 * - analytics: analytics:read, conflict:read/resolve, ai:read/review (All Officers, Admin, Auditor)
 * - integrations: integration:read/sync (Admin, Auditor)
 * - admin: admin:manage_users, config:read/write (Admin)
 * - health: audit:read, system telemetry (Admin, Auditor)
 */
export const ROLE_MODULE_PERMISSIONS = {
  administrator: ['explorer', 'intelligence', 'records', 'planning', 'citizen', 'analytics', 'integrations', 'admin', 'health'],
  revenue_officer: ['explorer', 'intelligence', 'records', 'citizen', 'analytics'],
  surveyor: ['explorer', 'intelligence', 'analytics'],
  registration_officer: ['explorer', 'intelligence', 'records', 'analytics'],
  tax_officer: ['explorer', 'intelligence', 'analytics'],
  planning_officer: ['explorer', 'intelligence', 'planning', 'analytics'],
  municipal_officer: ['explorer', 'intelligence', 'planning', 'analytics'],
  auditor: ['explorer', 'intelligence', 'records', 'planning', 'analytics', 'integrations', 'health'],
  citizen: ['explorer', 'citizen']
};

export function isModuleAllowedForRole(moduleId, role) {
  const canonical = normalizeRole(role);
  const allowed = ROLE_MODULE_PERMISSIONS[canonical] || ['explorer'];
  return allowed.includes(moduleId);
}

export function getAllowedModulesForRole(role) {
  const canonical = normalizeRole(role);
  return ROLE_MODULE_PERMISSIONS[canonical] || ['explorer'];
}


/**
 * P0.1 Centralized sanitization for local demo parcel data.
 * Prevents client-side hydration race conditions from exposing confidential fields
 * to unauthorized / citizen users before server-side authoritative response resolves.
 */
export function sanitizeDemoParcel(parcel, role) {
  if (!parcel) return null;
  const canonicalRole = ROLE_ALIAS[role] || role;

  // Fail closed if unauthenticated, unknown, or citizen
  const isPrivileged = Boolean(canonicalRole && canonicalRole !== 'citizen');
  const canEnc = isPrivileged && ['revenue_officer', 'registration_officer', 'administrator', 'auditor'].includes(canonicalRole);
  const canBp = isPrivileged && ['planning_officer', 'municipal_officer', 'administrator', 'auditor'].includes(canonicalRole);
  const canTax = isPrivileged && ['tax_officer', 'municipal_officer', 'administrator', 'auditor'].includes(canonicalRole);

  const sanitized = { ...parcel };

  if (sanitized.enc) {
    if (canEnc) {
      sanitized.enc = { ...sanitized.enc };
    } else {
      sanitized.enc = { status: sanitized.enc.status };
    }
  }

  if (sanitized.bp) {
    if (canBp) {
      sanitized.bp = { ...sanitized.bp };
    } else {
      sanitized.bp = { id: sanitized.bp.id, status: sanitized.bp.status };
    }
  }

  if (sanitized.tax) {
    if (canTax) {
      sanitized.tax = { ...sanitized.tax };
    } else {
      sanitized.tax = { id: sanitized.tax.id, status: sanitized.tax.status };
    }
  }

  return sanitized;
}

export function AppProvider({ children }) {
  // Centralized Location & Jurisdiction State
  const [selectedLocationId, setSelectedLocationId] = useState('chandigarh');
  const currentLocation = DEMO_LOCATIONS.find(l => l.id === selectedLocationId) || DEMO_LOCATIONS[0];
  const selectedLocation = currentLocation.name;
  const [selectedJurisdiction, setSelectedJurisdiction] = useState(currentLocation.jurisdiction);

  // Role Based Access Control with server-authenticated token
  const [currentRole, setCurrentRoleState] = useState('planning_officer');

  // Active Parcel (P-1027 is default selected parcel as required)
  const [activeParcelId, setActiveParcelId] = useState('P-1027');
  const [serverParcelData, setServerParcelData] = useState(null);

  const fetchActiveParcelDetail = useCallback((targetId) => {
    if (!targetId) return;
    getParcelByUlpin(targetId)
      .then(detail => {
        if (detail && (detail.parcel_id || detail.ulpin)) {
          setServerParcelData(detail);
        }
      })
      .catch(() => {});
  }, []);

  const rawDemoParcel = activeParcelId ? (DEMO_PARCELS.find(p => p.parcel_id === activeParcelId) || null) : null;
  const baseDemoParcel = rawDemoParcel ? sanitizeDemoParcel(rawDemoParcel, currentRole) : null;
  const activeParcel = serverParcelData && (serverParcelData.parcel_id === activeParcelId || serverParcelData.ulpin === activeParcelId)
    ? { ...baseDemoParcel, ...serverParcelData }
    : baseDemoParcel;
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
      setServerParcelData(null);
      return;
    }
    const found = DEMO_PARCELS.find(p => p.parcel_id === parcelId || p.ulpin === parcelId);
    if (found) {
      setActiveParcelId(found.parcel_id);
      fetchActiveParcelDetail(found.parcel_id);
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
  const [activeModule, setActiveModuleState] = useState('explorer');

  // Real Mobile Sidebar Drawer State
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  // Synchronized Parcels & Notifications State
  const [backendParcels, setBackendParcels] = useState(DEMO_PARCELS);
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'New Service Request', desc: 'Demarcation request filed for P-1026', time: '10m ago', unread: true },
    { id: '2', title: 'AI Alert Requiring Review', desc: 'Potential new development flagged on P-1027', time: '1h ago', unread: true },
    { id: '3', title: 'Data Conflict Assigned', desc: 'Area mismatch flagged between RoR and Tax for P-1028', time: '3h ago', unread: true }
  ]);

  // Role Based Access Control handler

  const setCurrentRole = (newRole) => {
    const canonicalRole = normalizeRole(newRole);
    setCurrentRoleState(canonicalRole);

    // If currently active module becomes inaccessible after a role change,
    // safely fall back to the platform baseline module 'explorer'
    if (!isModuleAllowedForRole(activeModule, canonicalRole)) {
      setActiveModuleState('explorer');
    }

    // Invalidate old role's sensitive notifications and cached state immediately (Parts 37, 38, 39)
    setNotifications([]);
    setServerParcelData(null);

    const creds = ROLE_CREDENTIALS[canonicalRole];
    if (creds) {
      login(creds.username, creds.password)
        .then(() => {
          // Re-fetch authorized parcel detail under the newly authenticated role
          if (activeParcelId) {
            fetchActiveParcelDetail(activeParcelId);
          }

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
      login(creds.username, creds.password)
        .then(() => {
          fetchActiveParcelDetail(activeParcelId);
        })
        .catch(() => {});
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

  // Synchronized parcel detail tab state for Presentation Mode and explorer
  const [parcelDetailTab, setParcelDetailTab] = useState('overview');

  // Modals & Panels
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [unifiedReportOpen, setUnifiedReportOpen] = useState(false);
  const [layersDrawerOpen, setLayersDrawerOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [platformModalOpen, setPlatformModalOpen] = useState(false);

  // Presentation Mode Global Lifecycle State (independent of activeModule)
  const [isPresentationActive, setIsPresentationActive] = useState(false);
  const [isPresentationGateOpen, setIsPresentationGateOpen] = useState(false);
  const [presentationStep, setPresentationStep] = useState(0);
  const [presentationRunning, setPresentationRunning] = useState(false);

  const openPresentation = useCallback(() => {
    setIsPresentationActive(true);
    setIsPresentationGateOpen(true);
    setPresentationRunning(false);
    setPresentationStep(0);
  }, []);

  const startPresentation = useCallback((targetParcelId) => {
    if (targetParcelId) {
      selectParcel(targetParcelId);
    }
    setParcelDetailTab('overview');
    setIsPresentationGateOpen(false);
    setIsPresentationActive(true);
    setPresentationStep(0);
    setPresentationRunning(true);
  }, [selectParcel]);

  const exitPresentation = useCallback(() => {
    setPresentationRunning(false);
    setIsPresentationActive(false);
    setIsPresentationGateOpen(false);
    setPresentationStep(0);
    setParcelDetailTab('overview');
    setEvidenceModalOpen(false);
    setFieldModalOpen(false);
    setUnifiedReportOpen(false);
    setActiveModuleState('explorer');
  }, []);

  const handleSetActiveModule = useCallback((newModule) => {
    if (newModule === 'presentation') {
      openPresentation();
      return;
    }
    if (!isModuleAllowedForRole(newModule, currentRole)) {
      return;
    }
    setActiveModuleState(newModule);
  }, [openPresentation, currentRole]);

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
        setActiveModule: handleSetActiveModule,
        isPresentationActive,
        setIsPresentationActive,
        isPresentationGateOpen,
        setIsPresentationGateOpen,
        presentationStep,
        setPresentationStep,
        presentationRunning,
        setPresentationRunning,
        openPresentation,
        startPresentation,
        exitPresentation,
        currentRole,
        setCurrentRole,
        roles: ROLES,
        allowedModules: getAllowedModulesForRole(currentRole),
        isModuleAllowed: (moduleId) => isModuleAllowedForRole(moduleId, currentRole),
        isModuleAllowedForRole,
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
        setSidebarMobileOpen,
        parcelDetailTab,
        setParcelDetailTab
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
