/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Info,
  Layers,
  FileCheck
} from 'lucide-react';
import { BlockerConfig, ProtectionLevel, SecurityAuditResult } from '../types';
import { runSecurityDiagnostics } from '../utils/security';

interface SecurityStatusModalProps {
  config: BlockerConfig;
  blockedAppsCount: number;
  onClose: () => void;
  onRunAudit: () => void;
}

export const SecurityStatusModal: React.FC<SecurityStatusModalProps> = ({
  config,
  blockedAppsCount,
  onClose,
  onRunAudit,
}) => {
  const [isRunningTest, setIsRunningTest] = useState<boolean>(false);
  const [auditResults, setAuditResults] = useState<SecurityAuditResult[]>(
    runSecurityDiagnostics(config, blockedAppsCount)
  );

  const passedCount = auditResults.filter((r) => r.status === 'passed').length;
  const warningCount = auditResults.filter((r) => r.status === 'warning').length;
  const failedCount = auditResults.filter((r) => r.status === 'failed').length;

  let overallLevel: ProtectionLevel = 'fully_protected';
  if (failedCount > 0) overallLevel = 'disabled';
  else if (warningCount > 0 || blockedAppsCount === 0) overallLevel = 'partially_protected';

  const handleRunTest = () => {
    setIsRunningTest(true);
    setTimeout(() => {
      setAuditResults(runSecurityDiagnostics(config, blockedAppsCount));
      setIsRunningTest(false);
      onRunAudit();
    }, 600);
  };

  return (
    <div className="absolute inset-0 bg-neutral-900 z-50 flex flex-col text-neutral-100 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Protection Status & Audit</h2>
            <p className="text-[10px] text-neutral-400">Android 12 Transparent Diagnostic</p>
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
        {/* Overall Status Banner */}
        <div className={`p-4 rounded-2xl border space-y-2 ${
          overallLevel === 'fully_protected'
            ? 'bg-emerald-950/30 border-emerald-500/50'
            : overallLevel === 'partially_protected'
            ? 'bg-amber-950/30 border-amber-500/50'
            : 'bg-rose-950/30 border-rose-500/50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                overallLevel === 'fully_protected'
                  ? 'bg-emerald-400 animate-pulse'
                  : overallLevel === 'partially_protected'
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`} />
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                {overallLevel === 'fully_protected' && '🟢 Fully Protected'}
                {overallLevel === 'partially_protected' && '🟡 Partially Protected'}
                {overallLevel === 'disabled' && '🔴 Protection Disabled'}
              </span>
            </div>
            <span className="text-xs text-neutral-400">
              {passedCount}/{auditResults.length} Verified
            </span>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed">
            {overallLevel === 'fully_protected' &&
              'All legitimate Android 12 foreground detection hooks, overlay guards, and local persistence are active.'}
            {overallLevel === 'partially_protected' &&
              'Foreground app protection is active, with transparent documentation of standard Android device limitations.'}
            {overallLevel === 'disabled' &&
              'Required accessibility or overlay permissions are missing. Please re-enable them to protect applications.'}
          </p>
        </div>

        {/* Action Button to Re-test */}
        <button
          onClick={handleRunTest}
          disabled={isRunningTest}
          className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer border border-neutral-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRunningTest ? 'animate-spin' : ''}`} />
          <span>{isRunningTest ? 'Auditing Android Environment...' : 'Run Security Test'}</span>
        </button>

        {/* Protection Report - Itemized List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            <span>Protection Report</span>
            <span className="text-[11px] text-neutral-400 lowercase font-mono">7 automated checks</span>
          </div>

          <div className="space-y-2">
            {auditResults.map((audit) => (
              <div
                key={audit.id}
                className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {audit.status === 'passed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : audit.status === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-white">{audit.title}</span>
                  </div>

                  {audit.isLegitimateLimit && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                      OS Boundary
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-300 pl-6 leading-relaxed">
                  {audit.detail}
                </p>

                <div className="pl-6 text-[11px] text-neutral-400 font-sans flex items-center gap-1">
                  <span className="text-neutral-300 font-medium">Status:</span>
                  <span>{audit.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
