// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { generateNonce } from '@/partials/functions';

/**
* Encrypts popup state data using local key with AES-GCM encryption.
* @param {*} data - Data to encrypt (will be JSON stringified).
* @param {string} localKey - Base64 encoded local encryption key.
* @return {Promise<string|null>} Base64 encoded encrypted data with nonce, or null on error.
*/
const encryptPopupState = async (data, localKey) => {
  let nonce = null;
  let localKeyCrypto = null;
  let dataString = null;
  let dataArrayBuffer = null;
  let encryptedData = null;
  let combinedBytes = null;
  let result = null;

  try {
    nonce = await generateNonce('arraybuffer');

    if (!nonce?.ArrayBuffer) {
      return null;
    }

    localKeyCrypto = await crypto.subtle.importKey(
      'raw',
      Base64ToArrayBuffer(localKey),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    dataString = JSON.stringify(data);
    dataArrayBuffer = StringToArrayBuffer(dataString);

    encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce.ArrayBuffer },
      localKeyCrypto,
      dataArrayBuffer
    );

    combinedBytes = EncryptBytes(nonce.ArrayBuffer, encryptedData);
    result = ArrayBufferToBase64(combinedBytes);

    return result;
  } catch (e) {
    CatchError(e);
    return null;
  } finally {
    nonce = null;
    localKeyCrypto = null;
    dataString = null;
    dataArrayBuffer = null;
    encryptedData = null;
    combinedBytes = null;
    result = null;
  }
};

export default encryptPopupState;
