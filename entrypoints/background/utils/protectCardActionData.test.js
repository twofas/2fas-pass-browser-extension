// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));

import { decryptValueFromTransmission } from '@/partials/functions';
import protectCardActionData from './protectCardActionData.js';

describe('protectCardActionData — keep card SIF fields out of plaintext at rest (finding #5)', () => {
  beforeEach(async () => {
    await storage.removeItem('session:lKey');
  });

  it('encrypts cardNumber/expirationDate/securityCode with the local key and marks them when crypto is unavailable', async () => {
    const actionData = {
      action: 'autofillCard',
      cardholderName: 'John Doe',
      cardIssuer: 'visa',
      cardNumber: '4111111111111111',
      expirationDate: '12/30',
      securityCode: '123',
      cryptoAvailable: false
    };

    const result = await protectCardActionData(actionData);

    expect(result.status).toBe('ok');
    expect(result.actionData.cardNumber).not.toBe('4111111111111111');
    expect(result.actionData.expirationDate).not.toBe('12/30');
    expect(result.actionData.securityCode).not.toBe('123');
    expect(result.actionData.cardFieldsEncryptedAtRest).toBe(true);
    // Non-sensitive fields are left untouched.
    expect(result.actionData.cardholderName).toBe('John Doe');
    expect(result.actionData.cardIssuer).toBe('visa');

    expect((await decryptValueFromTransmission(result.actionData.cardNumber)).data).toBe('4111111111111111');
    expect((await decryptValueFromTransmission(result.actionData.expirationDate)).data).toBe('12/30');
    expect((await decryptValueFromTransmission(result.actionData.securityCode)).data).toBe('123');
  });

  it('only encrypts the present fields (card number only)', async () => {
    const actionData = { cardNumber: '4111111111111111', cryptoAvailable: false };

    const result = await protectCardActionData(actionData);

    expect(result.actionData.cardFieldsEncryptedAtRest).toBe(true);
    expect((await decryptValueFromTransmission(result.actionData.cardNumber)).data).toBe('4111111111111111');
    expect(result.actionData.expirationDate).toBeUndefined();
    expect(result.actionData.securityCode).toBeUndefined();
  });

  it('does not mutate the original actionData so the in-memory copy stays plaintext for direct fill', async () => {
    const actionData = { cardNumber: '4111111111111111', cryptoAvailable: false };

    const result = await protectCardActionData(actionData);

    expect(actionData.cardNumber).toBe('4111111111111111');
    expect('cardFieldsEncryptedAtRest' in actionData).toBe(false);
    expect(result.actionData).not.toBe(actionData);
  });

  it('leaves fields untouched when crypto is available (already transport-encrypted)', async () => {
    const actionData = { cardNumber: 'enc-transport', cardNumberEncrypted: true, cryptoAvailable: true };

    const result = await protectCardActionData(actionData);

    expect(result.status).toBe('ok');
    expect(result.actionData).toBe(actionData);
    expect('cardFieldsEncryptedAtRest' in result.actionData).toBe(false);
  });

  it('is a no-op when there are no card SIF fields (cardholder-only)', async () => {
    const actionData = { cardholderName: 'John Doe', cardIssuer: 'visa', cryptoAvailable: false };

    const result = await protectCardActionData(actionData);

    expect(result.status).toBe('ok');
    expect(result.actionData).toBe(actionData);
  });
});
