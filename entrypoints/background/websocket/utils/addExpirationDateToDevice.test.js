// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

const isPaidDeviceConnected = vi.fn();

vi.mock('@/partials/functions/isPaidDeviceConnected', () => ({ default: (...args) => isPaidDeviceConnected(...args) }));

import addExpirationDateToDevice from './addExpirationDateToDevice.js';

const UUID = 'uuid-1';
const DEVICE_ID = 'device-1';
const FUTURE_B64 = btoa('1900000000000');

beforeEach(async () => {
  vi.clearAllMocks();
  browser.idle.setDetectionInterval = vi.fn();
  isPaidDeviceConnected.mockResolvedValue(true);
  await storage.removeItem('local:devices');
  await storage.removeItem('local:autoIdleLock');
});

describe('addExpirationDateToDevice — device lookup', () => {
  it('matches the device by uuid', async () => {
    await storage.setItem('local:devices', [{ id: DEVICE_ID, uuid: UUID, updatedAt: 1 }]);

    await addExpirationDateToDevice({ uuid: UUID, deviceId: DEVICE_ID }, FUTURE_B64);

    const devices = await storage.getItem('local:devices');
    expect(devices[0].expirationDate).toBe(FUTURE_B64);
    expect(devices[0].updatedAt).toBeGreaterThan(1);
  });

  it('prefers the persistent deviceId when a stale record still carries the session uuid', async () => {
    await storage.setItem('local:devices', [
      { id: 'stale-device', uuid: UUID, updatedAt: 1 },
      { id: DEVICE_ID, uuid: 'other-uuid', updatedAt: 1 }
    ]);

    await addExpirationDateToDevice({ uuid: UUID, deviceId: DEVICE_ID }, FUTURE_B64);

    const devices = await storage.getItem('local:devices');
    expect(devices.find(d => d.id === DEVICE_ID).expirationDate).toBe(FUTURE_B64);
    expect(devices.find(d => d.id === 'stale-device').expirationDate).toBeUndefined();
  });

  it('falls back to uuid when no deviceId is given', async () => {
    await storage.setItem('local:devices', [{ id: DEVICE_ID, uuid: UUID, updatedAt: 1 }]);

    await addExpirationDateToDevice({ uuid: UUID }, FUTURE_B64);

    const devices = await storage.getItem('local:devices');
    expect(devices[0].expirationDate).toBe(FUTURE_B64);
  });

  it('falls back to deviceId when the uuid does not match any device', async () => {
    await storage.setItem('local:devices', [{ id: DEVICE_ID, uuid: 'stale-uuid', updatedAt: 1 }]);

    await addExpirationDateToDevice({ uuid: UUID, deviceId: DEVICE_ID }, FUTURE_B64);

    const devices = await storage.getItem('local:devices');
    expect(devices[0].expirationDate).toBe(FUTURE_B64);
  });

  it('never matches a stored device that has no uuid when no uuid is given', async () => {
    await storage.setItem('local:devices', [
      { id: 'uuid-less-device', updatedAt: 1 },
      { id: DEVICE_ID, uuid: UUID, updatedAt: 1 }
    ]);

    await expect(addExpirationDateToDevice({ deviceId: 'missing-id' }, FUTURE_B64)).rejects.toMatchObject({
      code: TwoFasError.internalErrors.deviceNotFound.code
    });

    const devices = await storage.getItem('local:devices');
    expect(devices.find(d => d.id === 'uuid-less-device').expirationDate).toBeUndefined();
  });

  it('never matches a stored device that has no id when no deviceId is given', async () => {
    await storage.setItem('local:devices', [{ uuid: 'other-uuid', updatedAt: 1 }]);

    await expect(addExpirationDateToDevice({ uuid: UUID }, FUTURE_B64)).rejects.toMatchObject({
      code: TwoFasError.internalErrors.deviceNotFound.code
    });

    const devices = await storage.getItem('local:devices');
    expect(devices[0].expirationDate).toBeUndefined();
  });

  it('throws deviceNotFound when neither identifier matches', async () => {
    await storage.setItem('local:devices', [{ id: 'other', uuid: 'other-uuid', updatedAt: 1 }]);

    await expect(addExpirationDateToDevice({ uuid: UUID, deviceId: DEVICE_ID }, FUTURE_B64)).rejects.toMatchObject({
      code: TwoFasError.internalErrors.deviceNotFound.code
    });
  });
});

describe('addExpirationDateToDevice — idle lock side effect', () => {
  it('restores the default idle lock when no paid device remains', async () => {
    isPaidDeviceConnected.mockResolvedValue(false);
    await storage.setItem('local:devices', [{ id: DEVICE_ID, uuid: UUID, updatedAt: 1 }]);
    await storage.setItem('local:autoIdleLock', 'default');

    await addExpirationDateToDevice({ uuid: UUID, deviceId: DEVICE_ID }, null);

    expect(await storage.getItem('local:autoIdleLock')).toBe(config.defaultStorageIdleLock);
  });

  it('leaves the idle lock untouched while a paid device is connected', async () => {
    await storage.setItem('local:devices', [{ id: DEVICE_ID, uuid: UUID, updatedAt: 1 }]);
    await storage.setItem('local:autoIdleLock', 'default');

    await addExpirationDateToDevice({ uuid: UUID, deviceId: DEVICE_ID }, FUTURE_B64);

    expect(await storage.getItem('local:autoIdleLock')).toBe('default');
  });
});
