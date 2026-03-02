// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Generate AES key from HKDF key
* @async
* @param {ArrayBuffer} hkdfKey - HKDF key
* @return {CryptoKey} The generated AES key.
*/
const generateAESKey = async hkdfKey => {
  try {
    return crypto.subtle.importKey(
      'raw',
      hkdfKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.generateAESKey, { event: e });
  }
};

export default generateAESKey;
