/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Lock, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { HiddenAppItem } from '../types';

interface SimulatedAppLaunchModalProps {
  app: HiddenAppItem;
  onClose: () => void;
  onLockToCalculator: () => void;
}

export const SimulatedAppLaunchModal: React.FC<SimulatedAppLaunchModalProps> = ({
  app,
  onClose,
  onLockToCalculator,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col text-white animate-in zoom-in-95 duration-150">
      {/* Top Bar for Private Sandbox */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
            title="Back to Vault"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: app.iconColor }}
          >
            {app.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">{app.name}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-semibold flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" />
                Vault Sandbox
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">Isolated Container</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onLockToCalculator}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-950/80 border border-rose-500/30 text-rose-400 hover:bg-rose-900 text-xs font-semibold cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Panic Lock</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Simulated App Sandbox Body */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-bold shadow-2xl mb-4"
          style={{ backgroundColor: app.iconColor }}
        >
          {app.name.charAt(0)}
        </div>

        <h2 className="text-xl font-bold text-white mb-1">{app.name}</h2>
        <p className="text-xs text-neutral-400 font-mono mb-4">{app.packageName}</p>

        <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-left space-y-2 mb-6">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Launch Mode:</span>
            <span className="text-emerald-400 font-semibold">Decoupled Vault Sandbox</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Launcher Visibility:</span>
            <span className="text-white font-medium">{app.isHidden ? 'Hidden from Phone' : 'Visible'}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Camouflage Status:</span>
            <span className="text-indigo-400 font-medium">
              {app.isDisguised ? `Disguised as "${app.disguisedName}"` : 'Original Label'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">App Data Cache:</span>
            <span className="text-neutral-300 font-mono">Encrypted (Isolated)</span>
          </div>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed mb-6">
          This app is running in the isolated Vault virtual sandbox. No icon is shown on your device's home launcher, preventing anyone browsing your phone from detecting its installation.
        </p>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950 cursor-pointer transition-all"
        >
          Return to Secret Vault
        </button>
      </div>
    </div>
  );
};
