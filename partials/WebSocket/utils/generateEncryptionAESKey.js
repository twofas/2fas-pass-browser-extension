// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Generate AES key for encryption/decryption.
* @param {ArrayBuffer} salt - Salt for key derivation.
* @param {String} infoString - Info string for key derivation.
* @param {CryptoKey} key - Key for key derivation.
* @param {Boolean} extractable - Extractable key.
* @return {CryptoKey} The derived AES key for encryption/decryption.
*/
const generateEncryptionAESKey = (salt, infoString, key, extractable) => {
  try {
    return crypto.subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt, info: StringToArrayBuffer(infoString) },
      key,
      { name: 'AES-GCM', length: 256 },
      extractable,
      ['encrypt', 'decrypt']
    );
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.generateEncryptionAESKey, { event: e });
  }
};

export default generateEncryptionAESKey;
