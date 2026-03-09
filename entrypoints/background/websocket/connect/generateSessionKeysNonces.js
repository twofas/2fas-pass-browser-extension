// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import generateNonce from '@/partials/functions/generateNonce';
import getKey from '@/partials/sessionStorage/getKey';

/** 
* Function to generate session keys nonces.
* @async
* @return {Promise<void>} A promise that resolves when the nonces have been generated.
*/
const generateSessionKeysNonces = async () => {
  try {
    const keys = ['configured'];

    for (const key of keys) {
      const nonce = generateNonce();
      const keyEncrypted = await getKey(`${key}_nonce`);

      await storage.setItem(`session:${keyEncrypted}`, nonce.Base64);
    }
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.generateSessionKeysNonces, { event: e });
  }
};

export default generateSessionKeysNonces;
