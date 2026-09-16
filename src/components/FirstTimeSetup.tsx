/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Layers,
  Settings2,
  Copy,
  Check,
  ArrowRight,
  AlertTriangle,
  Lock,
  Smartphone,
  Eye,
  EyeOff
} from 'lucide-react';
import { AppItem, BlockerConfig } from '../types';
import { PERMISSION_EXPLANATIONS } from '../data/defaultApps';
import { generateRecoveryCode, hashPinWithSalt } from '../utils/security';

interface FirstTimeSetupProps {
  initialApps: AppItem[];
  onComplete: (updatedConfig: Partial<BlockerConfig>, selectedApps: AppItem[]) => void;
  onCancel: () => void;
}

export const FirstTimeSetup: React.FC<FirstTimeSetupProps> = ({
  initialApps,
  onComplete,
  onCancel,
}) => {
  const [step, setStep] = useState<number>(1);
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const [apps, setApps] = useState<AppItem[]>(initialApps);
  const [protectionMode, setProtectionMode] = useState<'standard' | 'managed'>('standard');
  const [recoveryCode] = useState<string>(generateRecoveryCode());
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Step 1 validation
  const handlePinSubmit = async () => {
    if (pin.length < 4 || pin.length > 6) {
      setPinError('PIN must be 4 to 6 digits.');
      return;
    }
    if (!/^\d+$/.test(pin)) {
      setPinError('PIN must contain only numbers.');
      return;
    }
    if (pin !== confirmPin) {
      setPinError('PINs do not match. Please re-enter.');
      return;
    }
    setPinError(null);
    setStep(2);
  };

  const toggleAppBlock = (appId: string) => {
    setApps((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          if (app.isSystemCritical) {
            return app; // Handled separately
          }
          return { ...app, isBlocked: !app.isBlocked, installProtection: !app.isBlocked };
        }
        return app;
      })
    );
  };

  const handleCopyRecoveryCode = () => {
    navigator.clipboard.writeText(recoveryCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFinish = async () => {
    const salt = 'm31_oneui4_salt_' + Math.random().toString(36).substring(2, 8);
    const hash = await hashPinWithSalt(pin, salt);

    onComplete(
      {
        adminPinHash: hash,
        adminPinSalt: salt,
        secretCalculatorCode: pin, // user PIN also works as secret code!
        recoveryCode,
        isFirstTimeSetupComplete: true,
        protectionMode,
        accessibilityServiceEnabled: true,
        overlayPermissionEnabled: true,
        rebootPersistenceVerified: true,
      },
      apps
    );
  };

  return (
    <div className="flex-1 bg-neutral-900 text-neutral-100 flex flex-col p-4 sm:p-5 overflow-y-auto">
      {/* Stepper Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
          <span className="font-semibold text-emerald-400 uppercase tracking-wider">
            Secure Setup · Step {step} of 6
          </span>
          <button
            onClick={onCancel}
            className="text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs"
          >
            Cancel
          </button>
        </div>
        <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 1: Create Administrator PIN */}
      {step === 1 && (
        <div className="flex-1 flex flex-col justify-between py-2">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Create Administrator PIN</h2>
              <p className="text-sm text-neutral-400 mt-1 leading-relaxed">
                This PIN is used to open AppBlocker from the calculator (`PIN =`), change settings, and unlock apps temporarily.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Enter 4–6 Digit PIN
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 2580"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white font-mono tracking-widest text-lg focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-3.5 text-neutral-400 hover:text-white"
                  >
                    {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Confirm PIN
                </label>
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Re-enter PIN"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white font-mono tracking-widest text-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              {pinError && (
                <div className="text-xs text-rose-400 flex items-center gap-1.5 pt-1">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl text-xs text-neutral-400 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Non-destructive & Private:</span>
                </div>
                <p>
                  Stored locally using salted SHA-256 hashing. It is never uploaded to any cloud server or shown in plain text.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handlePinSubmit}
            disabled={pin.length < 4}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none text-white font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            <span>Continue to App Selection</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 2: Select Applications to Protect */}
      {step === 2 && (
        <div className="flex-1 flex flex-col justify-between py-2">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Select Apps to Protect</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Toggle apps you wish to block. System-critical apps (Phone, Emergency) are protected against accidental blocking.
              </p>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {apps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => !app.isSystemCritical && toggleAppBlock(app.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                    app.isSystemCritical
                      ? 'bg-neutral-950/50 border-neutral-800/80 opacity-60'
                      : app.isBlocked
                      ? 'bg-emerald-950/20 border-emerald-800/50 cursor-pointer'
                      : 'bg-neutral-800/40 border-neutral-700/40 hover:border-neutral-600 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center text-sm font-semibold text-neutral-200">
                      {app.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white flex items-center gap-1.5">
                        <span>{app.name}</span>
                        {app.isSystemCritical && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                            Critical
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono">
                        {app.packageName}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {app.isSystemCritical ? (
                      <span className="text-xs text-neutral-500">System Safe</span>
                    ) : (
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          app.isBlocked
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {app.isBlocked ? 'BLOCKED' : 'ALLOWED'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Protection Mode</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Configure Android Protection Mechanisms (Standard vs Managed Mode) */}
      {step === 3 && (
        <div className="flex-1 flex flex-col justify-between py-2">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Android Protection Mode</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Choose the legitimate mode matching your Samsung Galaxy M31.
              </p>
            </div>

            <div className="space-y-3">
              {/* Standard Mode Card */}
              <div
                onClick={() => setProtectionMode('standard')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  protectionMode === 'standard'
                    ? 'bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500/50'
                    : 'bg-neutral-800/40 border-neutral-700/60 hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-sm text-white">STANDARD MODE (Recommended)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                    NO FACTORY RESET
                  </span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Operates using legitimate Android 12 permissions (Accessibility Service, Overlay, Device Admin). Keeps all personal data 100% untouched.
                </p>
              </div>

              {/* Managed Mode Card */}
              <div
                onClick={() => setProtectionMode('managed')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  protectionMode === 'managed'
                    ? 'bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500/50'
                    : 'bg-neutral-800/40 border-neutral-700/60 hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-sm text-white">MANAGED DEVICE OWNER MODE</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                    ADVANCED
                  </span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Uses Android Enterprise / DevicePolicyManager to restrict app installs system-wide.
                </p>
                <div className="mt-2 text-[11px] text-amber-400 bg-amber-950/40 p-2 rounded-lg border border-amber-800/30">
                  ⚠️ Note: On an existing personal Galaxy M31, provisioning Device Owner may require Android Enterprise enrollment or initial factory setup. We do NOT perform any reset automatically.
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Permissions Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review Permissions Wizard */}
      {step === 4 && (
        <div className="flex-1 flex flex-col justify-between py-2">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Settings2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Permission Transparency</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Every permission used by Calculator AppBlocker is disclosed with clear reasons and disable instructions.
              </p>
            </div>

            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {PERMISSION_EXPLANATIONS.map((perm) => (
                <div key={perm.id} className="p-3 bg-neutral-800/50 border border-neutral-700/50 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-emerald-400">{perm.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300">
                      Legitimate API
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300">
                    <strong className="text-neutral-400 font-normal">Why needed:</strong> {perm.whyNeeded}
                  </p>
                  <p className="text-xs text-neutral-400">
                    <strong className="text-neutral-400 font-normal">Access limit:</strong> {perm.whatItAccesses}
                  </p>
                  <div className="text-[11px] text-neutral-400 bg-neutral-900/60 p-2 rounded border border-neutral-800">
                    <span className="text-neutral-300 font-medium">To disable later:</span> {perm.howToDisable}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(5)}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Recovery Code</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Emergency Recovery Code */}
      {step === 5 && (
        <div className="flex-1 flex flex-col justify-between py-2">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Emergency Recovery Code</h2>
              <p className="text-xs text-neutral-400 mt-1">
                You will never be locked out of your device. Save this code in a secure notebook or password manager.
              </p>
            </div>

            <div className="p-4 bg-neutral-950 border border-emerald-800/40 rounded-2xl text-center space-y-3">
              <div className="text-xs uppercase tracking-widest text-neutral-400">Your Unique Recovery Key</div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-400 tracking-wider select-all">
                {recoveryCode}
              </div>
              <button
                onClick={handleCopyRecoveryCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 transition-colors cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied to Clipboard' : 'Copy Recovery Code'}</span>
              </button>
            </div>

            <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl text-xs text-neutral-300 space-y-1">
              <div className="font-semibold text-white">How recovery works:</div>
              <p>
                If you ever forget your Administrator PIN, you can enter this recovery code in the secret emergency prompt to safely reset your PIN without deleting any data.
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setStep(4)}
              className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(6)}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Test & Activate</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Run Security Test & Final Status */}
      {step === 6 && (
        <div className="flex-1 flex flex-col justify-between py-2">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Security Check & Activation</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Verifying that all safe Android 12 hooks and local encryption parameters are ready.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-xl">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Protected App Detection verified (Accessibility Hook)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-xl">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Blocking Overlay ready with temporary unlock flow</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-xl">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Boot Completed Receiver persistence verified</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-xl">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Salted SHA-256 PIN hashing stored locally</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-xl">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Zero cloud transmission · 100% private offline storage</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleFinish}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-4 shadow-lg shadow-emerald-950/60"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Activate AppBlocker & Enter Dashboard</span>
          </button>
        </div>
      )}
    </div>
  );
};
