/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Plus,
  Search,
  Lock,
  LockOpen,
  Settings,
  Shield,
  FileCode,
  ShoppingBag,
  RotateCcw,
  Smartphone,
  Info,
  Layers,
  ChevronRight,
  ExternalLink,
  Code2,
  CheckCircle2,
  Play
} from 'lucide-react';
import { AppItem, BlockerConfig, ProtectionLevel } from '../types';
import { computeProtectionLevel } from '../utils/security';

interface DashboardProps {
  apps: AppItem[];
  config: BlockerConfig;
  onToggleAppBlock: (appId: string) => void;
  onAddCustomApp: (name: string, packageName: string, category: AppItem['category']) => void;
  onOpenPlayStoreProtection: () => void;
  onOpenUnknownSources: () => void;
  onOpenSecurityModal: () => void;
  onOpenStatusModal: () => void;
  onOpenProjectExporter: () => void;
  onSimulateAppLaunch: (app: AppItem) => void;
  onLockBackToCalculator: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  apps,
  config,
  onToggleAppBlock,
  onAddCustomApp,
  onOpenPlayStoreProtection,
  onOpenUnknownSources,
  onOpenSecurityModal,
  onOpenStatusModal,
  onOpenProjectExporter,
  onSimulateAppLaunch,
  onLockBackToCalculator,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'blocked' | 'system'>('all');
  const [showAddAppModal, setShowAddAppModal] = useState<boolean>(false);
  const [newAppName, setNewAppName] = useState<string>('');
  const [newAppPackage, setNewAppPackage] = useState<string>('');
  const [newAppCategory, setNewAppCategory] = useState<AppItem['category']>('Social');
  const [systemWarningApp, setSystemWarningApp] = useState<AppItem | null>(null);

  const blockedApps = apps.filter((a) => a.isBlocked);
  const protectionLevel: ProtectionLevel = computeProtectionLevel(config, blockedApps.length);

  // Filter apps alphabetically & by search
  const filteredApps = apps
    .filter((app) => {
      const matchesSearch =
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.packageName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (filterMode === 'blocked') return app.isBlocked;
      if (filterMode === 'system') return app.isSystemCritical;
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleAppToggleClick = (app: AppItem) => {
    if (app.isSystemCritical && !app.isBlocked) {
      setSystemWarningApp(app);
      return;
    }
    onToggleAppBlock(app.id);
  };

  const handleConfirmCriticalBlock = () => {
    if (systemWarningApp) {
      onToggleAppBlock(systemWarningApp.id);
      setSystemWarningApp(null);
    }
  };

  const handleCreateCustomApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim() || !newAppPackage.trim()) return;
    onAddCustomApp(newAppName.trim(), newAppPackage.trim(), newAppCategory);
    setNewAppName('');
    setNewAppPackage('');
    setShowAddAppModal(false);
  };

  return (
    <div className="flex-1 bg-neutral-900 text-neutral-100 flex flex-col overflow-hidden font-display">
      {/* Top Bar with Title and Disguise Lock */}
      <div className="sticky top-0 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 px-4 py-2.5 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight">AppBlocker</h1>
            <p className="text-[10px] text-neutral-400 font-sans">Samsung Galaxy M31 · Android 12</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenProjectExporter}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-emerald-400 text-xs font-semibold transition-colors cursor-pointer border border-neutral-700/60"
            title="Inspect Android Studio Project Source Code"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Android Studio Code</span>
          </button>

