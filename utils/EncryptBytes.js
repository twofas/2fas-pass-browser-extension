// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * Encrypts the given initialization vector and data.
 * @param {ArrayBuffer} iv - The initialization vector to use for encryption.
 * @param {ArrayBuffer} data - The data to encrypt.
 * @return {ArrayBuffer} The encrypted bytes as an ArrayBuffer.
 */
const EncryptBytes = (iv, data) => {
  if (!(iv instanceof ArrayBuffer)) {
    throw new TypeError('EncryptBytes: Expected IV to be an ArrayBuffer');
  }

  if (!(data instanceof ArrayBuffer)) {
    throw new TypeError('EncryptBytes: Expected data to be an ArrayBuffer');
  }

  const ivBuffer = new Uint8Array(iv);
  const dataBuffer = new Uint8Array(data);
  const encryptedBytes = new Uint8Array(ivBuffer.length + dataBuffer.length);
  encryptedBytes.set(ivBuffer);
  encryptedBytes.set(dataBuffer, ivBuffer.length);

  return encryptedBytes.buffer;
};

export default EncryptBytes;