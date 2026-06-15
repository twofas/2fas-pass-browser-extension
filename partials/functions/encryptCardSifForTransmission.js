// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import encryptValueForTransmission from './encryptValueForTransmission.js';

/**
* Decrypts a PaymentCard SIF and encrypts the three card fields for transmission.
* The local key is imported once and reused for all three fields. When crypto is
* unavailable the plaintext values are returned as-is (callers still flag them as
* transmitted values). Decrypted intermediates are cleared before returning.
* @async
* @param {PaymentCard} item - The PaymentCard item whose SIF should be processed.
* @param {boolean} cryptoAvailable - Whether the target page exposes crypto.subtle.
* @return {Promise<{status: string, cardNumber?: string|null, expirationDate?: string|null, securityCode?: string|null, event?: Error, field?: string}>} Result. status: 'ok' | 'decryptError' | 'importKeyError' | 'encryptError'.
*/
const encryptCardSifForTransmission = async (item, cryptoAvailable) => {
  let decryptedCardNumber = '';
  let decryptedExpirationDate = '';
  let decryptedSecurityCode = '';

  try {
    const decryptedValues = await item.decryptSif();
    decryptedCardNumber = decryptedValues.cardNumber || '';
    decryptedExpirationDate = decryptedValues.expirationDate || '';
    decryptedSecurityCode = decryptedValues.securityCode || '';
  } catch (e) {
    return { status: 'decryptError', event: e };
  }

  const result = { status: 'ok', cardNumber: null, expirationDate: null, securityCode: null };

  if (!cryptoAvailable) {
    result.cardNumber = decryptedCardNumber;
    result.expirationDate = decryptedExpirationDate;
    result.securityCode = decryptedSecurityCode;
  } else {
    let localKeyCrypto = null;
    let localKeyAB = null;

    try {
      const localKey = await storage.getItem('local:lKey');
      localKeyAB = Base64ToArrayBuffer(localKey);

      localKeyCrypto = await crypto.subtle.importKey(
        'raw',
        localKeyAB,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      wipeBuffer(localKeyAB);
      localKeyAB = null;
    } catch (e) {
      wipeBuffer(localKeyAB);
      localKeyAB = null;
      localKeyCrypto = null;
      return { status: 'importKeyError', event: e };
    }

    const fields = [
      { value: decryptedCardNumber, key: 'cardNumber' },
      { value: decryptedExpirationDate, key: 'expirationDate' },
      { value: decryptedSecurityCode, key: 'securityCode' }
    ];

    for (const field of fields) {
      if (!field.value) {
        continue;
      }

      const encryptResult = await encryptValueForTransmission(field.value, localKeyCrypto);

      if (encryptResult.status !== 'ok') {
        localKeyCrypto = null;
        decryptedCardNumber = '';
        decryptedExpirationDate = '';
        decryptedSecurityCode = '';
        return { status: 'encryptError', field: field.key };
      }

      result[field.key] = encryptResult.data;
    }

    localKeyCrypto = null;
  }

  decryptedCardNumber = '';
  decryptedExpirationDate = '';
  decryptedSecurityCode = '';

  return result;
};

export default encryptCardSifForTransmission;
