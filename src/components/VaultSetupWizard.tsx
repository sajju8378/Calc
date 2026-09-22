/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Image as ImageIcon,
  Video as VideoIcon,
  Shield,
  Check,
  ArrowRight,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { VaultConfig } from '../types';

interface VaultSetupWizardProps {
  onComplete: (config: Partial<VaultConfig>) => void;
  onCancel: () => void;
}

export const VaultSetupWizard: React.FC<VaultSetupWizardProps> = ({
  onComplete,
  onCancel,
}) => {
  const [step, setStep] = useState<number>(1);
  const [pin, setPin] = useState<string>('2580');
  const [confirmPin, setConfirmPin] = useState<string>('2580');
  const [decoyPin, setDecoyPin] = useState<string>('1111');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [securityQuestion, setSecurityQuestion] = useState<string>('What was the name of your first school?');
  const [securityAnswer, setSecurityAnswer] = useState<string>('Lincoln High');

  const handleNextFromPin = () => {
    if (pin.length < 4 || pin.length > 8) {
      setError('PIN must be between 4 and 8 digits.');
      return;
    }
    if (!/^\d+$/.test(pin)) {
      setError('PIN must contain numbers only.');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match. Please re-enter.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleFinish = () => {
    onComplete({
      secretCalculatorCode: pin,
      decoyCalculatorCode: decoyPin || '1111',
      securityQuestion,
      securityAnswer,
      isFirstTimeSetupComplete: true,
    });
  };

  return (
    <div className="flex-1 bg-[#121316] text-white flex flex-col justify-between p-5 overflow-y-auto select-none">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Calculator Vault Setup</h2>
              <p className="text-[11px] text-neutral-400">Step {step} of 2</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            Skip (Use Default 2580)
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex gap-1.5 my-4">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-neutral-800'}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-neutral-800'}`} />
        </div>

        {/* Step 1: Set Secret PIN */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Set Your Calculator Passcode</h3>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto mt-1">
                Enter your secret numbers in the calculator and press <span className="text-emerald-400 font-bold">=</span> to unlock your hidden photos, videos, and apps.
              </p>
            </div>

            <div className="space-y-3 bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Secret Master PIN</label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={8}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value.replace(/\D/g, ''));
                      setError(null);
                    }}
                    placeholder="Enter 4-8 digits (e.g. 2580)"
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-mono tracking-widest text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-white"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Confirm Secret Master PIN</label>
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={8}
                  value={confirmPin}
                  onChange={(e) => {
                    setConfirmPin(e.target.value.replace(/\D/g, ''));
                    setError(null);
                  }}
                  placeholder="Re-enter PIN"
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-mono tracking-widest text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {error && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 pt-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
              <span className="font-semibold text-neutral-300 block">How Unlocking Works:</span>
              <p>• The calculator acts as a 100% functional normal calculator for anyone else.</p>
              <p>• Whenever you type your PIN and press <span className="text-emerald-400 font-bold">=</span>, the secret vault unlocks!</p>
            </div>
          </div>
        )}

        {/* Step 2: Decoy PIN & Security Question */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-2 border border-amber-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Decoy PIN & Recovery</h3>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto mt-1">
                A fake secondary PIN to protect you under pressure, plus account recovery.
              </p>
            </div>

            <div className="space-y-3 bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-0.5">
                  Decoy Fake PIN (Duress Mode)
                </label>
                <p className="text-[11px] text-neutral-400 mb-1.5">
                  Entering this PIN unlocks a fake empty vault if someone forces you to open the app.
                </p>
                <input
                  type="text"
                  maxLength={8}
                  value={decoyPin}
                  onChange={(e) => setDecoyPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 1111"
                  className="w-full px-4 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-mono tracking-widest text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 border-t border-neutral-800">
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Security Recovery Question
                </label>
                <input
                  type="text"
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs mb-2 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Your secret answer"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300">
              ✓ Setup complete! Press "Activate Disguise" to return to the calculator.
            </div>
          </div>
        )}
      </div>

      {/* Footer Nav */}
      <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
        {step === 1 ? (
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-xs text-neutral-400 hover:text-white"
          >
            Cancel
          </button>
        ) : (
          <button
            onClick={() => setStep(1)}
            className="px-4 py-2 rounded-full text-xs text-neutral-400 hover:text-white"
          >
            Back
          </button>
        )}

        {step === 1 ? (
          <button
            onClick={handleNextFromPin}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow-lg shadow-emerald-950 transition-all"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow-lg shadow-emerald-950 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Activate Calculator Disguise</span>
          </button>
        )}
      </div>
    </div>
  );
};
