// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));

import { decryptValueFromTransmission } from '@/partials/functions';
import protectActionDataPassword from './protectActionDataPassword.js';

describe('protectActionDataPassword — keep the at-rest password out of plaintext (finding #5)', () => {
  beforeEach(async () => {
    await storage.removeItem('session:lKey');
  });

  it('encrypts a plaintext password with the local key and marks it when crypto is unavailable', async () => {
    const actionData = { action: 'autofill', username: 'u', password: 'plaintext-pw', cryptoAvailable: false };

    const result = await protectActionDataPassword(actionData);

    expect(result.status).toBe('ok');
    expect(result.actionData.password).not.toBe('plaintext-pw');
    expect(result.actionData.passwordEncryptedAtRest).toBe(true);

    const dec = await decryptValueFromTransmission(result.actionData.password);
    expect(dec.data).toBe('plaintext-pw');
  });

  it('does not mutate the original actionData so the in-memory copy stays plaintext for direct fill', async () => {
    const actionData = { password: 'plaintext-pw', cryptoAvailable: false };

    const result = await protectActionDataPassword(actionData);

    expect(actionData.password).toBe('plaintext-pw');
    expect('passwordEncryptedAtRest' in actionData).toBe(false);
    expect(result.actionData).not.toBe(actionData);
  });

  it('leaves the password untouched when crypto is available (already transport-encrypted)', async () => {
    const actionData = { password: 'enc-transport', cryptoAvailable: true };

    const result = await protectActionDataPassword(actionData);

    expect(result.status).toBe('ok');
    expect(result.actionData).toBe(actionData);
    expect('passwordEncryptedAtRest' in result.actionData).toBe(false);
  });

  it('is a no-op when there is no password', async () => {
    const actionData = { cryptoAvailable: false, noPassword: true };

    const result = await protectActionDataPassword(actionData);

    expect(result.status).toBe('ok');
    expect(result.actionData).toBe(actionData);
  });
});
