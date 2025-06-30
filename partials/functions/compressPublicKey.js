// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Compresses a public key.
* @async
* @param {ArrayBuffer} keyAB - ArrayBuffer of the public key to compress.
* @return {ArrayBuffer} The compressed public key as an ArrayBuffer.
*/
const compressPublicKey = async keyAB => {
  if (!keyAB) {
    throw new TwoFasError(TwoFasError.internalErrors.compressPublicKeyWrongKeyError);
  }

  let keyECDSA, keyRaw;

  try {
    keyECDSA = await crypto.subtle.importKey(
      'spki',
      keyAB,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      []
    );
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.compressPublicKeyImportKeyError, { event: e });
  }

  try {
    keyRaw = await crypto.subtle.exportKey('raw', keyECDSA);
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.compressPublicKeyExportKeyError, { event: e });
  }

  const keyUncompressed = Array.from(new Uint8Array(keyRaw));
  const keySize = (keyUncompressed.length - 1) / 2;
  const keyCompressed = [];
  keyCompressed.push(keyUncompressed[2 * keySize] % 2 ? 3 : 2);
  keyCompressed.push(...keyUncompressed.slice(1, keySize + 1));
  const keyCompressedAB = new Uint8Array(keyCompressed).buffer;

  return keyCompressedAB;
};

export default compressPublicKey;
