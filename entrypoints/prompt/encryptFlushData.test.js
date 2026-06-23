// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Coverage for the default_encrypted flush skew: the save-prompt consumer
// pipeline (getValuesFromTabsInputData -> decryptValues -> checkFormData) assumes
// a SINGLE encryption state across all tabsInputData entries. Live capture
// (handleInputEvent) and the initial scan (checkInitialInputsValues) honour that
// by encrypting values in 'default_encrypted' mode, but the flush path emits
// plaintext. encryptFlushData restores the invariant: in encrypted mode it
// AES-GCM-encrypts every plaintext flush entry with the local key, passes through
// entries that are already encrypted (the latestValues fallback), and DROPS an
// entry it cannot encrypt rather than leaking plaintext. In default mode it is a
// no-op so plaintext behaviour is unchanged.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));

vi.mock('@/partials/functions', () => ({
  generateNonce: vi.fn()
}));

import encryptFlushData from './encryptFlushData';
import { generateNonce } from '@/partials/functions';
import CatchError from '@/utils/CatchError.js';

const plaintextEntry = (overrides = {}) => ({
  id: 'u1',
  type: 'username',
  value: 'alice@example.com',
  url: 'https://example.com',
  timestamp: 123,
  encrypted: false,
  ...overrides
});

describe('encryptFlushData — restores the encrypted-mode invariant', () => {
  beforeEach(() => {
    generateNonce.mockResolvedValue({ ArrayBuffer: new ArrayBuffer(12) });
    vi.stubGlobal('crypto', { subtle: { encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(16)) } });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('is a no-op in default (non-encrypted) mode — plaintext passes through untouched', async () => {
    const data = [plaintextEntry()];

    const result = await encryptFlushData(data, { data: 'key' }, false);

    expect(result).toEqual(data);
    expect(crypto.subtle.encrypt).not.toHaveBeenCalled();
  });

  it('returns an empty array for non-array / empty input', async () => {
    expect(await encryptFlushData(null, { data: 'key' }, true)).toEqual([]);
    expect(await encryptFlushData([], { data: 'key' }, true)).toEqual([]);
  });

  it('encrypts a plaintext entry in encrypted mode and marks it encrypted', async () => {
    const result = await encryptFlushData([plaintextEntry()], { data: 'key' }, true);

    expect(crypto.subtle.encrypt).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0].encrypted).toBe(true);
    expect(typeof result[0].value).toBe('string');
    expect(result[0].value).not.toBe('alice@example.com');
    // non-sensitive fields are preserved
    expect(result[0]).toMatchObject({ id: 'u1', type: 'username', url: 'https://example.com', timestamp: 123 });
  });

  it('passes through an entry that is already encrypted (latestValues fallback) without re-encrypting', async () => {
    const already = plaintextEntry({ id: 'p1', type: 'password', value: 'ALREADY_CIPHERTEXT_B64', encrypted: true });

    const result = await encryptFlushData([already], { data: 'key' }, true);

    expect(crypto.subtle.encrypt).not.toHaveBeenCalled();
    expect(result).toEqual([already]);
  });

  it('DROPS a plaintext entry when the local key is unavailable — never leaks plaintext', async () => {
    const result = await encryptFlushData([plaintextEntry()], { data: null }, true);

    expect(result).toEqual([]);
    expect(crypto.subtle.encrypt).not.toHaveBeenCalled();
  });

  it('DROPS an entry whose encryption throws (and reports it), keeping the others', async () => {
    crypto.subtle.encrypt = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(new ArrayBuffer(16));

    const result = await encryptFlushData(
      [plaintextEntry({ id: 'u1' }), plaintextEntry({ id: 'p1', type: 'password', value: 'secret' })],
      { data: 'key' },
      true
    );

    expect(result.map(r => r.id)).toEqual(['p1']);
    expect(result[0].encrypted).toBe(true);
    expect(CatchError).toHaveBeenCalled();
  });
});
