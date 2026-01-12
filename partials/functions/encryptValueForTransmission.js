// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import generateNonce from './generateNonce.js';

/**
* Encrypts a value using the local key for secure transmission.
* @param {string} value - The value to encrypt.
* @param {CryptoKey} [localKeyCrypto] - Optional pre-imported local key. If not provided, will be fetched from storage.
* @return {Promise<{status: string, data?: string, message?: string}>} Encryption result.
*/
const encryptValueForTransmission = async (value, localKeyCrypto) => {
  let nonce = null;
  let encryptedValue = null;
  let importedKey = null;

  try {
    nonce = generateNonce();

    if (localKeyCrypto) {
      importedKey = localKeyCrypto;
    } else {
      const localKey = await storage.getItem('local:lKey');
      const localKeyAB = Base64ToArrayBuffer(localKey);

      importedKey = await crypto.subtle.importKey(
        'raw',
        localKeyAB,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
    }

    encryptedValue = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce.ArrayBuffer },
      importedKey,
      StringToArrayBuffer(value)
    );

    const encryptedBytes = EncryptBytes(nonce.ArrayBuffer, encryptedValue);

    return { status: 'ok', data: ArrayBufferToBase64(encryptedBytes) };
  } catch (e) {
    await CatchError(e);
    return { status: 'error', message: 'Encryption failed' };
  } finally {
    nonce = null;
    encryptedValue = null;
    importedKey = null;
  }
};

export default encryptValueForTransmission;
