// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Generates a random nonce.
* @return {Object} An object containing the nonce in different formats.
*/
const generateNonce = () => {
  try {
    const nonceArray = new Uint32Array(6);
    const nonce = [...crypto.getRandomValues(nonceArray)].map(m=>('0'+m.toString(16)).slice(-2)).join('');
    const nonce_B64 = btoa(nonce);
    const nonceIv = StringToArrayBuffer(nonce);
  
    return {
      String: nonce,
      ArrayBuffer: nonceIv,
      Base64: nonce_B64
    };
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.generateNonce, { event: e });
  }
};

export default generateNonce;
