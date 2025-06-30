// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/* global atob */

/** 
* Converts a base64 string to an ArrayBuffer.
* @param {string} base64string - The base64 string to convert to an ArrayBuffer.
* @return {ArrayBuffer} The resulting ArrayBuffer from the base64 string.
*/
export const Base64ToArrayBuffer = base64string => {
  if (typeof base64string !== 'string' || !base64string instanceof String) {
    throw new TypeError('Base64ToArrayBuffer: Expected input to be a string');
  }

  return Uint8Array.from(atob(base64string), c => c.charCodeAt(0)).buffer;
};
