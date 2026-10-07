// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Finding #41 (part 2): checkFormData must decrypt when EITHER field is encrypted
// (per-field flags), not only when a single global flag is set. A request body is
// matched against the decrypted username + password.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('./decryptValues', () => ({ default: vi.fn() }));

import checkFormData from './checkFormData';
import decryptValues from './decryptValues';

const detailsWithFormData = formData => ({ requestBody: { formData } });

describe('checkFormData — per-field encryption', () => {
  beforeEach(() => {
    decryptValues.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT call decryptValues when both fields are plaintext', async () => {
    const values = { username: 'alice', password: 'hunter2', usernameEncrypted: false, passwordEncrypted: false };
    const details = detailsWithFormData({ login: ['alice'], pass: ['hunter2'] });

    const result = await checkFormData(details, values);

    expect(result).toBe(true);
    expect(decryptValues).not.toHaveBeenCalled();
  });

  it('decrypts when only the password is encrypted, then matches the decrypted values', async () => {
    decryptValues.mockResolvedValue({ username: 'alice', password: 'hunter2' });
    const values = { username: 'alice', password: 'CIPHER_P', usernameEncrypted: false, passwordEncrypted: true };
    const details = detailsWithFormData({ login: ['alice'], pass: ['hunter2'] });

    const result = await checkFormData(details, values);

    expect(decryptValues).toHaveBeenCalledTimes(1);
    expect(decryptValues).toHaveBeenCalledWith(values);
    expect(result).toBe(true);
  });

  it('decrypts when only the username is encrypted (mixed state), then matches the decrypted values', async () => {
    decryptValues.mockResolvedValue({ username: 'alice', password: 'hunter2' });
    const values = { username: 'CIPHER_U', password: 'hunter2', usernameEncrypted: true, passwordEncrypted: false };
    const details = detailsWithFormData({ login: ['alice'], pass: ['hunter2'] });

    const result = await checkFormData(details, values);

    expect(decryptValues).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it('returns false when the decrypted password is not present in the request body', async () => {
    decryptValues.mockResolvedValue({ username: 'alice', password: 'hunter2' });
    const values = { username: 'alice', password: 'CIPHER_P', usernameEncrypted: false, passwordEncrypted: true };
    const details = detailsWithFormData({ login: ['alice'], pass: ['somethingelse'] });

    const result = await checkFormData(details, values);

    expect(result).toBe(false);
  });
});

// Safari reports requestBody.raw[].bytes as a Uint8Array (Chromium / Firefox: ArrayBuffer).
describe('checkFormData — raw body shapes', () => {
  const values = { username: 'alice', password: 'hunter2', usernameEncrypted: false, passwordEncrypted: false };
  const jsonBytes = () => new TextEncoder().encode(JSON.stringify({ login: 'alice', pass: 'hunter2' }));

  it('matches a JSON body delivered as an ArrayBuffer (Chromium / Firefox)', async () => {
    await expect(checkFormData({ requestBody: { raw: [{ bytes: jsonBytes().buffer }] } }, values)).resolves.toBe(true);
  });

  it('matches a JSON body delivered as a Uint8Array (Safari)', async () => {
    await expect(checkFormData({ requestBody: { raw: [{ bytes: jsonBytes() }] } }, values)).resolves.toBe(true);
  });
});
