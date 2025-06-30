// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Imports the mobile ephemeral key from the base64 string.
* @async
* @param {string} mobileEphemeralKeyB64 - The mobile ephemeral key in base64 format.
* @return {CryptoKey} The imported ECDH key.
*/
const importMobileEphemeralKey = async mobileEphemeralKeyB64 => {
  try {
    const PK_EPHE_MA_AB = Base64ToArrayBuffer(mobileEphemeralKeyB64);
    const PK_EPHE_MA_ECDH = await crypto.subtle.importKey(
      'spki',
      PK_EPHE_MA_AB,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );
  
    return PK_EPHE_MA_ECDH;
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.importMobileEphemeralKey, { event: e });
  }
};

export default importMobileEphemeralKey;
