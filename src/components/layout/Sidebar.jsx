import React from 'react';
import {
  LayoutGrid,
  Box,
  Landmark,
  Compass,
  Users,
  BarChart3,
  Share2,
  ShieldCheck,
  Activity,
  Tv,
  HelpCircle,
  User,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function Sidebar() {
  const {
    activeModule,
    setActiveModule,
    t,
    setHelpModalOpen,
    setSidebarMobileOpen,
    isPresentationActive,
    openPresentation
  } = useApp();

  const handleNavClick = (id) => {
    if (id === 'presentation') {
      openPresentation();
      setSidebarMobileOpen(false);
      return;
    }
    setActiveModule(id);
    setSidebarMobileOpen(false);
  };

  const navItems = [
    { id: 'explorer', label: 'Land Explorer', icon: LayoutGrid },
    { id: 'intelligence', label: 'Parcel Intelligence', icon: Box },
    { id: 'records', label: 'Governance & Records', icon: Landmark },
    { id: 'planning', label: 'Planning & Development', icon: Compass },
    { id: 'citizen', label: 'Citizen Services', icon: Users },
    { id: 'analytics', label: 'Analytics & AI', icon: BarChart3 },
    { id: 'integrations', label: 'Integration Hub', icon: Share2 },
    { id: 'admin', label: 'Administration & Security', icon: ShieldCheck },
    { id: 'health', label: 'System / Data Health', icon: Activity }
  ];

  return (
    <aside className="sidebar-container">
      {/* Brand Header */}
      <div className="sidebar-header" style={{ position: 'relative' }}>
        <img src="/logo.png" alt="PLOT360" className="sidebar-logo" />
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-title">
            PLOT<span>360</span>
          </div>
          <div className="sidebar-brand-tagline">From Boundaries to Insights</div>
        </div>

        {/* Mobile Close Button */}
        <button
          className="mobile-close-btn"
          onClick={() => setSidebarMobileOpen(false)}
          title="Close Navigation Menu"
          aria-label="Close Menu"
          style={{
            display: 'none',
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Primary Navigation */}
      <nav className="sidebar-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
              title={t ? t('nav.' + item.id, item.label) : item.label}
            >
              <Icon className="nav-item-icon" />
              <span className="sidebar-label">{t ? t('nav.' + item.id, item.label) : item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Secondary Navigation Footer */}
      <div className="sidebar-footer">
        <button
          className={`nav-item ${isPresentationActive ? 'active' : ''}`}
          onClick={() => { openPresentation(); setSidebarMobileOpen(false); }}
          title={t ? t('nav.presentation', 'Presentation Mode') : 'Presentation Mode'}
          aria-label={t ? t('nav.presentation', 'Presentation Mode') : 'Presentation Mode'}
        >
          <Tv className="nav-item-icon" />
          <span className="sidebar-label">{t ? t('nav.presentation', 'Presentation Mode') : 'Presentation Mode'}</span>
        </button>
        <button
          className="nav-item"
          onClick={() => { setHelpModalOpen(true); setSidebarMobileOpen(false); }}
          title={t ? t('nav.help', 'Help') : 'Help'}
        >
          <HelpCircle className="nav-item-icon" />
          <span className="sidebar-label">{t ? t('nav.help', 'Help') : 'Help'}</span>
        </button>
        <button
          className="nav-item"
          onClick={() => handleNavClick('admin')}
          title={t ? t('nav.profile', 'User Profile') : 'User Profile'}
        >
          <User className="nav-item-icon" />
          <span className="sidebar-label">{t ? t('nav.profile', 'User Profile') : 'User Profile'}</span>
        </button>
      </div>
    </aside>
  );
}
