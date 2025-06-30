// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Converts a Base64 string to a string.
* @param {string} b64 - The Base64 string to convert.
* @return {string} - The converted string.
* @throws {TypeError} - If the input is not a string.
*/
export const Base64ToString = b64 => {
  if (typeof b64 !== 'string' || !b64 instanceof String) {
    throw new TypeError('Base64ToString: Expected input to be a string');
  }

  return atob(b64);
};
