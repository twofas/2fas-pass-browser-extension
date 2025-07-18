// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Converts a Base64 string to a hexadecimal string.
* @param {string} b64 - The Base64 string to convert.
* @return {string} The hexadecimal representation of the Base64 string.
*/
export const Base64ToHex = b64 => {
  if (typeof b64 !== 'string') {
    throw new TypeError('Base64ToArrayBuffer: Expected input to be a string');
  }

  const raw = atob(b64);
  let result = '';

  for (let i = 0; i < raw.length; i++) {
    const hex = raw.charCodeAt(i).toString(16);
    result += (hex.length === 2 ? hex : '0' + hex);
  }

  return result.toUpperCase();
};
