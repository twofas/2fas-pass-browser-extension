// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getKey from '@/partials/sessionStorage/getKey';

/** 
* Imports ephemeral key from the extension's session storage.
* @async
* @param {string} uuid - UUID of the ephemeral key.
* @return {Promise<CryptoKey>} A promise that resolves to the imported ephemeral key.
*/
const importExtensionEphemeralKey = async uuid => {
  try {
    const privateKeyKey = await getKey('ephe_private_key', { uuid });
    const SK_EPHE_B64 = await storage.getItem(`session:${privateKeyKey}`);
    const SK_EPHE_AB = Base64ToArrayBuffer(SK_EPHE_B64);
  
    const SK_EPHE_ECDH = await crypto.subtle.importKey(
      'pkcs8',
      SK_EPHE_AB,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      ['deriveBits']
    );
  
    return SK_EPHE_ECDH;
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.importExtensionEphemeralKey, { event: e });
  }
};

export default importExtensionEphemeralKey;
