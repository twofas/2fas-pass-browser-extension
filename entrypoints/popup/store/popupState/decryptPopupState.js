// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Decrypts popup state data using local key with AES-GCM decryption.
* @param {string} encryptedData - Base64 encoded encrypted data with nonce.
* @param {string} localKey - Base64 encoded local encryption key.
* @return {Promise<*|null>} Decrypted and parsed data, or null on error.
*/
const decryptPopupState = async (encryptedData, localKey) => {
  let localKeyCrypto = null;
  let encryptedArrayBuffer = null;
  let decryptedBytes = null;
  let decryptedData = null;
  let decryptedString = null;
  let result = null;

  try {
    localKeyCrypto = await crypto.subtle.importKey(
      'raw',
      Base64ToArrayBuffer(localKey),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    encryptedArrayBuffer = Base64ToArrayBuffer(encryptedData);
    decryptedBytes = DecryptBytes(encryptedArrayBuffer);

    decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: decryptedBytes.iv },
      localKeyCrypto,
      decryptedBytes.data
    );

    decryptedString = ArrayBufferToString(decryptedData);
    result = JSON.parse(decryptedString);

    return result;
  } catch (e) {
    CatchError(e);
    return null;
  } finally {
    localKeyCrypto = null;
    encryptedArrayBuffer = null;
    decryptedBytes = null;
    decryptedData = null;
    decryptedString = null;
    result = null;
  }
};

export default decryptPopupState;