          <button
            onClick={onLockBackToCalculator}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors cursor-pointer"
            title="Return to Calculator disguise"
          >
            <Lock className="w-3.5 h-3.5 text-neutral-400" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Protection Status Banner (Clickable to open detailed report) */}
        <div
          onClick={onOpenStatusModal}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-sm hover:brightness-105 ${
            protectionLevel === 'fully_protected'
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : protectionLevel === 'partially_protected'
              ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                protectionLevel === 'fully_protected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`} />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                {protectionLevel === 'fully_protected' && 'Protection Status: 🟢 Fully Protected'}
                {protectionLevel === 'partially_protected' && 'Protection Status: 🟡 Partially Protected'}
                {protectionLevel === 'disabled' && 'Protection Status: 🔴 Protection Disabled'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-neutral-300 font-sans">
              <span>Audit Details</span>
              <ChevronRight className="w-3 h-3 text-neutral-400" />
            </div>
          </div>
          <p className="text-[11px] text-neutral-300/90 font-sans mt-1">
            {blockedApps.length} app{blockedApps.length === 1 ? '' : 's'} shielded · Local Accessibility Service Active · Tap to view full security audit report
          </p>
        </div>

        {/* Quick Action Navigation Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setShowAddAppModal(true)}
            className="p-2.5 bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/50 rounded-xl text-left transition-colors cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <Plus className="w-4 h-4" />
              <span className="text-[10px] text-neutral-400 font-mono">Custom</span>
            </div>
            <span className="text-xs font-semibold text-white">+ Add App</span>
          </button>

          <button
            onClick={onOpenPlayStoreProtection}
            className="p-2.5 bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/50 rounded-xl text-left transition-colors cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <ShoppingBag className="w-4 h-4" />
              <span className="text-[10px] text-neutral-400 font-mono">Guide</span>
            </div>
            <span className="text-xs font-semibold text-white">Play Store</span>
          </button>

          <button
            onClick={onOpenUnknownSources}
            className="p-2.5 bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/50 rounded-xl text-left transition-colors cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <FileCode className="w-4 h-4" />
              <span className="text-[10px] text-neutral-400 font-mono">APK</span>
            </div>
            <span className="text-xs font-semibold text-white">Unknown Sources</span>
          </button>

          <button
            onClick={onOpenSecurityModal}
            className="p-2.5 bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/50 rounded-xl text-left transition-colors cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <Shield className="w-4 h-4" />
              <span className="text-[10px] text-neutral-400 font-mono">PIN</span>
            </div>
            <span className="text-xs font-semibold text-white">Security</span>
          </button>
        </div>

        {/* Protected Apps List Section */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Installed Applications ({apps.length})
            </h2>
            <div className="text-[11px] text-neutral-400 font-mono">
              {blockedApps.length} BLOCKED
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search applications or packages..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                  filterMode === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                All Apps ({apps.length})
              </button>
              <button
                onClick={() => setFilterMode('blocked')}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                  filterMode === 'blocked'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                Blocked Only ({blockedApps.length})
              </button>
              <button
                onClick={() => setFilterMode('system')}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                  filterMode === 'system'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                System Essential
              </button>
            </div>
          </div>

          {/* Apps Cards List */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {filteredApps.length === 0 ? (
              <div className="text-center py-8 text-xs text-neutral-500">
                No matching applications found.
              </div>
            ) : (
              filteredApps.map((app) => (
                <div
                  key={app.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    app.isBlocked
                      ? 'bg-neutral-950/90 border-rose-900/40 shadow-sm'
                      : 'bg-neutral-950/40 border-neutral-800/60'
                  }`}
                >
                  {/* Left: App icon and names */}
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      app.isBlocked
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : 'bg-neutral-800 text-neutral-300'
                    }`}>
                      {app.name.charAt(0)}
                    </div>

                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white truncate">{app.name}</span>
                        {app.isSystemCritical && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 shrink-0">
                            Critical
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono truncate">
                        {app.packageName}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions (Test Launch & Block/Allow Switch) */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Test Launch simulator button */}
                    <button
                      onClick={() => onSimulateAppLaunch(app)}
                      className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[10px] font-medium text-neutral-300 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Simulate opening this app to verify blocking overlay"
                    >
                      <Play className="w-2.5 h-2.5 text-emerald-400" />
                      <span>Test</span>
                    </button>

                    {/* Status Pill & Switch */}
                    <button
                      onClick={() => handleAppToggleClick(app)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                        app.isBlocked
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${app.isBlocked ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                      <span>{app.isBlocked ? 'BLOCKED' : 'ALLOWED'}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SYSTEM CRITICAL APP WARNING MODAL (Section 4 requirement) */}
      {systemWarningApp && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-900 border border-amber-800/60 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-amber-400">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">System-Critical Application</h3>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              <strong className="text-white">{systemWarningApp.name}</strong> ({systemWarningApp.packageName}) is a core Android system package. Blocking Phone, Emergency, Settings, or System UI can impair basic phone operations and emergency access.
            </p>

            <div className="p-3 bg-amber-950/30 border border-amber-900/40 rounded-xl text-[11px] text-amber-200">
              Calculator AppBlocker's safety policy strongly discourages blocking core phone components.
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setSystemWarningApp(null)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium cursor-pointer"
              >
                Keep Safe (Cancel)
              </button>
              <button
                onClick={handleConfirmCriticalBlock}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
              >
                Block Anyway (Advanced)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOM APP MODAL */}
      {showAddAppModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCustomApp}
            className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Add Application to Shield</h3>
              <button
                type="button"
                onClick={() => setShowAddAppModal(false)}
                className="text-neutral-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-neutral-400">Application Name</label>
                <input
                  type="text"
                  required
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  placeholder="e.g. Threads"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400">Package Name (Android Identifier)</label>
                <input
                  type="text"
                  required
                  value={newAppPackage}
                  onChange={(e) => setNewAppPackage(e.target.value)}
                  placeholder="e.g. com.instagram.barcelona"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400">Category</label>
                <select
                  value={newAppCategory}
                  onChange={(e) => setNewAppCategory(e.target.value as AppItem['category'])}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Social">Social</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Games">Games</option>
                  <option value="Productivity">Productivity</option>
                  <option value="System">System</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddAppModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
              >
                Add App
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
