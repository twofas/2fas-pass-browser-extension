// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/* global btoa, Uint8Array */

/** 
* Converts an ArrayBuffer to a Base64 string.
* @param {ArrayBuffer} arrayBuffer - The ArrayBuffer to convert to Base64.
* @return {string} The Base64 encoded string.
*
**/
export const ArrayBufferToBase64 = arrayBuffer => {
  if (!(arrayBuffer instanceof ArrayBuffer)) {
    throw new TypeError('ArrayBufferToBase64: Expected input to be an ArrayBuffer');
  }

  return btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => {
    return data + String.fromCharCode(byte);
  }, ''));
};
