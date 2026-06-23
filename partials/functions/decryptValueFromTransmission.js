// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getLocalKey from '@/entrypoints/background/utils/getLocalKey';

/**
* Decrypts a value that was encrypted with the local key by encryptValueForTransmission.
* Background-side counterpart of the content script's decryptTransmittedValue, used to
* unwrap a password that was kept out of plaintext while it sat in session storage
* (e.g. on http:// pages that cannot run crypto.subtle themselves).
* @param {string} encryptedValue - The base64 encoded encrypted value.
* @param {CryptoKey} [localKeyCrypto] - Optional pre-imported local key. If not provided, will be fetched from storage.
* @return {Promise<{status: string, data?: string, message?: string}>} Decryption result.
*/
const decryptValueFromTransmission = async (encryptedValue, localKeyCrypto) => {
  let localKeyAB = null;
  let importedKey = null;
  let valueAB = null;
  let decryptedBytes = null;
  let decryptedValueAB = null;

  try {
    if (localKeyCrypto) {
      importedKey = localKeyCrypto;
    } else {
      const localKey = await getLocalKey();
      localKeyAB = Base64ToArrayBuffer(localKey);

      importedKey = await crypto.subtle.importKey(
        'raw',
        localKeyAB,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      wipeBuffer(localKeyAB);
      localKeyAB = null;
    }

    valueAB = Base64ToArrayBuffer(encryptedValue);
    decryptedBytes = DecryptBytes(valueAB);
    wipeBuffer(valueAB);
    valueAB = null;

    decryptedValueAB = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: decryptedBytes.iv },
      importedKey,
      decryptedBytes.data
    );

    return { status: 'ok', data: ArrayBufferToString(decryptedValueAB) };
  } catch (e) {
    await CatchError(e);

    return { status: 'error', message: 'Decryption failed' };
  } finally {
    wipeBuffer(localKeyAB);
    localKeyAB = null;
    importedKey = null;
    wipeBuffer(valueAB);
    valueAB = null;
    wipeBuffer(decryptedBytes?.iv);
    wipeBuffer(decryptedBytes?.data);
    decryptedBytes = null;
    wipeBuffer(decryptedValueAB);
    decryptedValueAB = null;
  }
};

export default decryptValueFromTransmission;
