// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

import cleanupDevices from './cleanupDevices.js';

const FUTURE = btoa(String(Date.now() + 1000 * 60 * 60 * 24));

const paidDevice = extra => ({ id: 'd1', uuid: 'u1', scheme: 2, updatedAt: 1, expirationDate: FUTURE, ...extra });

beforeEach(async () => {
  vi.clearAllMocks();
  browser.idle.setDetectionInterval = vi.fn();
  await storage.removeItem('local:devices');
  await storage.removeItem('local:autoIdleLock');
});

describe('cleanupDevices — pruning devices must not leave a premium-only idle lock behind', () => {
  it('restores the default idle lock when the pruned device was the last paid one', async () => {
    await storage.setItem('local:devices', [paidDevice({ scheme: 1 })]);
    await storage.setItem('local:autoIdleLock', 'default');

    await cleanupDevices();

    expect(await storage.getItem('local:devices')).toEqual([]);
    expect(await storage.getItem('local:autoIdleLock')).toBe(config.defaultStorageIdleLock);
  });

  it('keeps the "only on restart" choice when a paid device survives the cleanup', async () => {
    await storage.setItem('local:devices', [paidDevice()]);
    await storage.setItem('local:autoIdleLock', 'default');

    await cleanupDevices();

    expect(await storage.getItem('local:autoIdleLock')).toBe('default');
  });

  it('strips the session uuid but preserves the expiration date', async () => {
    await storage.setItem('local:devices', [paidDevice()]);

    await cleanupDevices();

    const devices = await storage.getItem('local:devices');
    expect(devices[0].uuid).toBeUndefined();
    expect(devices[0].expirationDate).toBe(FUTURE);
  });
});
