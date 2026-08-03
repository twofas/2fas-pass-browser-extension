// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../contextMenu/initContextMenu', () => ({ default: vi.fn() }));
vi.mock('../utils', () => ({ setBadgeLocked: vi.fn(async () => {}), updateBadge: vi.fn(async () => {}) }));
vi.mock('@/partials/sessionStorage/configured/getConfiguredBoolean', () => ({ default: vi.fn(async () => false) }));
vi.mock('@/partials/sessionStorage/getItems', () => ({ default: vi.fn(async () => []) }));

import onStartup from './onStartup.js';

const FUTURE = btoa(String(Date.now() + 1000 * 60 * 60 * 24));

const paidDevice = extra => ({
  id: 'd1',
  sessionId: 's1',
  scheme: 2,
  updatedAt: Date.now(),
  expirationDate: FUTURE,
  ...extra
});

beforeEach(async () => {
  vi.clearAllMocks();
  browser.idle.setDetectionInterval = vi.fn();
  await storage.removeItem('local:devices');
  await storage.removeItem('local:autoIdleLock');
});

describe('onStartup — the 30-day sweep must not leave a premium-only idle lock behind', () => {
  it('restores the default idle lock when the swept device was the last paid one', async () => {
    const staleAt = Date.now() - (config.devicesCleanupThreshold + 1) * 24 * 60 * 60 * 1000;
    await storage.setItem('local:devices', [paidDevice({ updatedAt: staleAt })]);
    await storage.setItem('local:autoIdleLock', 'default');

    await onStartup({ state: false });

    expect(await storage.getItem('local:devices')).toEqual([]);
    expect(await storage.getItem('local:autoIdleLock')).toBe(config.defaultStorageIdleLock);
  });

  it('keeps the "only on restart" choice when a paid device survives the sweep', async () => {
    await storage.setItem('local:devices', [paidDevice()]);
    await storage.setItem('local:autoIdleLock', 'default');

    await onStartup({ state: false });

    expect(await storage.getItem('local:autoIdleLock')).toBe('default');
  });

  it('drops a half-paired device that never received a session id', async () => {
    await storage.setItem('local:devices', [paidDevice({ sessionId: undefined })]);

    await onStartup({ state: false });

    expect(await storage.getItem('local:devices')).toEqual([]);
  });
});
