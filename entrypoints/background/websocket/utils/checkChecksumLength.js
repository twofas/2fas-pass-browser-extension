// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Check if the length of the checksum is valid.
* @param {string} checksumB64 - The base64 encoded checksum.
* @return {void} This function does not return a value.
*/
const checkChecksumLength = checksumB64 => {
  const checksumAB = Base64ToArrayBuffer(checksumB64);

  if (checksumAB.byteLength !== 32) {
    throw new TwoFasError(TwoFasError.errors.checkChecksumLength);
  }
};

export default checkChecksumLength;
