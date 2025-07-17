// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Converts an ArrayBuffer to a string.
* @param {ArrayBuffer} ab - The ArrayBuffer to convert to a string.
* @return {string} The resulting string from the ArrayBuffer.
*/
export const ArrayBufferToString = ab => {
  if (!(ab instanceof ArrayBuffer) && ab[Symbol?.toStringTag] !== 'ArrayBuffer') {
    throw new TypeError('ArrayBufferToString: Expected input to be an ArrayBuffer');
  }

  return new TextDecoder().decode(ab);
};
