// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../utils', () => ({ regenerateLocalKey: vi.fn(async () => {}) }));

import onIdleStateChange from './onIdleStateChange.js';

const DAY = 1000 * 60 * 60 * 24;

const device = expirationDate => ({ id: 'd1', sessionId: 's1', scheme: 2, updatedAt: Date.now(), expirationDate });

beforeEach(async () => {
  vi.clearAllMocks();
  browser.idle.IdleState = { ACTIVE: 'active', IDLE: 'idle', LOCKED: 'locked' };
  await storage.removeItem('local:devices');
  await storage.removeItem('local:autoIdleLock');
  await browser.storage.session.clear();
  await storage.setItem('session:marker', 'unlocked');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('onIdleStateChange — "only on restart" for a paid device', () => {
  it('skips the lock for an iOS device paired with the trailing-parenthesis payload', async () => {
    await storage.setItem('local:devices', [device(btoa(`${Date.now() + DAY})`))]);
    await storage.setItem('local:autoIdleLock', 'default');
    const getItem = vi.spyOn(storage, 'getItem');

    const locked = await onIdleStateChange('idle');

    expect(getItem).toHaveBeenCalledWith('local:autoIdleLock');
    expect(locked).toBe(false);
    expect(await storage.getItem('session:marker')).toBe('unlocked');
  });
});

describe('onIdleStateChange — "only on restart" without a paid device', () => {
  it('locks but keeps the user\'s "only on restart" choice', async () => {
    await storage.setItem('local:devices', [device(btoa(String(Date.now() - DAY)))]);
    await storage.setItem('local:autoIdleLock', 'default');

    const locked = await onIdleStateChange('idle');

    expect(locked).toBe(true);
    expect(await storage.getItem('session:marker')).toBeNull();
    expect(await storage.getItem('local:autoIdleLock')).toBe('default');
  });
});

describe('onIdleStateChange — a timed idle lock', () => {
  it('locks a paid device when the user chose a fixed interval', async () => {
    await storage.setItem('local:devices', [device(btoa(String(Date.now() + DAY)))]);
    await storage.setItem('local:autoIdleLock', 15);

    const locked = await onIdleStateChange('idle');

    expect(locked).toBe(true);
    expect(await storage.getItem('session:marker')).toBeNull();
  });
});

describe('onIdleStateChange — states other than idle', () => {
  it.each(['active', 'locked'])('never locks on the "%s" state', async state => {
    await storage.setItem('local:devices', [device(btoa(String(Date.now() - DAY)))]);
    await storage.setItem('local:autoIdleLock', 15);

    const locked = await onIdleStateChange(state);

    expect(locked).toBe(false);
    expect(await storage.getItem('session:marker')).toBe('unlocked');
  });
});
