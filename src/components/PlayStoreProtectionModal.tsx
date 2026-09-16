/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShoppingBag,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Lock,
  CheckCircle2,
  SlidersHorizontal,
  Fingerprint
} from 'lucide-react';
import { BlockerConfig } from '../types';

interface PlayStoreProtectionModalProps {
  config: BlockerConfig;
  onClose: () => void;
  onToggleManagedMode: (enabled: boolean) => void;
}

export const PlayStoreProtectionModal: React.FC<PlayStoreProtectionModalProps> = ({
  config,
  onClose,
  onToggleManagedMode,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'guide'>('status');

  return (
    <div className="absolute inset-0 bg-neutral-900 z-50 flex flex-col text-neutral-100 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Play Store Protection</h2>
            <p className="text-[10px] text-neutral-400">Android 12 Policy Architecture</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs"
        >
          Close
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Core Transparent Limitation Notice (Mandatory from Section 7) */}
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Official Android Security Architecture</span>
          </div>
          <p className="leading-relaxed text-amber-300/90">
            "Android does not allow a normal application to completely control Google Play installations. For stronger protection, this device must be enrolled in an Android-managed/device-owner configuration."
          </p>
        </div>

        {/* Current State Indicator */}
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">Current Device Profile</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              config.protectionMode === 'managed'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-neutral-800 text-neutral-300'
            }`}>
              {config.protectionMode === 'managed' ? 'MANAGED MODE (ACTIVE)' : 'STANDARD MODE (ACTIVE)'}
            </span>
          </div>

          <div className="text-xs text-neutral-300 space-y-1">
            <div className="font-medium text-white">Detection of Reinstalled Apps:</div>
            <p className="text-neutral-400 leading-relaxed">
              If an app on your blocklist (such as Instagram or TikTok) is uninstalled and reinstalled from Google Play, Calculator AppBlocker detects the new package via <span className="font-mono text-emerald-400">PACKAGE_ADDED</span> broadcast and immediately re-applies the blocking shield!
            </p>
          </div>
        </div>

        {/* Guided Alternatives for Complete Protection */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Safe Google Play Hardening Guide
          </h3>

          <div className="p-3 bg-neutral-800/40 border border-neutral-700/40 rounded-xl space-y-2">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">
                1
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Enable Google Play Parental Controls</div>
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                  Open Google Play &gt; Profile icon (top right) &gt; Settings &gt; Family &gt; Parental controls. Turn ON and set a separate 4-digit PIN to restrict app downloads by age rating (Teen, Everyone, Mature).
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-neutral-800/40 border border-neutral-700/40 rounded-xl space-y-2">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">
                2
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Require Biometric Authentication for Downloads</div>
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                  In Play Store Settings &gt; Authentication &gt; Require authentication for purchases &gt; select "For all purchases through Google Play on this device".
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-neutral-800/40 border border-neutral-700/40 rounded-xl space-y-2">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">
                3
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Protect Google Play Store App itself</div>
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                  You can also add Google Play Store (<span className="font-mono text-neutral-300">com.android.vending</span>) to your Calculator AppBlocker protected list to prevent opening the store altogether.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Device Owner Toggle */}
        <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-xs text-white">Advanced Device Owner Simulation</div>
            <button
              onClick={() => onToggleManagedMode(config.protectionMode !== 'managed')}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                config.protectionMode === 'managed'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {config.protectionMode === 'managed' ? 'Switch to Standard' : 'Simulate Managed'}
            </button>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            In Managed Mode, the app utilizes DevicePolicyManager policies such as <span className="font-mono text-neutral-300">addUserRestriction(DISALLOW_INSTALL_APPS)</span> without deleting user documents.
          </p>
        </div>
      </div>
    </div>
  );
};
