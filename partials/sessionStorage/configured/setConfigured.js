// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getKey from '../getKey';

/** 
* Sets the configured value in session storage.
* @async
* @param {any} value - The value to set.
* @return {Promise<boolean>} True if the value was set successfully, false otherwise.
*/
const setConfigured = async value => {
  let configuredKey, configuredNonceB64, configuredNonceAB, persistentPrivateKey, persistentPrivateKeyB64, persistentPrivateKeyAB, persistentPublicKey, persistentPublicKeyB64, persistentPublicKeyAB;
  const valueStr = value.toString();

  try {
    [configuredKey, configuredNonceB64, persistentPrivateKeyB64, persistentPublicKeyB64] = await Promise.all([
      getKey('configured'),
      getKey('configured_nonce'),
      storage.getItem('local:persistentPrivateKey'),
      storage.getItem('local:persistentPublicKey')
    ]);
    
    [configuredNonceAB, persistentPrivateKeyAB, persistentPublicKeyAB] = await Promise.all([
      Promise.resolve(Base64ToArrayBuffer(configuredNonceB64)),
      Promise.resolve(Base64ToArrayBuffer(persistentPrivateKeyB64)),
      Promise.resolve(Base64ToArrayBuffer(persistentPublicKeyB64))
    ]);
    
    [persistentPrivateKey, persistentPublicKey] = await Promise.all([
      crypto.subtle.importKey('pkcs8', persistentPrivateKeyAB, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits'] ),
      crypto.subtle.importKey('spki', persistentPublicKeyAB, { name: 'ECDH', namedCurve: 'P-256' }, false, [] )
    ]);
  } catch (e) {
    throw e;
  }

  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', namedCurve: 'P-256', public: persistentPublicKey },
    persistentPrivateKey,
    256
  );

  const aesKey = await crypto.subtle.importKey(
    'raw',
    sharedSecret,
    'AES-GCM',
    false,
    ['encrypt']
  );

  const valueAB = StringToArrayBuffer(valueStr);
  
  const encryptedValue = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: configuredNonceAB },
    aesKey,
    valueAB
  );
  const encryptedValueB64 = ArrayBufferToBase64(encryptedValue);

  await storage.setItem(`session:${configuredKey}`, encryptedValueB64);
  return true;
};

export default setConfigured;
