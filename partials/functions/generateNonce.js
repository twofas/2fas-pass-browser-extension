// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Generates a random nonce.
* @param {string|null} type - The type of nonce to generate.
* @return {Object} An object containing the nonce in different formats.
*/
const generateNonce = (type = null) => {
  try {
    const nonceArray = new Uint32Array(6);
    const nonce = [...crypto.getRandomValues(nonceArray)].map(m=>('0'+m.toString(16)).slice(-2)).join('');

    const nonceObj = {
      String: nonce
    };

    if (!type || type === 'base64') {
      nonceObj.Base64 = btoa(nonce);
    }

    if (!type || type === 'arraybuffer') {
      nonceObj.ArrayBuffer = StringToArrayBuffer(nonce);
    }

    return nonceObj;
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.generateNonce, { event: e });
  }
};

export default generateNonce;
