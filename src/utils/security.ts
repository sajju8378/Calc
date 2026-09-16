/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlockerConfig, ProtectionLevel, SecurityAuditResult } from '../types';

export const DEFAULT_SALT = 'm31_oneui4_salt_77a9';

// Safe SHA-256 hasher using Web Crypto
export async function hashPinWithSalt(pin: string, salt: string = DEFAULT_SALT): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${pin}:calculator_appblocker`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateRecoveryCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) result += '-';
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function computeProtectionLevel(config: BlockerConfig, blockedCount: number): ProtectionLevel {
  if (!config.accessibilityServiceEnabled || !config.overlayPermissionEnabled) {
    return 'disabled';
  }
  if (!config.deviceAdminEnabled || !config.unknownSourcesRestricted || blockedCount === 0) {
    return 'partially_protected';
  }
  return 'fully_protected';
}

export function runSecurityDiagnostics(
  config: BlockerConfig,
  blockedAppsCount: number,
): SecurityAuditResult[] {
  const results: SecurityAuditResult[] = [
    {
      id: 'detection_service',
      title: 'Protected App Detection',
      status: config.accessibilityServiceEnabled ? 'passed' : 'failed',
      detail: config.accessibilityServiceEnabled
        ? 'Accessibility service is actively listening for window state transitions of protected packages.'
        : 'Accessibility service is turned off. Protected apps cannot be detected when opened.',
      recommendation: config.accessibilityServiceEnabled
        ? 'Active and operating locally.'
        : 'Enable Accessibility permission in Android Settings.',
      isLegitimateLimit: false,
    },
    {
      id: 'blocking_overlay',
      title: 'Blocking Overlay Mechanism',
      status: config.overlayPermissionEnabled ? 'passed' : 'failed',
      detail: config.overlayPermissionEnabled
        ? 'System Alert Window overlay is authorized to display the "App Blocked" protection screen.'
        : 'Overlay permission is missing. The app cannot draw the blocking shield over other apps.',
      recommendation: config.overlayPermissionEnabled
        ? 'Operating normally with temporary unlock controls.'
        : 'Enable "Appear on top" permission.',
      isLegitimateLimit: false,
    },
    {
      id: 'reboot_persistence',
      title: 'Reboot Persistence & Integrity',
      status: config.rebootPersistenceVerified ? 'passed' : 'warning',
      detail: 'BootCompletedReceiver is registered in AndroidManifest.xml to restore block rules immediately on phone restart.',
      recommendation: 'Configuration persists in local DataStore across all power cycles without cloud dependencies.',
      isLegitimateLimit: false,
    },
    {
      id: 'unknown_sources',
      title: 'Unknown Sources & APK Protection',
      status: config.unknownSourcesRestricted ? 'passed' : 'warning',
      detail: config.unknownSourcesRestricted
        ? 'Android 12 special app access "Install unknown apps" is restricted on Chrome, My Files, and WhatsApp.'
        : 'At least one browser or file manager has permission to sideload APK packages.',
      recommendation: 'Check Unknown Sources Protection guide to disable per-app installation privileges in Settings.',
      isLegitimateLimit: false,
    },
    {
      id: 'device_admin',
      title: 'Device Administration & Anti-Uninstall',
      status: config.deviceAdminEnabled ? 'passed' : 'warning',
      detail: config.deviceAdminEnabled
        ? 'Device Administration receiver is active, protecting against casual uninstallation without the Admin PIN.'
        : 'Device Admin is inactive. A user can uninstall Calculator AppBlocker from Samsung Launcher settings.',
      recommendation: 'Activate Device Administration in Security settings for tamper resistance.',
      isLegitimateLimit: false,
    },
    {
      id: 'google_play_limitation',
      title: 'Google Play Store Management Policy',
      status: 'warning',
      detail: config.protectionMode === 'managed'
        ? 'Managed Device Owner mode detected: Google Play installation policy restrictions can be enforced via DevicePolicyManager.'
        : 'Standard Mode: Android 12 does not permit normal third-party applications to unilaterally restrict Google Play downloads without Device Owner provisioning.',
      recommendation: 'Use guided Play Store Parental Controls & biometric authentication requirements.',
      isLegitimateLimit: true,
    },
    {
      id: 'package_configuration',
      title: 'Protected App Ruleset',
      status: blockedAppsCount > 0 ? 'passed' : 'warning',
      detail: `${blockedAppsCount} application${blockedAppsCount === 1 ? '' : 's'} configured with blocking shields.`,
      recommendation: blockedAppsCount > 0 ? 'Rules active and ready.' : 'Add apps to the blocklist from the Dashboard.',
      isLegitimateLimit: false,
    },
  ];

  return results;
}
