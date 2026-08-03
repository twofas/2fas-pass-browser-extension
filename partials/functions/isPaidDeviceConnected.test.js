// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, beforeEach } from 'vitest';

import isPaidDeviceConnected from './isPaidDeviceConnected.js';

const FUTURE = btoa(String(Date.now() + 1000 * 60 * 60 * 24));
const PAST = btoa(String(Date.now() - 1000 * 60 * 60 * 24));

beforeEach(async () => {
  await storage.removeItem('local:devices');
});

describe('isPaidDeviceConnected', () => {
  it('returns false without any stored device', async () => {
    expect(await isPaidDeviceConnected()).toBe(false);
  });

  it('returns true for a future expiration date', async () => {
    await storage.setItem('local:devices', [{ id: 'd1', updatedAt: 1, expirationDate: FUTURE }]);
    expect(await isPaidDeviceConnected()).toBe(true);
  });

  it('returns false for an expired subscription', async () => {
    await storage.setItem('local:devices', [{ id: 'd1', updatedAt: 1, expirationDate: PAST }]);
    expect(await isPaidDeviceConnected()).toBe(false);
  });

  it('returns false instead of throwing when the stored value is not valid Base64', async () => {
    await storage.setItem('local:devices', [{ id: 'd1', updatedAt: 1, expirationDate: 'not-base64-###' }]);
    expect(await isPaidDeviceConnected()).toBe(false);
  });

  it('returns false when the decoded value is not a number', async () => {
    await storage.setItem('local:devices', [{ id: 'd1', updatedAt: 1, expirationDate: btoa('not-a-timestamp') }]);
    expect(await isPaidDeviceConnected()).toBe(false);
  });

  it('returns false when the decoded value has trailing junk after the digits', async () => {
    await storage.setItem('local:devices', [{ id: 'd1', updatedAt: 1, expirationDate: btoa('1900000000000junk') }]);
    expect(await isPaidDeviceConnected()).toBe(false);
  });

  it('returns false for an exponential notation timestamp', async () => {
    await storage.setItem('local:devices', [{ id: 'd1', updatedAt: 1, expirationDate: btoa('1e15') }]);
    expect(await isPaidDeviceConnected()).toBe(false);
  });

  it('returns false for a hexadecimal timestamp', async () => {
    await storage.setItem('local:devices', [{ id: 'd1', updatedAt: 1, expirationDate: btoa('0x1BA5D3C7C00') }]);
    expect(await isPaidDeviceConnected()).toBe(false);
  });

  it('returns false when the decoded digits are padded with whitespace', async () => {
    await storage.setItem('local:devices', [{ id: 'd1', updatedAt: 1, expirationDate: btoa(' 1900000000000 ') }]);
    expect(await isPaidDeviceConnected()).toBe(false);
  });

  it('returns false when the decoded value is not a safe integer', async () => {
    await storage.setItem('local:devices', [{ id: 'd1', updatedAt: 1, expirationDate: btoa('9'.repeat(30)) }]);
    expect(await isPaidDeviceConnected()).toBe(false);
  });

  it('reads the expiration date of the most recently updated device', async () => {
    await storage.setItem('local:devices', [
      { id: 'd1', updatedAt: 1, expirationDate: FUTURE },
      { id: 'd2', updatedAt: 2, expirationDate: PAST }
    ]);
    expect(await isPaidDeviceConnected()).toBe(false);
  });
});
