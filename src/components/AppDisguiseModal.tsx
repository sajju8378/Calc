/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Shield,
  EyeOff,
  Eye,
  Sparkles,
  CloudSun,
  Mic,
  FileText,
  Calendar,
  Calculator,
  Radio,
  Clock,
  Compass,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { HiddenAppItem } from '../types';

interface AppDisguiseModalProps {
  app: HiddenAppItem;
  onClose: () => void;
  onUpdateApp: (updated: HiddenAppItem) => void;
  onLaunchIncognito: (app: HiddenAppItem) => void;
}

const CAMOUFLAGE_ICONS = [
  { key: 'CloudSun', label: 'Weather', icon: CloudSun },
  { key: 'Mic', label: 'Voice Memo', icon: Mic },
  { key: 'FileText', label: 'System Notes', icon: FileText },
  { key: 'Calendar', label: 'Calendar', icon: Calendar },
  { key: 'Calculator', label: 'Calculator', icon: Calculator },
  { key: 'Radio', label: 'FM Radio', icon: Radio },
  { key: 'Clock', label: 'Timer / Clock', icon: Clock },
  { key: 'Compass', label: 'Compass', icon: Compass },
];

export const AppDisguiseModal: React.FC<AppDisguiseModalProps> = ({
  app,
  onClose,
  onUpdateApp,
  onLaunchIncognito,
}) => {
  const [isHidden, setIsHidden] = useState<boolean>(app.isHidden);
  const [isDisguised, setIsDisguised] = useState<boolean>(app.isDisguised);
  const [disguisedName, setDisguisedName] = useState<string>(app.disguisedName || 'Simple Utility');
  const [selectedIconKey, setSelectedIconKey] = useState<string>(app.disguisedIcon || 'CloudSun');

  const handleSave = () => {
    onUpdateApp({
      ...app,
      isHidden,
      isDisguised,
      disguisedName,
      disguisedIcon: selectedIconKey,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#18181b] border border-neutral-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shadow-md"
              style={{ backgroundColor: app.iconColor }}
            >
              {app.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">{app.name}</h3>
              <p className="text-xs text-neutral-400 font-mono">{app.packageName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Hide from launcher toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-semibold text-white block">
                  {isHidden ? 'App is Hidden from Phone' : 'App is Visible on Phone'}
                </span>
                <span className="text-[11px] text-neutral-400">
                  {isHidden
                    ? 'Removed from home screen & app drawer'
                    : 'Visible on standard home screen'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsHidden(!isHidden)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                isHidden ? 'bg-emerald-600' : 'bg-neutral-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  isHidden ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Stealth Camouflage Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white block">Stealth Decoy Camouflage</span>
                <span className="text-[11px] text-neutral-400">Disguise app with decoy icon & label</span>
              </div>
            </div>
            <button
              onClick={() => setIsDisguised(!isDisguised)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                isDisguised ? 'bg-indigo-600' : 'bg-neutral-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  isDisguised ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Camouflage Customizer */}
          {isDisguised && (
            <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Decoy App Name
                </label>
                <input
                  type="text"
                  value={disguisedName}
                  onChange={(e) => setDisguisedName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. FM Radio, Notes, Weather"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Decoy Camouflage Icon
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {CAMOUFLAGE_ICONS.map((item) => {
                    const IconComponent = item.icon;
                    const isSelected = selectedIconKey === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setSelectedIconKey(item.key)}
                        className={`p-2 rounded-xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300'
                            : 'bg-neutral-800 border-neutral-700/60 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="text-[10px] truncate max-w-full">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Launch Incognito Inside Vault Button */}
          <button
            onClick={() => {
              onLaunchIncognito(app);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold cursor-pointer border border-neutral-700/60 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-emerald-400" />
            <span>Launch Privately Inside Vault</span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-neutral-800 bg-neutral-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-medium text-neutral-400 hover:text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow-lg transition-all"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
