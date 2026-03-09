// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Returns the storage chunk size based on the chunk length.
* @param {number} chunkLength - The chunk length.
* @return {number} Returns the storage chunk size based on the chunk length.
*/
const setStorageChunkSize = chunkLength => {
  const thresholds = [10000, 50000, 100000, 500000, 1000000, 2500000, 5000000];
  const sizes = [512, 4096, 8192, 16384, 32768, 65536, 131072];

  for (let i = 0; i < thresholds.length; i++) {
    if (chunkLength < thresholds[i]) {
      return sizes[i];
    }
  }

  return sizes[sizes.length - 1];
};

export default setStorageChunkSize;
