// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@/partials/functions/encryptValueForTransmission', () => ({
  default: async value => ({ status: 'ok', data: `enc:${value}` })
}));

vi.mock('@/partials/functions/decryptValueFromTransmission', () => ({
  default: vi.fn(async stored => {
    if (typeof stored === 'string' && stored.startsWith('enc:')) {
      return { status: 'ok', data: stored.slice(4) };
    }

    return { status: 'error', message: 'Decryption failed' };
  })
}));

import decryptValueFromTransmission from '@/partials/functions/decryptValueFromTransmission';
import { saveWsSession, loadWsSession, clearWsSession, bumpWsSessionActivity, markWsSessionConversation } from './wsSessionPersistence.js';

const RESUME_KEY = 'session:wsSessionResume';

const pushSession = {
  type: 'connect_push',
  sessionID: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
  deviceId: 'A915E095-128D-41AC-B41F-094161BEFC43',
  deviceName: 'Pixel 8',
  ephemeralData: { publicKey: 'PUBKEY_B64', uuid: '11111111-1111-4111-8111-111111111111' },
  socketData: { uuid: '11111111-1111-4111-8111-111111111111', path: 'connect_push', action: 'fullSync' }
};

describe('wsSessionPersistence', () => {
  beforeEach(async () => {
    await storage.removeItem(RESUME_KEY);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-23T09:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('round-trips a push session through encrypted storage', async () => {
    await expect(saveWsSession(pushSession)).resolves.toBe(true);

    const stored = await storage.getItem(RESUME_KEY);
    expect(typeof stored).toBe('string');
    expect(stored.startsWith('enc:')).toBe(true);

    const loaded = await loadWsSession();
    expect(loaded.expired).toBe(false);
    expect(loaded.descriptor.type).toBe('connect_push');
    expect(loaded.descriptor.phase).toBe('awaiting_mobile');
    expect(loaded.descriptor.deviceId).toBe(pushSession.deviceId);
    expect(loaded.descriptor.socketData).toEqual(pushSession.socketData);
  });

  it('refuses to save an unknown type or missing sessionID', async () => {
    await expect(saveWsSession({ ...pushSession, type: 'bogus' })).resolves.toBe(false);
    await expect(saveWsSession({ ...pushSession, sessionID: undefined })).resolves.toBe(false);
    await expect(storage.getItem(RESUME_KEY)).resolves.toBeNull();
  });

  it('returns an EXPIRED descriptor (with flag) instead of clearing it', async () => {
    await saveWsSession(pushSession);
    vi.setSystemTime(new Date('2026-07-23T09:02:01Z'));

    const loaded = await loadWsSession();
    expect(loaded.expired).toBe(true);
    expect(loaded.descriptor.type).toBe('connect_push');
    await expect(storage.getItem(RESUME_KEY)).resolves.not.toBeNull();
  });

  it('bumpWsSessionActivity refreshes the TTL window', async () => {
    await saveWsSession(pushSession);
    await expect(markWsSessionConversation()).resolves.toBe(true);
    vi.setSystemTime(new Date('2026-07-23T09:01:30Z'));
    await expect(bumpWsSessionActivity()).resolves.toBe(true);
    vi.setSystemTime(new Date('2026-07-23T09:02:30Z'));

    const loaded = await loadWsSession();
    expect(loaded.expired).toBe(false);
  });

  it('awaiting_mobile session expires 120s after creation even when lastActivityAt keeps refreshing', async () => {
    await saveWsSession(pushSession);
    vi.setSystemTime(new Date('2026-07-23T09:01:30Z'));
    await expect(bumpWsSessionActivity()).resolves.toBe(true);
    vi.setSystemTime(new Date('2026-07-23T09:02:10Z'));

    const loaded = await loadWsSession();
    expect(loaded.descriptor.phase).toBe('awaiting_mobile');
    expect(loaded.expired).toBe(true);
  });

  it('active_conversation session stays alive on recent activity regardless of age', async () => {
    await saveWsSession(pushSession);
    await expect(markWsSessionConversation()).resolves.toBe(true);
    vi.setSystemTime(new Date('2026-07-23T09:01:30Z'));
    await expect(bumpWsSessionActivity()).resolves.toBe(true);
    vi.setSystemTime(new Date('2026-07-23T09:03:00Z'));

    const loaded = await loadWsSession();
    expect(loaded.descriptor.phase).toBe('active_conversation');
    expect(loaded.descriptor.savedAt).toBe(new Date('2026-07-23T09:00:00Z').getTime());
    expect(loaded.expired).toBe(false);
  });

  it('saveWsSession preserves a caller-supplied savedAt', async () => {
    const pastSavedAt = new Date('2026-07-23T08:59:00Z').getTime();
    await expect(saveWsSession({ ...pushSession, savedAt: pastSavedAt })).resolves.toBe(true);

    const loaded = await loadWsSession();
    expect(loaded.descriptor.savedAt).toBe(pastSavedAt);
    expect(loaded.expired).toBe(false);
  });

  it('loadWsSession rejects a descriptor missing savedAt', async () => {
    await storage.setItem(RESUME_KEY, `enc:${JSON.stringify({ version: 2, type: 'fetch', sessionID: 'x', lastActivityAt: Date.now() })}`);
    await expect(loadWsSession()).resolves.toBeNull();
    await expect(storage.getItem(RESUME_KEY)).resolves.toBeNull();
  });

  it('markWsSessionConversation flips phase and bumps activity', async () => {
    await saveWsSession(pushSession);
    await expect(markWsSessionConversation()).resolves.toBe(true);

    const loaded = await loadWsSession();
    expect(loaded.descriptor.phase).toBe('active_conversation');
  });

  it('returns null and clears on undecryptable blob', async () => {
    await storage.setItem(RESUME_KEY, 'not-an-encrypted-blob');
    await expect(loadWsSession()).resolves.toBeNull();
    await expect(storage.getItem(RESUME_KEY)).resolves.toBeNull();
  });

  it('rejects an unknown schema version', async () => {
    await storage.setItem(RESUME_KEY, `enc:${JSON.stringify({ version: 99, type: 'fetch', sessionID: 'x', lastActivityAt: Date.now(), savedAt: Date.now() })}`);
    await expect(loadWsSession()).resolves.toBeNull();
    await expect(storage.getItem(RESUME_KEY)).resolves.toBeNull();
  });

  it('rejects a descriptor with an unknown phase', async () => {
    await storage.setItem(RESUME_KEY, `enc:${JSON.stringify({ version: 2, type: 'connect_push', phase: 'bogus', sessionID: 'x', lastActivityAt: Date.now(), savedAt: Date.now() })}`);
    await expect(loadWsSession()).resolves.toBeNull();
    await expect(storage.getItem(RESUME_KEY)).resolves.toBeNull();
  });

  it('updateWsSession aborts without writing when clearWsSession runs mid-update', async () => {
    await saveWsSession(pushSession);

    let resolveDecrypt = null;
    vi.mocked(decryptValueFromTransmission).mockImplementationOnce(() => new Promise(resolve => {
      resolveDecrypt = resolve;
    }));

    const bumpPromise = bumpWsSessionActivity();

    while (!resolveDecrypt) {
      await Promise.resolve();
    }

    await clearWsSession();
    resolveDecrypt({ status: 'ok', data: JSON.stringify({ version: 2, type: 'connect_push', phase: 'awaiting_mobile', sessionID: 'a1b2c3d4', lastActivityAt: Date.now(), savedAt: Date.now() }) });

    await expect(bumpPromise).resolves.toBe(false);
    await expect(storage.getItem(RESUME_KEY)).resolves.toBeNull();
  });

  it('clearWsSession removes the blob', async () => {
    await saveWsSession(pushSession);
    await clearWsSession();
    await expect(storage.getItem(RESUME_KEY)).resolves.toBeNull();
  });
});
