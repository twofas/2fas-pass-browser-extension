// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to decrypt values using the local key.
* @async
* @param {string} value - The base64-encoded value to decrypt.
* @param {CryptoKey} localKeyCrypto - The local encryption key.
* @return {Promise<string|null>} The decrypted value or null if an error occurs.
*/
const decryptValuesProcess = async (value, localKeyCrypto) => {
  try {
    const valueAB = Base64ToArrayBuffer(value);
    const decryptedBytes = DecryptBytes(valueAB);
    
    const decryptedAB = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: decryptedBytes.iv },
      localKeyCrypto,
      decryptedBytes.data
    );
    
    return ArrayBufferToString(decryptedAB);
  } catch {
    return null;
  }
};

export default decryptValuesProcess;
