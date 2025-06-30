// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Check if the internal checksum is equal to the checksum from the request.
* @param {string} internalChecksum - The internal checksum.
* @param {string} checksum - The checksum from the request.
* @return {void} This function does not return a value.
*/
const checkChecksum = (internalChecksum, checksum) => {
  if (internalChecksum !== checksum) {
    throw new TwoFasError(TwoFasError.errors.checkChecksum.message);
  }
};

export default checkChecksum;
