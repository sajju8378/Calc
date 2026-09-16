/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileCode,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Lock,
  ChevronRight,
  Info
} from 'lucide-react';
import { BlockerConfig } from '../types';

interface UnknownSourcesModalProps {
  config: BlockerConfig;
  onClose: () => void;
  onToggleStatus: (restricted: boolean) => void;
}

export const UnknownSourcesModal: React.FC<UnknownSourcesModalProps> = ({
  config,
  onClose,
  onToggleStatus,
}) => {
  const [showSimulatedAndroidSettings, setShowSimulatedAndroidSettings] = useState<boolean>(false);
  const [appToggles, setAppToggles] = useState<Record<string, boolean>>({
    'com.android.chrome': false,
    'com.sec.android.app.myfiles': false,
    'com.whatsapp': false,
    'com.google.android.apps.docs': false,
  });

  const isFullyProtected = !Object.values(appToggles).some(Boolean);

  const handleToggleApp = (pkg: string) => {
    const updated = { ...appToggles, [pkg]: !appToggles[pkg] };
    setAppToggles(updated);
    const protectedState = !Object.values(updated).some(Boolean);
    onToggleStatus(protectedState);
  };

  return (
    <div className="absolute inset-0 bg-neutral-900 z-50 flex flex-col text-neutral-100 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <FileCode className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Unknown Sources Protection</h2>
            <p className="text-[10px] text-neutral-400">Android 12 Sideloading Defense</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs"
        >
          Close
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Card */}
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">Unknown-source installation:</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
              isFullyProtected
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isFullyProtected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{isFullyProtected ? 'Protected' : 'Action Required'}</span>
            </span>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed">
            In Android 12 on Samsung Galaxy M31, "Unknown sources" is no longer a single global switch. Instead, each app (Chrome, My Files, WhatsApp) must be granted special access individually.
          </p>
        </div>

        {/* Button to Open Android Setting */}
        <button
          onClick={() => setShowSimulatedAndroidSettings(!showSimulatedAndroidSettings)}
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/40"
        >
          <ExternalLink className="w-4 h-4" />
          <span>{showSimulatedAndroidSettings ? 'Hide Setting Walkthrough' : 'Open Android Setting'}</span>
        </button>

        {/* Setting Walkthrough Guide */}
        {showSimulatedAndroidSettings && (
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-700/80 space-y-3 animate-in fade-in duration-150">
            <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-400" />
              <span>Samsung Galaxy M31 (One UI 4.1) Path:</span>
            </div>

            <div className="space-y-1.5 text-xs text-neutral-400 bg-neutral-900 p-3 rounded-xl border border-neutral-800 font-mono">
              <div>1. Open <strong className="text-white">Settings</strong></div>
              <div>2. Tap <strong className="text-white">Apps</strong></div>
              <div>3. Tap <strong className="text-white">⋮ (More options)</strong> at top right</div>
              <div>4. Select <strong className="text-white">Special access</strong></div>
              <div>5. Tap <strong className="text-white">Install unknown apps</strong></div>
              <div>6. Turn <span className="text-rose-400 font-bold">OFF</span> for all browsers & file managers</div>
            </div>

            {/* Interactive Simulator of the Setting */}
            <div className="pt-2 border-t border-neutral-800 space-y-2">
              <div className="text-[11px] text-neutral-400 font-sans">
                Interactive Settings Simulator (test toggling permissions below):
              </div>
              
              <div className="space-y-2">
                {[
                  { pkg: 'com.android.chrome', name: 'Google Chrome' },
                  { pkg: 'com.sec.android.app.myfiles', name: 'Samsung My Files' },
                  { pkg: 'com.whatsapp', name: 'WhatsApp' },
                  { pkg: 'com.google.android.apps.docs', name: 'Google Drive' },
                ].map((item) => (
                  <div
                    key={item.pkg}
                    className="p-2.5 rounded-xl bg-neutral-800/60 border border-neutral-700/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-medium text-white">{item.name}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">{item.pkg}</div>
                    </div>
                    <button
                      onClick={() => handleToggleApp(item.pkg)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                        appToggles[item.pkg]
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {appToggles[item.pkg] ? 'ALLOWED (RISK)' : 'BLOCKED (SAFE)'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Safety Guarantees */}
        <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl text-xs text-neutral-400 space-y-1.5">
          <div className="flex items-center gap-1.5 text-white font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Non-Destructive Guarantee</span>
          </div>
          <p>
            Calculator AppBlocker never modifies system settings without your explicit permission, never installs APKs automatically, and never downloads unknown applications.
          </p>
        </div>
      </div>
    </div>
  );
};
