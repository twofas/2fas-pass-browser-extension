// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Converts an ArrayBuffer to a hexadecimal string.
* @param {ArrayBuffer} ab - The ArrayBuffer to convert to hexadecimal.
* @return {string} The hexadecimal encoded string.
*/
export const ArrayBufferToHex = ab => {
  if (!(ab instanceof ArrayBuffer) && ab[Symbol?.toStringTag] !== 'ArrayBuffer') {
    throw new TypeError('ArrayBufferToHex: Expected input to be an ArrayBuffer');
  }

  return Array.prototype.map.call(new Uint8Array(ab), x => ('00' + x.toString(16)).slice(-2)).join('');
};
