// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

const isPaidDeviceConnected = vi.fn();
const setIdleInterval = vi.fn();

vi.mock('./isPaidDeviceConnected', () => ({ default: (...args) => isPaidDeviceConnected(...args) }));
vi.mock('./setIdleInterval', () => ({ default: (...args) => setIdleInterval(...args) }));

import restoreDefaultIdleLockIfNotPaid from './restoreDefaultIdleLockIfNotPaid.js';

beforeEach(async () => {
  vi.clearAllMocks();
  isPaidDeviceConnected.mockResolvedValue(false);
  await storage.removeItem('local:autoIdleLock');
});

describe('restoreDefaultIdleLockIfNotPaid', () => {
  it('replaces the premium-only "default" choice once no paid device remains', async () => {
    await storage.setItem('local:autoIdleLock', 'default');

    const restored = await restoreDefaultIdleLockIfNotPaid();

    expect(restored).toBe(true);
    expect(await storage.getItem('local:autoIdleLock')).toBe(config.defaultStorageIdleLock);
    expect(setIdleInterval).toHaveBeenCalledWith(config.defaultStorageIdleLock);
  });

  it('initialises an unset idle lock to the default', async () => {
    const restored = await restoreDefaultIdleLockIfNotPaid();

    expect(restored).toBe(true);
    expect(await storage.getItem('local:autoIdleLock')).toBe(config.defaultStorageIdleLock);
  });

  it('keeps the "default" choice while a paid device is connected', async () => {
    isPaidDeviceConnected.mockResolvedValue(true);
    await storage.setItem('local:autoIdleLock', 'default');

    const restored = await restoreDefaultIdleLockIfNotPaid();

    expect(restored).toBe(false);
    expect(await storage.getItem('local:autoIdleLock')).toBe('default');
    expect(setIdleInterval).not.toHaveBeenCalled();
  });

  it('never overrides an explicit interval chosen by the user', async () => {
    await storage.setItem('local:autoIdleLock', 30);

    const restored = await restoreDefaultIdleLockIfNotPaid();

    expect(restored).toBe(false);
    expect(await storage.getItem('local:autoIdleLock')).toBe(30);
    expect(setIdleInterval).not.toHaveBeenCalled();
  });
});
