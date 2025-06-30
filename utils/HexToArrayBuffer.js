// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* This function converts a hexadecimal string to an ArrayBuffer.
* @param {string} hex - The hexadecimal string to convert.
* @return {ArrayBuffer} The resulting ArrayBuffer from the hexadecimal string.
*/
export const HexToArrayBuffer = hex => {
  if (typeof hex !== 'string' || !hex instanceof String) {
    throw new TypeError('HexToArrayBuffer: Expected input to be a string');
  }

  return new Uint8Array(hex.match(/../g).map(h=>parseInt(h,16))).buffer;
};
