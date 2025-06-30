// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Imports shared secret key from array buffer.
* @param {ArrayBuffer} arrayBuffer - Shared secret key in array buffer.
* @return {CryptoKey} The imported shared secret key.
*/
const importSharedSecretKey = arrayBuffer => {
  try {
    return crypto.subtle.importKey(
      'raw',
      arrayBuffer,
      { name: 'HKDF' },
      false,
      ['deriveBits']
    );
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.importSharedSecretKey, { event: e });
  }
};

export default importSharedSecretKey;
