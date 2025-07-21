// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Converts a hexadecimal string to a base64 string.
* @param {string} hex - The hexadecimal string to convert.
* @return {string} The resulting base64 string from the hexadecimal input.
*/
export const HexToBase64 = hex => {
  if (typeof hex !== 'string') {
    throw new TypeError('HexToBase64: Expected input to be a string');
  }

  return btoa(hex.match(/\w{2}/g).map(function(a) {
    return String.fromCharCode(parseInt(a, 16));
  }).join(""));
};
