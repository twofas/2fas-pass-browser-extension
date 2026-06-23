// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));

// generatePersistentKeys returns a base64 public key; the real Base64ToArrayBuffer /
// ArrayBufferToBase64 auto-imports then run against these values, so they must be valid.
const getBrowserInfo = vi.fn(() => ({ name: 'os', browserName: 'Chrome', browserVersion: '135' }));
const generatePersistentKeys = vi.fn(async () => 'AAAA');
const generateSecurityIcon = vi.fn(async () => {});

vi.mock('../../utils', () => ({
  getBrowserInfo: (...args) => getBrowserInfo(...args),
  generatePersistentKeys: (...args) => generatePersistentKeys(...args),
  generateSecurityIcon: (...args) => generateSecurityIcon(...args)
}));

const compressPublicKey = vi.fn(async () => new Uint8Array([1, 2, 3]).buffer);

vi.mock('@/partials/functions/compressPublicKey', () => ({
  default: (...args) => compressPublicKey(...args)
}));

import migration from './0.js';

const isSafari = import.meta.env.BROWSER === 'safari';

describe('migration 0 — initial default storage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await browser.storage.local.clear();

    if (!browser.idle) {
      browser.idle = {};
    }

    browser.idle.setDetectionInterval = vi.fn();

    // fakeBrowser exposes privacy.services.passwordSavingEnabled but its setter throws,
    // so stub it to a resolved no-op for the migration's final passwordSaving toggle.
    if (browser.privacy?.services?.passwordSavingEnabled) {
      browser.privacy.services.passwordSavingEnabled.set = vi.fn().mockResolvedValue(undefined);
    }
  });

  describe('fresh install (empty storage)', () => {
    it('writes all default values', async () => {
      await migration();

      await expect(storage.getItem('local:browserInfo')).resolves.toEqual({ name: 'os', browserName: 'Chrome', browserVersion: '135' });
      await expect(storage.getItem('local:theme')).resolves.toBe('unset');
      await expect(storage.getItem('local:contextMenu')).resolves.toBe(true);
      await expect(storage.getItem('local:logging')).resolves.toBe(false);
      await expect(storage.getItem('local:nativePush')).resolves.toBe(!isSafari);
      await expect(storage.getItem('local:devices')).resolves.toEqual([]);
      await expect(storage.getItem('local:autoClearClipboard')).resolves.toBe('default');
      await expect(storage.getItem('local:autoIdleLock')).resolves.toBe(config.defaultStorageIdleLock);
      await expect(storage.getItem('local:savePrompt')).resolves.toBe('default');
      await expect(storage.getItem('local:savePromptIgnoreDomains')).resolves.toEqual([]);
    });

    it('generates the persistent keys and the security icon', async () => {
      await migration();

      expect(generatePersistentKeys).toHaveBeenCalledTimes(1);
      expect(compressPublicKey).toHaveBeenCalledTimes(1);
      expect(generateSecurityIcon).toHaveBeenCalledTimes(1);
    });

    it('never writes the local key to disk (finding #57 regression guard)', async () => {
      await migration();

      await expect(storage.getItem('local:lKey')).resolves.toBeNull();
    });

    it.runIf(!isSafari)('arms the idle detection interval on non-Safari browsers', async () => {
      await migration();

      expect(browser.idle.setDetectionInterval).toHaveBeenCalledWith(config.defaultStorageIdleLock * 60);
    });
  });

  describe('idempotency (all valid values already present)', () => {
    beforeEach(async () => {
      await storage.setItems([
        { key: 'local:persistentPrivateKey', value: 'priv' },
        { key: 'local:persistentPublicKey', value: 'AAAA' },
        { key: 'local:securityIcon', value: { icon: 'icon', colors: ['#fff'] } },
        { key: 'local:browserInfo', value: { name: 'os', browserName: 'Firefox', browserVersion: '140' } },
        { key: 'local:theme', value: 'light' },
        { key: 'local:contextMenu', value: false },
        { key: 'local:logging', value: true },
        { key: 'local:nativePush', value: false },
        { key: 'local:devices', value: [{ id: 'device-1' }] },
        { key: 'local:autoClearClipboard', value: 5 },
        { key: 'local:autoIdleLock', value: 30 },
        { key: 'local:savePrompt', value: 'browser' },
        { key: 'local:savePromptIgnoreDomains', value: ['example.com'] }
      ]);
    });

    it('does not regenerate the persistent keys or security icon', async () => {
      await migration();

      expect(generatePersistentKeys).not.toHaveBeenCalled();
      expect(generateSecurityIcon).not.toHaveBeenCalled();
      expect(compressPublicKey).not.toHaveBeenCalled();
    });

    it('leaves existing valid values unchanged', async () => {
      await migration();

      await expect(storage.getItem('local:theme')).resolves.toBe('light');
      await expect(storage.getItem('local:contextMenu')).resolves.toBe(false);
      await expect(storage.getItem('local:logging')).resolves.toBe(true);
      await expect(storage.getItem('local:nativePush')).resolves.toBe(false);
      await expect(storage.getItem('local:devices')).resolves.toEqual([{ id: 'device-1' }]);
      await expect(storage.getItem('local:autoClearClipboard')).resolves.toBe(5);
      await expect(storage.getItem('local:autoIdleLock')).resolves.toBe(30);
      await expect(storage.getItem('local:savePrompt')).resolves.toBe('browser');
      await expect(storage.getItem('local:savePromptIgnoreDomains')).resolves.toEqual(['example.com']);
    });
  });

  describe('enum validation (out-of-range values are reset to defaults)', () => {
    beforeEach(async () => {
      await storage.setItems([
        { key: 'local:persistentPrivateKey', value: 'priv' },
        { key: 'local:persistentPublicKey', value: 'AAAA' },
        { key: 'local:securityIcon', value: { icon: 'icon', colors: ['#fff'] } },
        { key: 'local:browserInfo', value: { name: 'os', browserName: 'Chrome', browserVersion: '135' } },
        { key: 'local:theme', value: 'rainbow' },
        { key: 'local:autoClearClipboard', value: 999 },
        { key: 'local:autoIdleLock', value: 'weird' },
        { key: 'local:savePrompt', value: 'whenever' }
      ]);
    });

    it('resets invalid enum values to their defaults', async () => {
      await migration();

      await expect(storage.getItem('local:theme')).resolves.toBe('unset');
      await expect(storage.getItem('local:autoClearClipboard')).resolves.toBe('default');
      await expect(storage.getItem('local:autoIdleLock')).resolves.toBe(config.defaultStorageIdleLock);
      await expect(storage.getItem('local:savePrompt')).resolves.toBe('default');
    });
  });
});
