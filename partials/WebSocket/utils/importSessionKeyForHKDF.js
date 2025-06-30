// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Imports session key for HKDF.
* @param {ArrayBuffer} sessionKey - Session key.
* @return {Promise<CryptoKey>} A promise that resolves to the imported CryptoKey.
*/
const importSessionKeyForHKDF = sessionKey => {
  try {
    return crypto.subtle.importKey(
      'raw',
      sessionKey,
      { name: 'HKDF' },
      false,
      ['deriveKey']
    );
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.importSessionKeyForHKDF, { event: e });
  }
};

export default importSessionKeyForHKDF;
