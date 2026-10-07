// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Spec: autofillCard() fills the card values without the whitespace around them, in plain and
// decrypted transmissions. Detection, permission and decryption are stubbed.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const inputSetValueMock = vi.fn();
const decryptTransmittedValueMock = vi.fn();
const inputs = {};

vi.mock('./autofillFunctions/inputSetValue', () => ({ default: (...args) => inputSetValueMock(...args) }));
vi.mock('./autofillFunctions/decryptTransmittedValue', () => ({ default: (...args) => decryptTransmittedValueMock(...args) }));
vi.mock('./autofillFunctions/checkCrossDomainFramePermission', () => ({ default: () => ({ allowed: true }) }));
vi.mock('./autofillFunctions/getShadowRoots', () => ({ default: () => [] }));
vi.mock('@/partials/inputFunctions/getPaymentCardNumberInputs', () => ({ default: () => inputs.cardNumber }));
vi.mock('@/partials/inputFunctions/getPaymentCardholderNameInputs', () => ({ default: () => inputs.cardholderName }));
vi.mock('@/partials/inputFunctions/getPaymentCardExpirationDateInputs', () => ({ default: () => inputs.expirationDate }));
vi.mock('@/partials/inputFunctions/getPaymentCardSecurityCodeInputs', () => ({ default: () => inputs.securityCode }));
vi.mock('@/partials/inputFunctions/getPaymentCardIssuerInputs', () => ({ default: () => inputs.cardIssuer }));

import autofillCard from './autofillCard';

const createInput = (name, maxLength = -1) => ({ name, maxLength, getAttribute: () => null });
const filledValues = () => inputSetValueMock.mock.calls.map(call => [call[0].name, call[1]]);

describe('autofillCard trimmed values', () => {
  beforeEach(() => {
    inputSetValueMock.mockClear();
    decryptTransmittedValueMock.mockReset();
    inputs.cardNumber = [createInput('number')];
    inputs.cardholderName = [{ element: createInput('name'), type: 'full' }];
    inputs.expirationDate = [{ element: createInput('expiry', 5), type: 'combined', isSelect: false }];
    inputs.securityCode = [createInput('cvc')];
    inputs.cardIssuer = [{ element: createInput('issuer'), isSelect: false }];
  });

  it('fills the plain values without the whitespace around them', async () => {
    const result = await autofillCard({
      cardholderName: ' John Doe ',
      cardNumber: ' 4111 1111 1111 1111 ',
      expirationDate: ' 12/30 ',
      securityCode: ' 123 ',
      cardIssuer: ' Visa ',
      cryptoAvailable: false,
      iframePermissionGranted: true
    });

    expect(result.status).toBe('ok');
    expect(filledValues()).toEqual([
      ['name', 'John Doe'],
      ['number', '4111111111111111'],
      ['expiry', '12/30'],
      ['cvc', '123'],
      ['issuer', 'Visa']
    ]);
  });

  it('trims the values decrypted from the transmission', async () => {
    decryptTransmittedValueMock.mockImplementation(async value => ({ status: 'ok', data: { N: ' 4111111111111111 ', E: '\n12/30 ', S: ' 123\t' }[value] }));

    const result = await autofillCard({
      cardNumber: 'N',
      cardNumberEncrypted: true,
      expirationDate: 'E',
      expirationDateEncrypted: true,
      securityCode: 'S',
      securityCodeEncrypted: true,
      cryptoAvailable: true,
      iframePermissionGranted: true
    });

    expect(result.status).toBe('ok');
    expect(filledValues()).toEqual([
      ['number', '4111111111111111'],
      ['expiry', '12/30'],
      ['cvc', '123']
    ]);
  });

  it('treats blank plain card values as missing data, not as failed fields', async () => {
    const result = await autofillCard({
      cardholderName: 'John Doe',
      cardNumber: '   ',
      expirationDate: ' ',
      securityCode: '\t',
      cryptoAvailable: false,
      iframePermissionGranted: true
    });

    expect(result.status).toBe('ok');
    expect(result.failedFields).toBeUndefined();
    expect(filledValues()).toEqual([['name', 'John Doe']]);
  });

  it('does not fill a blank cardholder name', async () => {
    inputs.cardNumber = [];
    inputs.expirationDate = [];
    inputs.securityCode = [];
    inputs.cardIssuer = [];

    const result = await autofillCard({ cardholderName: '   ', cryptoAvailable: false, iframePermissionGranted: true });

    expect(result.status).toBe('error');
    expect(inputSetValueMock).not.toHaveBeenCalled();
  });
});
