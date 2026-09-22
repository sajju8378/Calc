/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PhoneChassis } from './components/PhoneChassis';
import { Calculator } from './components/Calculator';
import { VaultDashboard } from './components/VaultDashboard';
import { VaultSetupWizard } from './components/VaultSetupWizard';
import { AndroidProjectExporter } from './components/AndroidProjectExporter';
import { VaultConfig, IntruderLog } from './types';
import { Lock, RotateCw, Sparkles, Shield, Download } from 'lucide-react';

const STORAGE_KEY_VAULT_CONFIG = 'calc_vault_config_v2';
const STORAGE_KEY_INTRUDERS = 'calc_vault_intruders_v2';

const DEFAULT_CONFIG: VaultConfig = {
  secretCalculatorCode: '2580', // Master PIN (enter 2580 and press = )
  decoyCalculatorCode: '1111',  // Decoy PIN (enter 1111 and press = )
  disguiseIcon: 'calculator',
  appNameDisguise: 'Calculator',
  flipToLockEnabled: true,
  intruderSelfieEnabled: true,
  isFirstTimeSetupComplete: true,
  securityQuestion: 'What was the name of your first school?',
  securityAnswer: 'Lincoln High',
  failedPinAttempts: 0,
  cloudSyncSimulated: false,
};

export default function App() {
  const [isFrameMode, setIsFrameMode] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'calculator' | 'vault' | 'setup'>('calculator');
  const [isDecoyMode, setIsDecoyMode] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showExporter, setShowExporter] = useState<boolean>(false);

  // Vault configuration
  const [config, setConfig] = useState<VaultConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_VAULT_CONFIG);
    if (saved) {
      try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      } catch {}
    }
    return DEFAULT_CONFIG;
  });

  // Persist config
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VAULT_CONFIG, JSON.stringify(config));
  }, [config]);

  // Initial welcome toast
  useEffect(() => {
    setToastMessage('Calculator Vault active: Enter 2580 and tap "=" to unlock Master Vault, or 1111 for Decoy.');
    const timer = setTimeout(() => setToastMessage(null), 6000);
    return () => clearTimeout(timer);
  }, []);

  // Unlock Trigger
  const handleSecretCodeEntered = (isDecoy: boolean) => {
    setIsDecoyMode(isDecoy);
    setViewMode('vault');
    setToastMessage(
      isDecoy
        ? '⚠️ Decoy Vault Unlocked (Empty simulated vault for duress)'
        : '✓ Master Vault Unlocked (Photos, Videos & Hidden Apps)'
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Intruder attempt handler
  const handleIntruderAttempt = (wrongPin: string) => {
    if (!config.intruderSelfieEnabled) return;

    // Simulate front-camera snap
    const intruderSnapshots = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    ];
    const randomSnap = intruderSnapshots[Math.floor(Math.random() * intruderSnapshots.length)];

    const now = new Date();
    const newLog: IntruderLog = {
      id: `intruder-${Date.now()}`,
      timestamp: `${now.toLocaleDateString()}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      attemptedCode: wrongPin,
      snapshotUrl: randomSnap,
      reason: 'Wrong Calculator PIN entered',
    };

    const existingLogsStr = localStorage.getItem(STORAGE_KEY_INTRUDERS);
    let existingLogs: IntruderLog[] = [];
    if (existingLogsStr) {
      try {
        existingLogs = JSON.parse(existingLogsStr);
      } catch {}
    }
    const updatedLogs = [newLog, ...existingLogs];
    localStorage.setItem(STORAGE_KEY_INTRUDERS, JSON.stringify(updatedLogs));

    setToastMessage('📸 Front camera captured intruder break-in snapshot!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Lock back to calculator
  const handleLock = () => {
    setViewMode('calculator');
    setIsDecoyMode(false);
    setToastMessage('Vault Locked: Disguised as Calculator');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Navigation handlers
  const handleAndroidBack = () => {
    if (viewMode === 'vault' || viewMode === 'setup') {
      handleLock();
    }
  };

  const handleAndroidHome = () => {
    handleLock();
  };

  return (
    <PhoneChassis
      isFrameMode={isFrameMode}
      onToggleFrameMode={() => setIsFrameMode(!isFrameMode)}
      onAndroidBack={handleAndroidBack}
      onAndroidHome={handleAndroidHome}
      onAndroidRecents={() => {
        if (viewMode === 'vault') {
          handleLock();
        }
      }}
    >
      {/* Toast notifications */}
      {toastMessage && (
        <div className="absolute top-10 left-4 right-4 z-50 bg-neutral-900/95 border border-emerald-500/50 text-emerald-200 text-xs px-3.5 py-2.5 rounded-2xl shadow-2xl flex items-center justify-between gap-2 backdrop-blur-md animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 min-w-0">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate text-[11px] font-medium">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-neutral-400 hover:text-white text-xs shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Primary Views */}
      {viewMode === 'calculator' && (
        <Calculator
          secretCode={config.secretCalculatorCode}
          decoyCode={config.decoyCalculatorCode}
          onSecretCodeEntered={handleSecretCodeEntered}
          onIntruderAttempt={handleIntruderAttempt}
        />
      )}

      {viewMode === 'vault' && (
        <VaultDashboard
          onLock={handleLock}
          config={config}
          onUpdateConfig={(updated) => setConfig(updated)}
          isDecoyMode={isDecoyMode}
        />
      )}

      {viewMode === 'setup' && (
        <VaultSetupWizard
          onComplete={(newConfig) => {
            setConfig((prev) => ({ ...prev, ...newConfig }));
            setViewMode('calculator');
            setToastMessage('Calculator Vault Passcode updated! Type your PIN and tap "=" to unlock.');
            setTimeout(() => setToastMessage(null), 4000);
          }}
          onCancel={() => setViewMode('calculator')}
        />
      )}

      {/* Android Project Exporter Modal */}
      {showExporter && (
        <AndroidProjectExporter onClose={() => setShowExporter(false)} />
      )}
    </PhoneChassis>
  );
}
