// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Converts a string to an ArrayBuffer.
* @param {string} value - The string to convert to an ArrayBuffer.
* @return {ArrayBuffer} The resulting ArrayBuffer from the string input.
*/
export const StringToArrayBuffer = value => {
  if (typeof value !== 'string') {
    throw new TypeError('StringToArrayBuffer: Expected input to be a string');
  }

  return new TextEncoder().encode(value).buffer;
};
