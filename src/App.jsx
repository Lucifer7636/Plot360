import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import LandExplorerPage from './components/land-explorer/LandExplorerPage';
import ParcelIntelligenceModule from './components/modules/ParcelIntelligenceModule';
import GovernanceModule from './components/modules/GovernanceModule';
import PlanningModule from './components/modules/PlanningModule';
import CitizenServicesModule from './components/modules/CitizenServicesModule';
import AnalyticsAiModule from './components/modules/AnalyticsAiModule';
import IntegrationHubModule from './components/modules/IntegrationHubModule';
import AdminSecurityModule from './components/modules/AdminSecurityModule';
import SystemHealthModule from './components/modules/SystemHealthModule';
import PresentationModeModal from './components/modules/PresentationModeModal';
import UnifiedParcelModal from './components/parcel/UnifiedParcelModal';
import ViewEvidenceModal from './components/ai/ViewEvidenceModal';
import FieldVerificationModal from './components/ai/FieldVerificationModal';

import './styles/variables.css';
import './styles/layout.css';
import './styles/components.css';

function MainApp() {
  const { activeModule, deviceMode, lightweightMode, sidebarMobileOpen, setSidebarMobileOpen } = useApp();

  return (
    <div className={`app-shell mode-${deviceMode} ${lightweightMode ? 'mode-lightweight' : ''} ${sidebarMobileOpen ? 'sidebar-mobile-open' : ''}`}>
      {/* Mobile Drawer Backdrop */}
      <div
        className="sidebar-backdrop"
        onClick={() => setSidebarMobileOpen(false)}
        aria-hidden="true"
      />

      {/* 1. Primary Left Sidebar */}
      <Sidebar />

      {/* 2. Main Application Area */}
      <div className="main-content">
        {/* Topbar */}
        <Topbar />

        {/* Dynamic Module Rendering */}
        {activeModule === 'explorer' && <LandExplorerPage />}
        {activeModule === 'intelligence' && <ParcelIntelligenceModule />}
        {activeModule === 'records' && <GovernanceModule />}
        {activeModule === 'planning' && <PlanningModule />}
        {activeModule === 'citizen' && <CitizenServicesModule />}
        {activeModule === 'analytics' && <AnalyticsAiModule />}
        {activeModule === 'integrations' && <IntegrationHubModule />}
        {activeModule === 'admin' && <AdminSecurityModule />}
        {activeModule === 'health' && <SystemHealthModule />}
      </div>

      {/* Global Modals & Persistent Overlays */}
      <PresentationModeModal />
      <UnifiedParcelModal />
      <ViewEvidenceModal />
      <FieldVerificationModal />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
