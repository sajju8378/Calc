/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Lock, Home, KeyRound, AlertTriangle, Clock, ArrowLeft, ShieldAlert } from 'lucide-react';
import { AppItem, BlockerConfig } from '../types';
import { hashPinWithSalt } from '../utils/security';

interface BlockedAppOverlayProps {
  app: AppItem;
  config: BlockerConfig;
  onReturnHome: () => void;
  onTemporaryUnlock: (packageName: string, minutes: number) => void;
  onFailedAttempt: () => void;
  onSuccessfulPin: () => void;
}

export const BlockedAppOverlay: React.FC<BlockedAppOverlayProps> = ({
  app,
  config,
  onReturnHome,
  onTemporaryUnlock,
  onFailedAttempt,
  onSuccessfulPin,
}) => {
  const [showPinPrompt, setShowPinPrompt] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(15);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  // Check if currently locked out due to rate-limiting
  useEffect(() => {
    if (!config.lockoutUntilTimestamp) {
      setLockoutRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.ceil((config.lockoutUntilTimestamp! - now) / 1000);
      if (diff <= 0) {
        setLockoutRemaining(0);
        clearInterval(interval);
      } else {
        setLockoutRemaining(diff);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [config.lockoutUntilTimestamp]);

  const handleVerifyPin = async () => {
    if (lockoutRemaining > 0) {
      setErrorMessage(`Too many failed attempts. Locked out for ${lockoutRemaining}s.`);
      return;
    }

    if (!enteredPin) {
      setErrorMessage('Please enter your administrator PIN.');
      return;
    }

    setIsVerifying(true);
    const enteredHash = await hashPinWithSalt(enteredPin, config.adminPinSalt);

    if (enteredHash === config.adminPinHash || enteredPin === config.secretCalculatorCode) {
      onSuccessfulPin();
      onTemporaryUnlock(app.packageName, selectedDuration);
      setShowPinPrompt(false);
      setIsVerifying(false);
    } else {
      setIsVerifying(false);
      setErrorMessage('Incorrect PIN.');
      onFailedAttempt();
      setEnteredPin('');
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#0d0f12] text-white flex flex-col justify-between p-6 sm:p-8 animate-in fade-in duration-200">
      {/* Top Bar showing security context */}
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <span className="font-semibold text-rose-400 tracking-wide uppercase">App Blocked</span>
        </div>
        <span className="font-mono text-[11px] text-neutral-400">Android 12 Security Shield</span>
      </div>

      {/* Center Shield & Content */}
      <div className="flex flex-col items-center text-center my-auto space-y-4 max-w-sm mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-xl shadow-rose-950/30">
          <Lock className="w-10 h-10" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            App Blocked
          </h1>
          <p className="text-neutral-300 text-sm font-medium">
            This application is currently protected.
          </p>
        </div>

        {/* Protected App Details */}
        <div className="w-full bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3 text-xs flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center font-bold text-neutral-200 text-base shrink-0">
            {app.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <div className="font-semibold text-white truncate">{app.name}</div>
            <div className="text-[11px] text-neutral-400 font-mono truncate">{app.packageName}</div>
          </div>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed max-w-xs">
          Your personal data and phone settings are safe. Access to this application has been paused according to your digital wellbeing rules.
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-2.5 max-w-sm mx-auto w-full">
        <button
          onClick={onReturnHome}
          className="w-full py-3.5 rounded-2xl bg-neutral-100 text-neutral-900 hover:bg-white active:scale-[0.98] font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-white/5"
        >
          <Home className="w-4 h-4" />
          <span>Return to Home</span>
        </button>

        <button
          onClick={() => {
            setShowPinPrompt(true);
            setErrorMessage(null);
          }}
          className="w-full py-3 rounded-2xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-200 font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <KeyRound className="w-4 h-4 text-emerald-400" />
          <span>Unlock Temporarily</span>
        </button>
      </div>

      {/* Temporary Unlock Dialog */}
      {showPinPrompt && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-white text-base">Enter Admin PIN</h3>
              </div>
              <button
                onClick={() => setShowPinPrompt(false)}
                className="text-xs text-neutral-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Provide your administrator PIN to temporarily permit access to <strong className="text-neutral-200">{app.name}</strong>.
            </p>

            {/* Duration Selector */}
            <div className="space-y-1">
              <label className="text-xs text-neutral-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Temporary unlock duration:</span>
              </label>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[5, 15, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedDuration(mins)}
                    className={`py-1.5 text-xs rounded-xl border transition-colors cursor-pointer ${
                      selectedDuration === mins
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-300'
                    }`}
                  >
                    {mins === 60 ? '1 Hour' : `${mins} Mins`}
                  </button>
                ))}
              </div>
            </div>

            {/* PIN input */}
            <div className="space-y-2">
              <input
                type="password"
                maxLength={6}
                value={enteredPin}
                disabled={lockoutRemaining > 0 || isVerifying}
                onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter PIN"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                autoFocus
              />

              {lockoutRemaining > 0 ? (
                <div className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/50 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Rate limited: Try again in {lockoutRemaining} seconds</span>
                </div>
              ) : errorMessage ? (
                <div className="text-xs text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              ) : (
                <div className="text-[11px] text-neutral-400 text-center">
                  Protected by rate-limiting: 5 failed tries triggers a 30s pause
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPinPrompt(false)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyPin}
                disabled={lockoutRemaining > 0 || enteredPin.length < 4 || isVerifying}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {isVerifying ? 'Verifying...' : 'Unlock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
