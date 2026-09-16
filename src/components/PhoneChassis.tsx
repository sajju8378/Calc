/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Wifi, Battery, Smartphone, Maximize2, Minimize2, ShieldCheck, ArrowLeft, Circle, Square } from 'lucide-react';

interface PhoneChassisProps {
  children: React.ReactNode;
  isFrameMode: boolean;
  onToggleFrameMode: () => void;
  onAndroidBack?: () => void;
  onAndroidHome?: () => void;
  onAndroidRecents?: () => void;
}

export const PhoneChassis: React.FC<PhoneChassisProps> = ({
  children,
  isFrameMode,
  onToggleFrameMode,
  onAndroidBack,
  onAndroidHome,
  onAndroidRecents,
}) => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!isFrameMode) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
        {/* Top bar with quick toggle */}
        <header className="h-12 border-b border-neutral-800 bg-neutral-900/90 px-4 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wide text-neutral-200 uppercase">
              Samsung Galaxy M31 · Android 12 (One UI 4.1)
            </span>
          </div>
          <button
            onClick={onToggleFrameMode}
            className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
            title="Switch to Phone Chassis View"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Phone Frame View</span>
          </button>
        </header>

        <main className="flex-1 relative overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-2 sm:p-6 select-none">
      {/* Device Info & Controls Bar */}
      <div className="w-full max-w-[420px] mb-3 flex items-center justify-between text-xs text-neutral-400 px-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-medium text-neutral-300">Samsung Galaxy M31</span>
          <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-400 font-mono">One UI 4.1</span>
        </div>
        <button
          onClick={onToggleFrameMode}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-neutral-400 hover:underline"
          title="Switch to Fullscreen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Full Window</span>
        </button>
      </div>

      {/* Samsung Galaxy M31 Physical Frame */}
      <div className="relative w-full max-w-[400px] h-[820px] max-h-[92vh] bg-neutral-900 rounded-[44px] p-3 shadow-2xl shadow-black/80 border-[6px] border-neutral-800 ring-1 ring-neutral-700/60 flex flex-col overflow-hidden">
        
        {/* Bezel Edge highlights */}
        <div className="absolute inset-0 rounded-[38px] pointer-events-none border border-white/5" />

        {/* Screen container */}
        <div className="relative flex-1 bg-black rounded-[32px] overflow-hidden flex flex-col border border-neutral-800/40">
          
          {/* Samsung Infinity-U / Punch Hole Camera & Speaker Slot */}
          <div className="absolute top-0 left-0 right-0 h-7 z-40 flex items-center justify-between px-6 bg-transparent text-[11px] text-neutral-300 font-medium">
            <span>{currentTime}</span>

            {/* Central Punch Hole Camera */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2 w-3.5 h-3.5 bg-neutral-950 rounded-full border border-neutral-800 flex items-center justify-center shadow-inner">
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-800/80" />
            </div>

            {/* Status Icons */}
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] tracking-tighter text-neutral-400">LTE</span>
              <Wifi className="w-3 h-3" />
              <div className="flex items-center gap-0.5">
                <span className="text-[10px]">84%</span>
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* App Screen Content */}
          <div className="flex-1 pt-7 pb-8 overflow-y-auto relative flex flex-col">
            {children}
          </div>

          {/* Android 3-Button Navigation Bar (Samsung One UI layout: Recents | Home | Back) */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-black/90 backdrop-blur-sm z-30 flex items-center justify-around px-8 border-t border-neutral-900/60">
            <button
              onClick={onAndroidRecents}
              className="p-2 text-neutral-500 hover:text-neutral-200 active:scale-95 transition-all cursor-pointer"
              title="Recent Apps"
            >
              <div className="flex gap-0.5 items-center">
                <span className="w-0.5 h-3.5 bg-current rounded-full" />
                <span className="w-0.5 h-3.5 bg-current rounded-full" />
                <span className="w-0.5 h-3.5 bg-current rounded-full" />
              </div>
            </button>

            <button
              onClick={onAndroidHome}
              className="p-2 text-neutral-500 hover:text-neutral-200 active:scale-95 transition-all cursor-pointer"
              title="Home"
            >
              <Circle className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              onClick={onAndroidBack}
              className="p-2 text-neutral-500 hover:text-neutral-200 active:scale-95 transition-all cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
