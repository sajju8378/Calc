/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MediaType = 'image' | 'video';

export interface VaultMediaItem {
  id: string;
  title: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  dateAdded: string;
  sizeBytes: number;
  duration?: string; // e.g. "01:24" for videos
  album: string; // e.g. "Camera", "Personal", "Documents", "Favorites"
  isFavorite?: boolean;
  originalFileName?: string;
  width?: number;
  height?: number;
}

export interface VaultAlbum {
  id: string;
  name: string;
  type: 'image' | 'video' | 'mixed';
  icon: string;
}

export interface HiddenAppItem {
  id: string;
  name: string;
  packageName: string;
  category: 'Social' | 'Chat' | 'Banking' | 'Media' | 'Dating' | 'Tools' | 'Games';
  isHidden: boolean; // Hidden from launcher / guarded behind vault
  isDisguised: boolean;
  disguisedName?: string;
  disguisedIcon?: string;
  iconColor: string;
  iconBg: string;
  originalIcon: string;
  appSize: string;
  lastOpened?: string;
}

export interface SecretNote {
  id: string;
  title: string;
  content: string;
  category: 'Passwords' | 'Personal' | 'Cards' | 'General';
  updatedAt: string;
  isPinned?: boolean;
}

export interface IntruderLog {
  id: string;
  timestamp: string;
  attemptedCode: string;
  snapshotUrl: string;
  reason: string;
}

export type CamouflageIcon = 'calculator' | 'notes' | 'weather' | 'clock' | 'radio' | 'compass';

export interface VaultConfig {
  secretCalculatorCode: string; // Master PIN, default "2580"
  decoyCalculatorCode: string;  // Decoy PIN that opens empty/fake vault, default "1111"
  disguiseIcon: CamouflageIcon;
  appNameDisguise: string; // "Calculator", "Notepad", "Weather"
  flipToLockEnabled: boolean;
  intruderSelfieEnabled: boolean;
  isFirstTimeSetupComplete: boolean;
  securityQuestion: string;
  securityAnswer: string;
  failedPinAttempts: number;
  cloudSyncSimulated: boolean;
}

export type VaultActiveTab = 'photos' | 'videos' | 'apps' | 'notes' | 'intruders' | 'settings';

// Legacy compatibility interfaces for blocker exporter components
export type ProtectionLevel =
  | 'fully_protected'
  | 'partially_protected'
  | 'disabled'
  | 'standard'
  | 'strict'
  | 'extreme'
  | 'managed';

export interface AppItem {
  id: string;
  name: string;
  packageName: string;
  category: string;
  isSystemCritical: boolean;
  isBlocked: boolean;
  installProtection: boolean;
  launchCountBlocked: number;
  lastBlockedTime?: string;
  iconType: string;
}

export interface BlockerConfig {
  adminPinHash: string;
  adminPinSalt: string;
  secretCalculatorCode: string;
  recoveryCode: string;
  isFirstTimeSetupComplete: boolean;
  protectionMode: ProtectionLevel;
  deviceAdminEnabled: boolean;
  accessibilityServiceEnabled: boolean;
  usageStatsEnabled: boolean;
  overlayPermissionEnabled: boolean;
  unknownSourcesRestricted: boolean;
  playStoreProtectionEnabled: boolean;
  rebootPersistenceVerified: boolean;
  failedPinAttempts: number;
  lockoutUntilTimestamp: number | null;
  temporaryUnlocks: Record<string, number>;
  lastRebootCheckTimestamp: number;
}

export interface PermissionExplanation {
  id: string;
  name?: string;
  title?: string;
  technicalName?: string;
  androidName?: string;
  purpose?: string;
  whyNeeded?: string;
  whatItAccesses?: string;
  howItIsUsed?: string;
  howToDisable?: string;
  riskIfMissing?: string;
  adbCommand?: string;
  isGranted?: boolean;
  isRequired?: boolean;
}

export interface SecurityAuditResult {
  id?: string;
  passed?: boolean;
  title: string;
  details?: string;
  detail?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: string;
  recommendation?: string;
  isLegitimateLimit?: boolean;
}
