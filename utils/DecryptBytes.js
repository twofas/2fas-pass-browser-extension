// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Decrypts the given bytes data.
* @param {ArrayBuffer} bytesData - The bytes data to decrypt.
* @return {Object} An object containing the initialization vector and the decrypted data.
*/
const DecryptBytes = bytesData => {
  if (!(bytesData instanceof ArrayBuffer) && bytesData[Symbol?.toStringTag] !== 'ArrayBuffer') {
    throw new TypeError('DecryptBytes: Expected input to be an ArrayBuffer');
  }

  const ivSize = 12;

  if (bytesData.byteLength < ivSize) {
    throw new TypeError('DecryptBytes: Insufficient data length');
  }

  return {
    iv: new Uint8Array(bytesData.slice(0, ivSize)).buffer,
    data: new Uint8Array(bytesData.slice(ivSize, bytesData.length)).buffer
  };
};

export default DecryptBytes;