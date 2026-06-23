// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Finding #41 (part 2): decryptValues decrypts each field according to its OWN
// encryption flag (usernameEncrypted / passwordEncrypted) instead of a single
// global flag. A mixed set (one field encrypted, the other plaintext) must no
// longer mangle the plaintext field (run it through AES-GCM decrypt) nor emit the
// encrypted field as ciphertext.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../getLocalKey', () => ({ default: vi.fn() }));
vi.mock('./decryptValuesProcess', () => ({ default: vi.fn() }));

import decryptValues from './decryptValues';
import getLocalKey from '../getLocalKey';
import decryptValuesProcess from './decryptValuesProcess';

describe('decryptValues — per-field decryption', () => {
  beforeEach(() => {
    getLocalKey.mockResolvedValue(btoa('0123456789012345'));
    vi.stubGlobal('crypto', { subtle: { importKey: vi.fn().mockResolvedValue({ fake: 'key' }) } });
    decryptValuesProcess.mockImplementation(async value => `DECRYPTED(${value})`);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('decrypts only the password when only passwordEncrypted is set; plaintext username passes through', async () => {
    const result = await decryptValues({
      username: 'alice@example.com',
      password: 'CIPHER_P',
      usernameEncrypted: false,
      passwordEncrypted: true
    });

    expect(result).toEqual({ username: 'alice@example.com', password: 'DECRYPTED(CIPHER_P)' });
    expect(decryptValuesProcess).toHaveBeenCalledTimes(1);
    expect(decryptValuesProcess).toHaveBeenCalledWith('CIPHER_P', expect.anything());
  });

  it('decrypts only the username when only usernameEncrypted is set; plaintext password passes through', async () => {
    const result = await decryptValues({
      username: 'CIPHER_U',
      password: 'hunter2',
      usernameEncrypted: true,
      passwordEncrypted: false
    });

    expect(result).toEqual({ username: 'DECRYPTED(CIPHER_U)', password: 'hunter2' });
    expect(decryptValuesProcess).toHaveBeenCalledTimes(1);
    expect(decryptValuesProcess).toHaveBeenCalledWith('CIPHER_U', expect.anything());
  });

  it('decrypts both fields when both flags are set', async () => {
    const result = await decryptValues({
      username: 'CIPHER_U',
      password: 'CIPHER_P',
      usernameEncrypted: true,
      passwordEncrypted: true
    });

    expect(result).toEqual({ username: 'DECRYPTED(CIPHER_U)', password: 'DECRYPTED(CIPHER_P)' });
    expect(decryptValuesProcess).toHaveBeenCalledTimes(2);
  });

  it('omits a field whose decryption fails (returns null), keeping the plaintext field', async () => {
    decryptValuesProcess.mockResolvedValueOnce(null); // username decryption fails

    const result = await decryptValues({
      username: 'CIPHER_U',
      password: 'hunter2',
      usernameEncrypted: true,
      passwordEncrypted: false
    });

    expect(result).toEqual({ password: 'hunter2' });
  });
});
