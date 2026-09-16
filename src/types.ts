/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AppItem {
  id: string;
  name: string;
  packageName: string;
  category: 'Social' | 'Entertainment' | 'Productivity' | 'Games' | 'System';
  isSystemCritical: boolean;
  isBlocked: boolean;
  installProtection: boolean;
  launchCountBlocked: number;
  lastBlockedTime?: string;
  iconType: string;
}

export type ProtectionLevel = 'fully_protected' | 'partially_protected' | 'disabled';

export interface BlockerConfig {
  adminPinHash: string; // SHA-256 salted hash simulation
  adminPinSalt: string;
  secretCalculatorCode: string; // default "2580"
  recoveryCode: string; // e.g. "AB7X-99K2-M31S-SAFE"
  isFirstTimeSetupComplete: boolean;
  protectionMode: 'standard' | 'managed';
  deviceAdminEnabled: boolean;
  accessibilityServiceEnabled: boolean;
  usageStatsEnabled: boolean;
  overlayPermissionEnabled: boolean;
  unknownSourcesRestricted: boolean;
  playStoreProtectionEnabled: boolean;
  rebootPersistenceVerified: boolean;
  failedPinAttempts: number;
  lockoutUntilTimestamp: number | null;
  temporaryUnlocks: Record<string, number>; // packageName -> expiry timestamp
  lastRebootCheckTimestamp: number;
  securityQuestion?: string;
  securityAnswerHash?: string;
  securityAnswerSalt?: string;
}

export interface SecurityAuditResult {
  id: string;
  title: string;
  status: 'passed' | 'warning' | 'failed';
  detail: string;
  recommendation: string;
  isLegitimateLimit: boolean;
}

export interface PermissionExplanation {
  id: string;
  name: string;
  androidName: string;
  whyNeeded: string;
  whatItAccesses: string;
  howItIsUsed: string;
  howToDisable: string;
  isGranted: boolean;
  isRequired: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  appName: string;
  packageName: string;
  action: 'blocked' | 'temporary_unlock' | 'setting_changed' | 'reboot_restored' | 'warning';
  message: string;
}
