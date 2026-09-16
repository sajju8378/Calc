/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  KeyRound,
  RotateCw,
  AlertTriangle,
  Check,
  Lock,
  Smartphone,
  Trash2,
  Copy,
  Info
} from 'lucide-react';
import { BlockerConfig } from '../types';
import { hashPinWithSalt } from '../utils/security';

interface AntiBypassSecurityModalProps {
  config: BlockerConfig;
  onClose: () => void;
  onUpdateConfig: (updated: Partial<BlockerConfig>) => void;
  onSimulateReboot: () => void;
}

export const AntiBypassSecurityModal: React.FC<AntiBypassSecurityModalProps> = ({
  config,
  onClose,
  onUpdateConfig,
  onSimulateReboot,
}) => {
  const [activeTab, setActiveTab] = useState<'pin' | 'tamper' | 'reboot' | 'uninstall'>('pin');

  // Change PIN states
  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmNewPin, setConfirmNewPin] = useState<string>('');
  const [pinChangeMessage, setPinChangeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Recovery verification
  const [recoveryInput, setRecoveryInput] = useState<string>('');
  const [recoverySuccess, setRecoverySuccess] = useState<boolean | null>(null);

  const handleChangePin = async () => {
    setPinChangeMessage(null);
    if (!currentPin) {
      setPinChangeMessage({ type: 'error', text: 'Enter your current PIN.' });
      return;
    }

    const currentHash = await hashPinWithSalt(currentPin, config.adminPinSalt);
    if (currentHash !== config.adminPinHash && currentPin !== config.secretCalculatorCode) {
      setPinChangeMessage({ type: 'error', text: 'Current PIN is incorrect.' });
      return;
    }

    if (newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
      setPinChangeMessage({ type: 'error', text: 'New PIN must be 4 to 6 numbers.' });
      return;
    }

    if (newPin !== confirmNewPin) {
      setPinChangeMessage({ type: 'error', text: 'New PIN and confirmation do not match.' });
      return;
    }

    const newSalt = 'm31_oneui4_salt_' + Math.random().toString(36).substring(2, 8);
    const newHash = await hashPinWithSalt(newPin, newSalt);

    onUpdateConfig({
      adminPinHash: newHash,
      adminPinSalt: newSalt,
      secretCalculatorCode: newPin, // sync secret calculator code!
    });

    setPinChangeMessage({ type: 'success', text: 'Administrator PIN successfully updated!' });
    setCurrentPin('');
    setNewPin('');
    setConfirmNewPin('');
  };

  const handleVerifyRecovery = () => {
    if (recoveryInput.trim().toUpperCase() === config.recoveryCode.trim().toUpperCase()) {
      setRecoverySuccess(true);
    } else {
      setRecoverySuccess(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-neutral-900 z-50 flex flex-col text-neutral-100 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Security & Anti-Bypass</h2>
            <p className="text-[10px] text-neutral-400">PIN, Reboot & Uninstall Safety</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs"
        >
          Close
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 px-3 bg-neutral-950/50">
        <button
          onClick={() => setActiveTab('pin')}
          className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'pin'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          PIN Security
        </button>
        <button
          onClick={() => setActiveTab('tamper')}
          className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'tamper'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Anti-Tamper
        </button>
        <button
          onClick={() => setActiveTab('reboot')}
          className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'reboot'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Reboot
        </button>
        <button
          onClick={() => setActiveTab('uninstall')}
          className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'uninstall'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Uninstall
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 space-y-4">
        {/* TAB 1: PIN MANAGEMENT */}
        {activeTab === 'pin' && (
          <div className="space-y-4">
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Change Administrator PIN
              </h3>

              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-neutral-400">Current PIN</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter current PIN"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-neutral-400">New PIN (4–6 digits)</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter new PIN"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-neutral-400">Confirm New PIN</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Re-enter new PIN"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>

                {pinChangeMessage && (
                  <div
                    className={`text-xs p-2 rounded-xl flex items-center gap-1.5 ${
                      pinChangeMessage.type === 'success'
                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                        : 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
                    }`}
                  >
                    {pinChangeMessage.type === 'success' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    <span>{pinChangeMessage.text}</span>
                  </div>
                )}

                <button
                  onClick={handleChangePin}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer mt-1"
                >
                  Save New PIN
                </button>
              </div>
            </div>

            {/* Secret Calculator Sequence info */}
            <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl text-xs text-neutral-300 space-y-1">
              <div className="font-semibold text-white">Calculator Trigger Code:</div>
              <p className="text-neutral-400 leading-relaxed">
                When typed into the calculator followed by <span className="font-mono text-emerald-400">=</span>, your Administrator PIN will open this AppBlocker dashboard.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: ANTI-TAMPER & RECOVERY */}
        {activeTab === 'tamper' && (
          <div className="space-y-4">
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Emergency Recovery Code
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                  Saved Offline
                </span>
              </div>

              <div className="p-3 bg-neutral-900 rounded-xl text-center font-mono text-base font-bold text-emerald-400 border border-neutral-800 select-all">
                {config.recoveryCode}
              </div>

              <div className="space-y-2 pt-1">
                <div className="text-[11px] text-neutral-400">Test Recovery Code:</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={recoveryInput}
                    onChange={(e) => setRecoveryInput(e.target.value)}
                    placeholder="Enter recovery code"
                    className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                  <button
                    onClick={handleVerifyRecovery}
                    className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs text-white rounded-xl cursor-pointer"
                  >
                    Verify
                  </button>
                </div>

                {recoverySuccess === true && (
                  <div className="text-xs text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Recovery Code verified! Keeps you from getting locked out.</span>
                  </div>
                )}
                {recoverySuccess === false && (
                  <div className="text-xs text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Recovery Code did not match.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rate Limiting Status */}
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2">
              <div className="text-xs font-semibold text-white">Rate-Limit Lockout Status</div>
              <p className="text-xs text-neutral-300">
                Failed attempts: <strong className="text-emerald-400">{config.failedPinAttempts}</strong> / 5.
              </p>
              <p className="text-[11px] text-neutral-400">
                After 5 consecutive incorrect attempts, the app enforces a 30-second cryptographic delay to block brute-force guessing.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: REBOOT PERSISTENCE */}
        {activeTab === 'reboot' && (
          <div className="space-y-4">
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider">
                <RotateCw className="w-4 h-4 text-emerald-400" />
                <span>Reboot Persistence Simulator</span>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                When Samsung Galaxy M31 powers off or restarts, Android emits the <span className="font-mono text-emerald-400">ACTION_BOOT_COMPLETED</span> broadcast.
              </p>

              <div className="p-3 bg-neutral-900 rounded-xl text-xs text-neutral-400 space-y-1">
                <div className="text-white font-medium">Reboot Receiver Verification:</div>
                <div className="font-mono text-[11px] text-emerald-300">
                  com.safe.calculatorappblocker.receiver.BootCompletedReceiver
                </div>
                <div className="text-[11px]">Status: Active & Registered in AndroidManifest.xml</div>
              </div>

              <button
                onClick={onSimulateReboot}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 border border-neutral-700"
              >
                <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simulate Phone Restart & Test Persistence</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: UNINSTALL SAFETY */}
        {activeTab === 'uninstall' && (
          <div className="space-y-4">
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Device Admin & Safe Removal
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                  config.deviceAdminEnabled
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {config.deviceAdminEnabled ? 'ADMIN ACTIVE' : 'STANDARD'}
                </span>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                {config.deviceAdminEnabled
                  ? 'Device Administration is active. If someone attempts to drag the calculator app to "Uninstall" on the home screen, Android requires deactivation of Device Admin first.'
                  : '"Android does not allow this app to prevent its own uninstallation without Device Administrator privileges."'}
              </p>

              {/* Legitimate Safe Removal Instructions */}
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs space-y-2">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-400" />
                  <span>How to legitimately uninstall:</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-neutral-400 text-[11px]">
                  <li>Enter your Admin PIN into this screen.</li>
                  <li>Tap the toggle below to deactivate Device Administration.</li>
                  <li>You can now safely uninstall the app from Samsung Settings or Google Play.</li>
                </ol>
              </div>

              <button
                onClick={() => onUpdateConfig({ deviceAdminEnabled: !config.deviceAdminEnabled })}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  config.deviceAdminEnabled
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                {config.deviceAdminEnabled ? 'Deactivate Device Administration' : 'Activate Device Administration'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
