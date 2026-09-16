/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PhoneChassis } from './components/PhoneChassis';
import { Calculator } from './components/Calculator';
import { FirstTimeSetup } from './components/FirstTimeSetup';
import { Dashboard } from './components/Dashboard';
import { BlockedAppOverlay } from './components/BlockedAppOverlay';
import { PlayStoreProtectionModal } from './components/PlayStoreProtectionModal';
import { UnknownSourcesModal } from './components/UnknownSourcesModal';
import { SecurityStatusModal } from './components/SecurityStatusModal';
import { AntiBypassSecurityModal } from './components/AntiBypassSecurityModal';
import { AndroidProjectExporter } from './components/AndroidProjectExporter';
import { AppItem, BlockerConfig } from './types';
import { INITIAL_APPS } from './data/defaultApps';
import { DEFAULT_SALT, hashPinWithSalt } from './utils/security';
import { ShieldCheck, RotateCw } from 'lucide-react';

const STORAGE_KEY_APPS = 'calc_appblocker_apps_v1';
const STORAGE_KEY_CONFIG = 'calc_appblocker_config_v1';

export default function App() {
  const [isFrameMode, setIsFrameMode] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'calculator' | 'onboarding' | 'dashboard'>('calculator');

  // Apps state
  const [apps, setApps] = useState<AppItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_APPS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_APPS;
      }
    }
    return INITIAL_APPS;
  });

  // Blocker configuration state
  const [config, setConfig] = useState<BlockerConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      adminPinHash: '',
      adminPinSalt: DEFAULT_SALT,
      secretCalculatorCode: '2580', // Default code 2580
      recoveryCode: 'M31S-77K9-B482-SAFE',
      isFirstTimeSetupComplete: false,
      protectionMode: 'standard',
      deviceAdminEnabled: true,
      accessibilityServiceEnabled: true,
      usageStatsEnabled: true,
      overlayPermissionEnabled: true,
      unknownSourcesRestricted: true,
      playStoreProtectionEnabled: true,
      rebootPersistenceVerified: true,
      failedPinAttempts: 0,
      lockoutUntilTimestamp: null,
      temporaryUnlocks: {},
      lastRebootCheckTimestamp: Date.now(),
    };
  });

  // Modals
  const [activeBlockedApp, setActiveBlockedApp] = useState<AppItem | null>(null);
  const [showPlayStoreModal, setShowPlayStoreModal] = useState<boolean>(false);
  const [showUnknownSourcesModal, setShowUnknownSourcesModal] = useState<boolean>(false);
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [showProjectExporter, setShowProjectExporter] = useState<boolean>(false);
  const [rebootNotification, setRebootNotification] = useState<string | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_APPS, JSON.stringify(apps));
  }, [apps]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  }, [config]);

  // Handle secret calculation unlock
  const handleSecretCodeEntered = () => {
    if (!config.isFirstTimeSetupComplete) {
      setViewMode('onboarding');
    } else {
      setViewMode('dashboard');
    }
  };

  // Toggle app blocking state
  const handleToggleAppBlock = (appId: string) => {
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, isBlocked: !a.isBlocked, installProtection: !a.isBlocked } : a))
    );
  };

  // Add custom package
  const handleAddCustomApp = (name: string, packageName: string, category: AppItem['category']) => {
    const newApp: AppItem = {
      id: `app-custom-${Date.now()}`,
      name,
      packageName,
      category,
      isSystemCritical: false,
      isBlocked: true,
      installProtection: true,
      launchCountBlocked: 0,
      iconType: 'shield',
    };
    setApps((prev) => [newApp, ...prev]);
  };

  // Temporary unlock handling
  const handleTemporaryUnlock = (packageName: string, minutes: number) => {
    const expiry = Date.now() + minutes * 60 * 1000;
    setConfig((prev) => ({
      ...prev,
      temporaryUnlocks: { ...prev.temporaryUnlocks, [packageName]: expiry },
    }));
    setActiveBlockedApp(null);
  };

  // Rate-limiting on failed attempts
  const handleFailedPinAttempt = () => {
    setConfig((prev) => {
      const attempts = prev.failedPinAttempts + 1;
      if (attempts >= 5) {
        return {
          ...prev,
          failedPinAttempts: attempts,
          lockoutUntilTimestamp: Date.now() + 30 * 1000, // 30s lockout
        };
      }
      return { ...prev, failedPinAttempts: attempts };
    });
  };

  const handleSuccessfulPin = () => {
    setConfig((prev) => ({
      ...prev,
      failedPinAttempts: 0,
      lockoutUntilTimestamp: null,
    }));
  };

  // Simulate device reboot (testing Section 13 Reboot Protection)
  const handleSimulateReboot = () => {
    setRebootNotification('Restarting Samsung Galaxy M31...');
    setTimeout(() => {
      setRebootNotification('ACTION_BOOT_COMPLETED received: Protection rules & DataStore verified intact!');
      setConfig((prev) => ({
        ...prev,
        rebootPersistenceVerified: true,
        lastRebootCheckTimestamp: Date.now(),
      }));
      setTimeout(() => setRebootNotification(null), 4000);
    }, 1200);
  };

  // Simulate launching an app
  const handleSimulateAppLaunch = (app: AppItem) => {
    const unlockExpiry = config.temporaryUnlocks[app.packageName];
    const isCurrentlyUnlocked = unlockExpiry && unlockExpiry > Date.now();

    if (app.isBlocked && !isCurrentlyUnlocked) {
      // Increment blocked count
      setApps((prev) =>
        prev.map((a) =>
          a.id === app.id
            ? { ...a, launchCountBlocked: a.launchCountBlocked + 1, lastBlockedTime: 'Just now' }
            : a
        )
      );
      setActiveBlockedApp(app);
    } else {
      alert(`Simulated launch: ${app.name} is permitted to open.`);
    }
  };

  // Android navigation controls
  const handleAndroidBack = () => {
    if (activeBlockedApp) {
      setActiveBlockedApp(null);
      return;
    }
    if (showPlayStoreModal) {
      setShowPlayStoreModal(false);
      return;
    }
    if (showUnknownSourcesModal) {
      setShowUnknownSourcesModal(false);
      return;
    }
    if (showSecurityModal) {
      setShowSecurityModal(false);
      return;
    }
    if (showStatusModal) {
      setShowStatusModal(false);
      return;
    }
    if (showProjectExporter) {
      setShowProjectExporter(false);
      return;
    }
    if (viewMode === 'dashboard' || viewMode === 'onboarding') {
      setViewMode('calculator');
    }
  };

  const handleAndroidHome = () => {
    setActiveBlockedApp(null);
    setShowPlayStoreModal(false);
    setShowUnknownSourcesModal(false);
    setShowSecurityModal(false);
    setShowStatusModal(false);
    setShowProjectExporter(false);
    setViewMode('calculator');
  };

  return (
    <PhoneChassis
      isFrameMode={isFrameMode}
      onToggleFrameMode={() => setIsFrameMode(!isFrameMode)}
      onAndroidBack={handleAndroidBack}
      onAndroidHome={handleAndroidHome}
      onAndroidRecents={() => alert('Recent Apps: Calculator AppBlocker active')}
    >
      {/* Toast Notification Banner */}
      {rebootNotification && (
        <div className="absolute top-8 left-4 right-4 z-50 bg-emerald-950/95 border border-emerald-500 text-emerald-200 text-xs p-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <RotateCw className="w-4 h-4 text-emerald-400 shrink-0 animate-spin" />
          <span>{rebootNotification}</span>
        </div>
      )}

      {/* Primary View Router */}
      {viewMode === 'calculator' && (
        <Calculator
          onSecretCodeEntered={handleSecretCodeEntered}
          secretCode={config.secretCalculatorCode}
        />
      )}

      {viewMode === 'onboarding' && (
        <FirstTimeSetup
          initialApps={apps}
          onComplete={(newConfig, selectedApps) => {
            setConfig((prev) => ({ ...prev, ...newConfig }));
            setApps(selectedApps);
            setViewMode('dashboard');
          }}
          onCancel={() => setViewMode('calculator')}
        />
      )}

      {viewMode === 'dashboard' && (
        <Dashboard
          apps={apps}
          config={config}
          onToggleAppBlock={handleToggleAppBlock}
          onAddCustomApp={handleAddCustomApp}
          onOpenPlayStoreProtection={() => setShowPlayStoreModal(true)}
          onOpenUnknownSources={() => setShowUnknownSourcesModal(true)}
          onOpenSecurityModal={() => setShowSecurityModal(true)}
          onOpenStatusModal={() => setShowStatusModal(true)}
          onOpenProjectExporter={() => setShowProjectExporter(true)}
          onSimulateAppLaunch={handleSimulateAppLaunch}
          onLockBackToCalculator={() => setViewMode('calculator')}
        />
      )}

      {/* Sub-Modals and Overlays */}
      {activeBlockedApp && (
        <BlockedAppOverlay
          app={activeBlockedApp}
          config={config}
          onReturnHome={() => {
            setActiveBlockedApp(null);
            setViewMode('calculator');
          }}
          onTemporaryUnlock={handleTemporaryUnlock}
          onFailedAttempt={handleFailedPinAttempt}
          onSuccessfulPin={handleSuccessfulPin}
        />
      )}

      {showPlayStoreModal && (
        <PlayStoreProtectionModal
          config={config}
          onClose={() => setShowPlayStoreModal(false)}
          onToggleManagedMode={(enabled) =>
            setConfig((prev) => ({ ...prev, protectionMode: enabled ? 'managed' : 'standard' }))
          }
        />
      )}

      {showUnknownSourcesModal && (
        <UnknownSourcesModal
          config={config}
          onClose={() => setShowUnknownSourcesModal(false)}
          onToggleStatus={(restricted) =>
            setConfig((prev) => ({ ...prev, unknownSourcesRestricted: restricted }))
          }
        />
      )}

      {showSecurityModal && (
        <AntiBypassSecurityModal
          config={config}
          onClose={() => setShowSecurityModal(false)}
          onUpdateConfig={(updated) => setConfig((prev) => ({ ...prev, ...updated }))}
          onSimulateReboot={handleSimulateReboot}
        />
      )}

      {showStatusModal && (
        <SecurityStatusModal
          config={config}
          blockedAppsCount={apps.filter((a) => a.isBlocked).length}
          onClose={() => setShowStatusModal(false)}
          onRunAudit={() =>
            setConfig((prev) => ({ ...prev, rebootPersistenceVerified: true }))
          }
        />
      )}

      {showProjectExporter && (
        <AndroidProjectExporter onClose={() => setShowProjectExporter(false)} />
      )}
    </PhoneChassis>
  );
}
