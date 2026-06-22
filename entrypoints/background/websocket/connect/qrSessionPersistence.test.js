// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// The lKey crypto round-trip is covered by encrypt/decrypt tests; here we mock it with a
// reversible transform so the persistence validation/expiry/clear logic is what is tested.
vi.mock('@/partials/functions/encryptValueForTransmission', () => ({
  default: async value => ({ status: 'ok', data: `enc:${value}` })
}));

vi.mock('@/partials/functions/decryptValueFromTransmission', () => ({
  default: async stored => {
    if (typeof stored === 'string' && stored.startsWith('enc:')) {
      return { status: 'ok', data: stored.slice(4) };
    }

    return { status: 'error', message: 'Decryption failed' };
  }
}));

import { saveQrSession, loadQrSession, clearQrSession } from './qrSessionPersistence.js';

const RESUME_KEY = 'session:wsConnectQrResume';

const validSession = {
  sessionID: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
  qrData: 'cXJEYXRhQmFzZTY0',
  ephemeralData: { publicKey: 'PUBKEY_B64', uuid: '11111111-1111-4111-8111-111111111111' },
  socketData: { uuid: '11111111-1111-4111-8111-111111111111', path: 'connect_qr' },
  connectView: 'qrView'
};

describe('qrSessionPersistence', () => {
  beforeEach(async () => {
    await storage.removeItem(RESUME_KEY);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-20T09:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('round-trips a saved session through encrypted storage', async () => {
    const saved = await saveQrSession(validSession);
    expect(saved).toBe(true);

    const stored = await storage.getItem(RESUME_KEY);
    expect(typeof stored).toBe('string');
    // Stored value goes through encryptValueForTransmission (lKey); real ciphertext is
    // covered by the encrypt/decrypt suite — here the mock prefixes 'enc:'.
    expect(stored.startsWith('enc:')).toBe(true);

    const loaded = await loadQrSession();
    expect(loaded.sessionID).toBe(validSession.sessionID);
    expect(loaded.qrData).toBe(validSession.qrData);
    expect(loaded.type).toBe('connect_qr');
    expect(loaded.socketData).toEqual(validSession.socketData);
    expect(loaded.ephemeralData).toEqual(validSession.ephemeralData);
  });

  it('refuses to save without a sessionID', async () => {
    const saved = await saveQrSession({ ...validSession, sessionID: undefined });
    expect(saved).toBe(false);
    await expect(storage.getItem(RESUME_KEY)).resolves.toBeNull();
  });

  it('returns null when nothing is persisted', async () => {
    await expect(loadQrSession()).resolves.toBeNull();
  });

  it('expires a session older than the internal timeout and clears it', async () => {
    await saveQrSession(validSession);

    // config.webSocketInternalTimeout is 2 minutes → advance just past it.
    vi.setSystemTime(new Date('2026-06-20T09:02:01Z'));

    await expect(loadQrSession()).resolves.toBeNull();
    await expect(storage.getItem(RESUME_KEY)).resolves.toBeNull();
  });

  it('still loads a session within the timeout window', async () => {
    await saveQrSession(validSession);
    vi.setSystemTime(new Date('2026-06-20T09:01:30Z'));

    const loaded = await loadQrSession();
    expect(loaded?.sessionID).toBe(validSession.sessionID);
  });

  it('returns null and clears when the stored value cannot be decrypted', async () => {
    await storage.setItem(RESUME_KEY, 'not-an-encrypted-blob');

    await expect(loadQrSession()).resolves.toBeNull();
    await expect(storage.getItem(RESUME_KEY)).resolves.toBeNull();
  });

  it('rejects a blob with an unknown schema version', async () => {
    await storage.setItem(RESUME_KEY, `enc:${JSON.stringify({ version: 99, type: 'connect_qr', sessionID: 'x', savedAt: Date.now() })}`);

    await expect(loadQrSession()).resolves.toBeNull();
    await expect(storage.getItem(RESUME_KEY)).resolves.toBeNull();
  });

  it('clearQrSession removes the persisted blob', async () => {
    await saveQrSession(validSession);
    await clearQrSession();
    await expect(storage.getItem(RESUME_KEY)).resolves.toBeNull();
  });
});
