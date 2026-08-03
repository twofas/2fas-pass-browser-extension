// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, beforeEach } from 'vitest';

import addNewSessionIdToDevice from './addNewSessionIdToDevice.js';

const UUID = 'uuid-1';
const DEVICE_ID = 'device-1';
const SESSION_ID = 'new-session-id';

beforeEach(async () => {
  await storage.removeItem('local:devices');
});

describe('addNewSessionIdToDevice — device lookup', () => {
  it('matches the device by deviceId after cleanupDevices has stripped the uuid', async () => {
    await storage.setItem('local:devices', [{ id: DEVICE_ID, updatedAt: 1 }]);

    await addNewSessionIdToDevice({ uuid: UUID, deviceId: DEVICE_ID }, SESSION_ID);

    const devices = await storage.getItem('local:devices');
    expect(devices[0].sessionId).toBe(SESSION_ID);
    expect(devices[0].updatedAt).toBeGreaterThan(1);
  });

  it('falls back to uuid when no deviceId is given', async () => {
    await storage.setItem('local:devices', [{ id: DEVICE_ID, uuid: UUID, updatedAt: 1 }]);

    await addNewSessionIdToDevice({ uuid: UUID }, SESSION_ID);

    const devices = await storage.getItem('local:devices');
    expect(devices[0].sessionId).toBe(SESSION_ID);
  });

  it('prefers the persistent deviceId when a stale record still carries the session uuid', async () => {
    await storage.setItem('local:devices', [
      { id: 'stale-device', uuid: UUID, updatedAt: 1 },
      { id: DEVICE_ID, uuid: 'other-uuid', updatedAt: 1 }
    ]);

    await addNewSessionIdToDevice({ uuid: UUID, deviceId: DEVICE_ID }, SESSION_ID);

    const devices = await storage.getItem('local:devices');
    expect(devices.find(d => d.id === DEVICE_ID).sessionId).toBe(SESSION_ID);
    expect(devices.find(d => d.id === 'stale-device').sessionId).toBeUndefined();
  });

  it('never matches a stored device that has no uuid when no uuid is given', async () => {
    await storage.setItem('local:devices', [{ id: 'uuid-less-device', updatedAt: 1 }]);

    await expect(addNewSessionIdToDevice({ deviceId: 'missing-id' }, SESSION_ID)).rejects.toMatchObject({
      code: TwoFasError.internalErrors.deviceNotFound.code
    });

    const devices = await storage.getItem('local:devices');
    expect(devices[0].sessionId).toBeUndefined();
  });

  it('never matches a stored device that has no id when no deviceId is given', async () => {
    await storage.setItem('local:devices', [{ uuid: 'other-uuid', updatedAt: 1 }]);

    await expect(addNewSessionIdToDevice({ uuid: UUID }, SESSION_ID)).rejects.toMatchObject({
      code: TwoFasError.internalErrors.deviceNotFound.code
    });
  });

  it('throws deviceNotFound when neither identifier matches', async () => {
    await storage.setItem('local:devices', [{ id: 'other', uuid: 'other-uuid', updatedAt: 1 }]);

    await expect(addNewSessionIdToDevice({ uuid: UUID, deviceId: DEVICE_ID }, SESSION_ID)).rejects.toMatchObject({
      code: TwoFasError.internalErrors.deviceNotFound.code
    });
  });
});
