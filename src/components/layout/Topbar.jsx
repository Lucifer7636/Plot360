import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  HelpCircle,
  Sun,
  Moon,
  Monitor,
  Tablet,
  Smartphone,
  ChevronDown,
  MapPin,
  Check,
  CheckCheck,
  Layers,
  Sparkles,
  ShieldCheck,
  Menu
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import HelpModal from './HelpModal';
import PlatformModal from './PlatformModal';

export default function Topbar() {
  const {
    currentRole,
    setCurrentRole,
    roles,
    theme,
    setTheme,
    deviceMode,
    setDeviceMode,
    lightweightMode,
    setLightweightMode,
    language,
    setLanguage,
    t,
    supportedLanguages,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    searchQuery,
    setSearchQuery,
    selectParcel,
    changeLocation,
    changeJurisdiction,
    parcels,
    demoLocations,
    selectedLocation,
    selectedLocationId,
    selectedJurisdiction,
    helpModalOpen,
    setHelpModalOpen,
    platformModalOpen,
    setPlatformModalOpen,
    sidebarMobileOpen,
    setSidebarMobileOpen
  } = useApp();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [jurisdictionDropdownOpen, setJurisdictionDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [searchResultsOpen, setSearchResultsOpen] = useState(false);

  const locationDropdownRef = useRef(null);
  const jurisdictionDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target)) {
        setLocationDropdownOpen(false);
      }
      if (jurisdictionDropdownRef.current && !jurisdictionDropdownRef.current.contains(e.target)) {
        setJurisdictionDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchResultsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const uniqueJurisdictions = [
    'All Jurisdictions',
    'Chandigarh',
    'Delhi',
    'Karnataka',
    'Maharashtra',
    'Rajasthan',
    'Gujarat',
    'Uttar Pradesh',
    'Telangana',
    'Tamil Nadu',
    'Himachal Pradesh',
    'Kerala'
  ];

  // Filter locations if jurisdiction is chosen
  const filteredLocationsForDropdown = (selectedJurisdiction && selectedJurisdiction !== 'All Jurisdictions')
    ? demoLocations.filter(l => l.jurisdiction.toLowerCase() === selectedJurisdiction.toLowerCase() || l.state.toLowerCase().includes(selectedJurisdiction.toLowerCase()))
    : demoLocations;

  // Search: filter parcels AND locations
  const q = searchQuery.trim().toLowerCase();
  const filteredParcels = q
    ? parcels.filter(
        p =>
          p.parcel_id.toLowerCase().includes(q) ||
          p.ulpin.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          (p.scenario && p.scenario.toLowerCase().includes(q)) ||
          (p.survey_no && p.survey_no.toLowerCase().includes(q)) ||
          (p.owner && p.owner.name.toLowerCase().includes(q))
      )
    : [];

  const filteredLocations = q
    ? demoLocations.filter(
        l =>
          l.name.toLowerCase().includes(q) ||
          l.jurisdiction.toLowerCase().includes(q) ||
          l.state.toLowerCase().includes(q)
      )
    : [];

  const handleSelectParcelResult = (parcelId) => {
    selectParcel(parcelId);
    setSearchQuery('');
    setSearchResultsOpen(false);
  };

  const handleSelectLocationResult = (locationId) => {
    changeLocation(locationId);
    setSearchQuery('');
    setSearchResultsOpen(false);
  };

  const handleSelectLocation = (locationId) => {
    changeLocation(locationId);
    setLocationDropdownOpen(false);
  };

  const handleSelectJurisdiction = (jur) => {
    changeJurisdiction(jur);
    setJurisdictionDropdownOpen(false);
  };

  const activeRoleObj = roles.find(r => r.id === currentRole) || roles[0];

  return (
    <>
      <header className="topbar-container">
        {/* Topbar Left Controls */}
        <div className="topbar-left">
          {/* Mobile Menu Hamburger Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarMobileOpen(prev => !prev)}
            aria-label="Toggle navigation menu"
            title="Toggle Menu"
          >
            <Menu size={20} />
          </button>

          {/* Platform Badge / Modal Trigger */}
          <div
            className="platform-badge"
            title="Integrated Land Governance Platform Overview"
            onClick={() => setPlatformModalOpen(true)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <span>Integrated Land Governance Platform</span>
            <ChevronDown size={14} className="text-muted" />
          </div>

          {/* Jurisdiction Selector Dropdown */}
          <div ref={jurisdictionDropdownRef} style={{ position: 'relative' }}>
            <div
              className="selector-pill"
              title={`Jurisdiction: ${selectedJurisdiction}`}
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setJurisdictionDropdownOpen(v => !v)}
            >
              <span className="pill-icon">🏛️</span>
              <span>Jurisdiction:</span>
              <span className="pill-val">{selectedJurisdiction}</span>
              <ChevronDown
                size={12}
                style={{
                  transition: 'transform 0.15s',
                  transform: jurisdictionDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </div>

            {jurisdictionDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '38px',
                  left: 0,
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '8px',
                  padding: '6px',
                  zIndex: 200,
                  boxShadow: 'var(--shadow-lg)',
                  minWidth: '190px',
                  maxHeight: '340px',
                  overflowY: 'auto'
                }}
              >
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '4px 8px', fontWeight: 700, textTransform: 'uppercase' }}>
                  Select Jurisdiction
                </div>
                {uniqueJurisdictions.map(jur => {
                  const isActive = selectedJurisdiction === jur || (jur === 'All Jurisdictions' && (!selectedJurisdiction || selectedJurisdiction === 'All Jurisdictions'));
                  return (
                    <div
                      key={jur}
                      onClick={() => handleSelectJurisdiction(jur)}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: isActive ? 'var(--bg-card-hover)' : 'transparent',
                        fontSize: '12px',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? 'var(--brand-accent-cyan)' : 'var(--text-primary)'
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <span>{jur}</span>
                      {isActive && <Check size={13} color="var(--brand-accent-cyan)" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Location Selector Dropdown */}
          <div ref={locationDropdownRef} style={{ position: 'relative' }}>
            <div
              className="selector-pill"
              title={`Location: ${selectedLocation}`}
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setLocationDropdownOpen(v => !v)}
            >
              <MapPin size={13} className="text-muted" />
              <span>Location:</span>
              <span className="pill-val">{selectedLocation}</span>
              <ChevronDown
                size={12}
                style={{
                  transition: 'transform 0.15s',
                  transform: locationDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </div>

            {locationDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '38px',
                  left: 0,
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '8px',
                  padding: '6px',
                  zIndex: 200,
                  boxShadow: 'var(--shadow-lg)',
                  minWidth: '220px',
                  maxHeight: '340px',
                  overflowY: 'auto'
                }}
              >
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '4px 8px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                  Select Study Location (15 Nodes)
                </div>
                {filteredLocationsForDropdown.map(loc => {
                  const isActive = loc.id === selectedLocationId;
                  return (
                    <div
                      key={loc.id}
                      onClick={() => handleSelectLocation(loc.id)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: isActive ? 'var(--bg-card-hover)' : 'transparent',
                        gap: '8px'
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: isActive ? 'var(--brand-accent-cyan)' : 'var(--text-primary)' }}>
                          {loc.name}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                          {loc.jurisdiction} • {loc.state}
                          {loc.sentinel_available && (
                            <span style={{ marginLeft: '5px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(2,132,199,0.2)', color: 'var(--brand-accent-blue)', fontSize: '9px', fontWeight: 700 }}>
                              SENTINEL-2
                            </span>
                          )}
                        </div>
                      </div>
                      {isActive && <Check size={13} color="var(--brand-accent-cyan)" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Topbar Center: Global Search Bar */}
        <div className="topbar-center">
          <div className="search-bar" ref={searchRef}>
            <Search className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search ULPIN, Parcel ID, Scenario, City, Owner..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchResultsOpen(true);
              }}
              onFocus={() => setSearchResultsOpen(true)}
            />

            {/* Autocomplete Dropdown */}
            {searchResultsOpen && searchQuery.trim().length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '40px',
                  left: 0,
                  right: 0,
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '8px',
                  padding: '6px',
                  zIndex: 300,
                  boxShadow: 'var(--shadow-lg)',
                  maxHeight: '340px',
                  overflowY: 'auto'
                }}
              >
                {/* Location Results */}
                {filteredLocations.length > 0 && (
                  <div style={{ marginBottom: '6px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '3px 8px', fontWeight: 700, textTransform: 'uppercase' }}>
                      Locations ({filteredLocations.length})
                    </div>
                    {filteredLocations.map(loc => (
                      <div
                        key={loc.id}
                        onClick={() => handleSelectLocationResult(loc.id)}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <MapPin size={13} color="var(--brand-accent-cyan)" />
                        <div>
                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>{loc.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>{loc.state}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Parcel Results */}
                {filteredParcels.length > 0 && (
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '3px 8px', fontWeight: 700, textTransform: 'uppercase' }}>
                      Parcels ({filteredParcels.length})
                    </div>
                    {filteredParcels.slice(0, 10).map(p => (
                      <div
                        key={p.parcel_id}
                        onClick={() => handleSelectParcelResult(p.parcel_id)}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-accent-blue)' }}>{p.parcel_id}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.ulpin}</span>
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                            {p.location} • {p.scenario_display || p.scenario}
                          </div>
                        </div>
                        <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--brand-accent-cyan)', fontWeight: 600 }}>
                          Select
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {filteredLocations.length === 0 && filteredParcels.length === 0 && (
                  <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    No matching parcels or locations found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Topbar Right Controls */}
        <div className="topbar-right">
          {/* Language Selector */}
          <div style={{ position: 'relative' }}>
            <div
              className="selector-pill"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              title="Change Interface Language"
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <span style={{ fontSize: '12px' }}>🌐</span>
              <span className="pill-val">
                {(supportedLanguages || []).find(l => l.code === language)?.label || 'English (EN)'}
              </span>
              <ChevronDown size={12} className="text-muted" />
            </div>

            {langDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '38px',
                  right: 0,
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '6px',
                  padding: '4px',
                  zIndex: 200,
                  boxShadow: 'var(--shadow-md)',
                  minWidth: '135px'
                }}
              >
                {(supportedLanguages || [
                  { code: 'en', label: 'English (EN)' },
                  { code: 'hi', label: 'हिन्दी (HI)' },
                  { code: 'pa', label: 'ਪੰਜਾਬੀ (PA)' },
                  { code: 'mr', label: 'मराठी (MR)' }
                ]).map(item => (
                  <div
                    key={item.code}
                    style={{
                      padding: '6px 10px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      fontWeight: language === item.code ? 700 : 400,
                      backgroundColor: language === item.code ? 'var(--bg-card-hover)' : 'transparent',
                      color: language === item.code ? 'var(--brand-accent-cyan)' : 'var(--text-primary)'
                    }}
                    onClick={() => { setLanguage(item.code); setLangDropdownOpen(false); }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div ref={notifDropdownRef} style={{ position: 'relative' }}>
            <button
              className="icon-btn"
              title="Notifications & Alerts"
              onClick={() => setNotifDropdownOpen(v => !v)}
              style={{ position: 'relative' }}
            >
              <Bell size={16} />
              {unreadCount > 0 && <span className="badge-dot">{unreadCount}</span>}
            </button>

            {notifDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '38px',
                  right: 0,
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '10px',
                  padding: '10px',
                  zIndex: 250,
                  boxShadow: 'var(--shadow-lg)',
                  width: '320px',
                  maxHeight: '380px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Notifications ({unreadCount} Unread)
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--brand-accent-cyan)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <CheckCheck size={13} />
                      Mark all read
                    </button>
                  )}
                </div>

                <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                      No notifications for current role.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          backgroundColor: n.unread ? 'var(--bg-card-alt)' : 'transparent',
                          border: n.unread ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = n.unread ? 'var(--bg-card-alt)' : 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 700, color: n.unread ? 'var(--brand-accent-cyan)' : 'var(--text-primary)' }}>
                            {n.title}
                          </span>
                          <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>{n.time}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {n.desc || n.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Help Button */}
          <button
            className="icon-btn"
            title="Help, User Guide & Architecture"
            onClick={() => setHelpModalOpen(true)}
          >
            <HelpCircle size={16} />
          </button>

          {/* Device Switcher */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-card)', padding: '2px' }}>
            <button
              className="icon-btn"
              style={{
                width: '26px',
                height: '26px',
                border: 'none',
                background: deviceMode === 'desktop' ? 'var(--brand-accent-blue)' : 'transparent',
                color: deviceMode === 'desktop' ? '#fff' : 'var(--text-secondary)'
              }}
              onClick={() => setDeviceMode('desktop')}
              title="Desktop Layout"
            >
              <Monitor size={14} />
            </button>
            <button
              className="icon-btn"
              style={{
                width: '26px',
                height: '26px',
                border: 'none',
                background: deviceMode === 'tablet' ? 'var(--brand-accent-blue)' : 'transparent',
                color: deviceMode === 'tablet' ? '#fff' : 'var(--text-secondary)'
              }}
              onClick={() => setDeviceMode('tablet')}
              title="Tablet Layout"
            >
              <Tablet size={14} />
            </button>
            <button
              className="icon-btn"
              style={{
                width: '26px',
                height: '26px',
                border: 'none',
                background: deviceMode === 'mobile' ? 'var(--brand-accent-blue)' : 'transparent',
                color: deviceMode === 'mobile' ? '#fff' : 'var(--text-secondary)'
              }}
              onClick={() => setDeviceMode('mobile')}
              title="Mobile Layout"
            >
              <Smartphone size={14} />
            </button>
          </div>

          {/* Theme Switcher */}
          <button
            className="icon-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Role Selector (RBAC) */}
          <div style={{ position: 'relative' }}>
            <div
              className="role-selector"
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              title="Switch User Role (Strict Server-Side RBAC)"
            >
              <div className="role-avatar">{activeRoleObj.name.charAt(0)}</div>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activeRoleObj.name}</span>
              <ChevronDown size={13} className="text-muted" />
            </div>

            {roleDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '38px',
                  right: 0,
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '8px',
                  padding: '6px',
                  zIndex: 200,
                  boxShadow: 'var(--shadow-lg)',
                  minWidth: '240px'
                }}
              >
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '4px 8px', fontWeight: 700, textTransform: 'uppercase' }}>
                  Select Role (8 RBAC Roles)
                </div>
                {roles.map(r => (
                  <div
                    key={r.id}
                    onClick={() => {
                      setCurrentRole(r.id);
                      setRoleDropdownOpen(false);
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      backgroundColor: currentRole === r.id ? 'var(--bg-card-hover)' : 'transparent'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = currentRole === r.id ? 'var(--bg-card-hover)' : 'transparent'}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, color: currentRole === r.id ? 'var(--brand-accent-cyan)' : 'var(--text-primary)' }}>
                      {r.name}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      {r.desc}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Modals */}
      <HelpModal />
      <PlatformModal />
    </>
  );
}
