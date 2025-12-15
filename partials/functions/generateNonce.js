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
    const nonceArray = new Uint8Array(12);
    crypto.getRandomValues(nonceArray);

    const nonce = Array.from(nonceArray)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');

    const nonceObj = {
      String: nonce
    };

    if (!type || type === 'base64') {
      nonceObj.Base64 = btoa(String.fromCharCode(...nonceArray));
    }

    if (!type || type === 'arraybuffer') {
      nonceObj.ArrayBuffer = nonceArray.buffer;
    }

    return nonceObj;
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.generateNonce, { event: e });
  }
};

export default generateNonce;
