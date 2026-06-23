// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

const decryptValueFromTransmission = vi.fn();

vi.mock('@/partials/functions', () => ({
  decryptValueFromTransmission: (...args) => decryptValueFromTransmission(...args)
}));

import restoreActionDataPassword from './restoreActionDataPassword.js';

describe('restoreActionDataPassword — unwrap at-rest password before transmission (finding #5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('decrypts a marked password back to plaintext and removes the marker', async () => {
    decryptValueFromTransmission.mockResolvedValue({ status: 'ok', data: 'plaintext-pw' });
    const actionData = { password: 'enc-at-rest', passwordEncryptedAtRest: true, username: 'u' };

    const result = await restoreActionDataPassword(actionData);

    expect(result.status).toBe('ok');
    expect(actionData.password).toBe('plaintext-pw');
    expect('passwordEncryptedAtRest' in actionData).toBe(false);
    expect(decryptValueFromTransmission).toHaveBeenCalledWith('enc-at-rest');
  });

  it('is a no-op when the password is not marked as encrypted at rest', async () => {
    const actionData = { password: 'plaintext', username: 'u' };

    const result = await restoreActionDataPassword(actionData);

    expect(result.status).toBe('ok');
    expect(actionData.password).toBe('plaintext');
    expect(decryptValueFromTransmission).not.toHaveBeenCalled();
  });

  it('returns an error and leaves the ciphertext in place when decryption fails', async () => {
    decryptValueFromTransmission.mockResolvedValue({ status: 'error', message: 'Decrypt error' });
    const actionData = { password: 'enc-at-rest', passwordEncryptedAtRest: true };

    const result = await restoreActionDataPassword(actionData);

    expect(result.status).toBe('error');
    expect(actionData.password).toBe('enc-at-rest');
    expect(actionData.passwordEncryptedAtRest).toBe(true);
  });
});
