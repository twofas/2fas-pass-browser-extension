// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));

import encryptValueForTransmission from './encryptValueForTransmission.js';
import decryptValueFromTransmission from './decryptValueFromTransmission.js';

describe('decryptValueFromTransmission — background-side local-key decrypt (finding #5)', () => {
  beforeEach(async () => {
    await storage.removeItem('session:lKey');
  });

  it('round-trips a value encrypted with encryptValueForTransmission using the local key', async () => {
    const enc = await encryptValueForTransmission('super-secret-password');
    expect(enc.status).toBe('ok');

    const dec = await decryptValueFromTransmission(enc.data);

    expect(dec.status).toBe('ok');
    expect(dec.data).toBe('super-secret-password');
  });

  it('returns an error status for a value that cannot be decrypted', async () => {
    // Generate the key, then feed ciphertext that was never produced with it.
    await encryptValueForTransmission('seed');

    const dec = await decryptValueFromTransmission('AAAAAAAAAAAAAAAAAAAAAAAAAAAA');

    expect(dec.status).not.toBe('ok');
  });
});
