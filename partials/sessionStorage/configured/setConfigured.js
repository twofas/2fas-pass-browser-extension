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
  // FUTURE - Refactor
  let configuredKey, configuredNonceAB, persistentPrivateKey, persistentPublicKey, configuredValue;
  const valueStr = value.toString();

  try {
    configuredKey = await getKey('configured');
  } catch (e) {
    throw e;
  }

  try {
    const configuredNonceB64 = await getKey('configured_nonce');
    configuredNonceAB = Base64ToArrayBuffer(configuredNonceB64);
  } catch (e) {
    throw e;
  }

  try {
    const persistentPrivateKeyB64 = await storage.getItem('local:persistentPrivateKey');
    const persistentPrivateKeyAB = Base64ToArrayBuffer(persistentPrivateKeyB64);
    persistentPrivateKey = await crypto.subtle.importKey(
      'pkcs8',
      persistentPrivateKeyAB,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      ['deriveBits']
    );
  } catch (e) {
    throw e;
  }

  try {
    const persistentPublicKeyB64 = await storage.getItem('local:persistentPublicKey');
    const persistentPublicKeyAB = Base64ToArrayBuffer(persistentPublicKeyB64);
    persistentPublicKey = await crypto.subtle.importKey(
      'spki',
      persistentPublicKeyAB,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );
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
