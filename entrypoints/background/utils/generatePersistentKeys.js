// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to generate persistent keys for encryption.
* @async
* @return {Promise<string>} A promise that resolves to the Base64 public key.
*/
const generatePersistentKeys = async () => {
  const keys = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true,
    ['sign', 'verify']
  );

  const [publicKeyArrayBuffer, privateKeyArrayBuffer] = await Promise.all([
    crypto.subtle.exportKey('spki', keys.publicKey),
    crypto.subtle.exportKey('pkcs8', keys.privateKey)
  ]);

  const publicKey = ArrayBufferToBase64(publicKeyArrayBuffer);
  const privateKey = ArrayBufferToBase64(privateKeyArrayBuffer);

  await storage.setItems([
    { key: 'local:persistentPublicKey', value: publicKey },
    { key: 'local:persistentPrivateKey', value: privateKey }  
  ]);

  return publicKey;
};

export default generatePersistentKeys;
