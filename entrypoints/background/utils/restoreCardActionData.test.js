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

import restoreCardActionData from './restoreCardActionData.js';

describe('restoreCardActionData — unwrap card fields before transmission (finding #5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('decrypts all marked card fields back to plaintext and removes the marker', async () => {
    decryptValueFromTransmission.mockImplementation(async value => ({ status: 'ok', data: `dec(${value})` }));
    const actionData = {
      cardNumber: 'encNum',
      expirationDate: 'encExp',
      securityCode: 'encCvv',
      cardFieldsEncryptedAtRest: true,
      cardholderName: 'John'
    };

    const result = await restoreCardActionData(actionData);

    expect(result.status).toBe('ok');
    expect(actionData.cardNumber).toBe('dec(encNum)');
    expect(actionData.expirationDate).toBe('dec(encExp)');
    expect(actionData.securityCode).toBe('dec(encCvv)');
    expect('cardFieldsEncryptedAtRest' in actionData).toBe(false);
    expect(actionData.cardholderName).toBe('John');
  });

  it('only decrypts the present fields', async () => {
    decryptValueFromTransmission.mockImplementation(async value => ({ status: 'ok', data: `dec(${value})` }));
    const actionData = { cardNumber: 'encNum', cardFieldsEncryptedAtRest: true };

    const result = await restoreCardActionData(actionData);

    expect(result.status).toBe('ok');
    expect(actionData.cardNumber).toBe('dec(encNum)');
    expect(decryptValueFromTransmission).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when the card fields are not marked as encrypted at rest', async () => {
    const actionData = { cardNumber: '4111', cryptoAvailable: false };

    const result = await restoreCardActionData(actionData);

    expect(result.status).toBe('ok');
    expect(actionData.cardNumber).toBe('4111');
    expect(decryptValueFromTransmission).not.toHaveBeenCalled();
  });

  it('returns an error and leaves the ciphertext in place when decryption fails', async () => {
    decryptValueFromTransmission.mockResolvedValue({ status: 'error' });
    const actionData = { cardNumber: 'encNum', cardFieldsEncryptedAtRest: true };

    const result = await restoreCardActionData(actionData);

    expect(result.status).toBe('error');
    expect(actionData.cardNumber).toBe('encNum');
    expect(actionData.cardFieldsEncryptedAtRest).toBe(true);
  });
});
