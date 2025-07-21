// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to generate a local encryption key.
* @async
* @return {Promise<string>} A promise that resolves to the Base64 encoded local key.
*/
const generateLocalKey = async () => {
  let localKey, exportedKey;

  try {
    localKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.generateLocalKeyGenerateKeyError, { additional: { event: e } });
  }

  try {
    exportedKey = await crypto.subtle.exportKey('raw', localKey);
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.generateLocalKeyExportKeyError, { additional: { event: e } });
  }

  return ArrayBufferToBase64(exportedKey);
};

export default generateLocalKey;
