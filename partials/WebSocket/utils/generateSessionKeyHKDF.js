// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Generate session key using HKDF algorithm.
* @param {ArrayBuffer} salt - Salt for HKDF algorithm.
* @param {ArrayBuffer} key - Key for HKDF algorithm.
* @return {Promise<ArrayBuffer>} The derived session key as an ArrayBuffer.
*/
const generateSessionKeyHKDF = (salt, key) => {
  try {
    return crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: salt, info: StringToArrayBuffer('SessionKey') },
      key,
      256
    );
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.generateSessionKeyHKDF, { event: e });
  }
};

export default generateSessionKeyHKDF;
