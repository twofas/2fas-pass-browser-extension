// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Generate shared secret from public key and secret key.
* @param {CryptoKey} publicKey - Public key.
* @param {CryptoKey} secretKey - Secret key.
* @return {Promise<ArrayBuffer>} A promise that resolves to the derived bits.
*/
const generateSharedSecret = (publicKey, secretKey) => {
  try {
    return crypto.subtle.deriveBits(
      { name: 'ECDH', public: publicKey },
      secretKey,
      256
    );
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.generateSharedSecret, { event: e });
  }
};

export default generateSharedSecret;
