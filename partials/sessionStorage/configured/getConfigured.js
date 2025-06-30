// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getKey from '../getKey';

/** 
* Gets the configured value from session storage.
* @async
* @param {string} key - The key to look up.
* @return {Promise<number>} The configured value.
*/
const getConfigured = async () => {
  // FUTURE - Refactor?
  // FUTURE - Maybe class with checking method?
  const defaultValue = new Date('2099-12-31').valueOf();
  let configuredKey, configuredNonceAB, persistentPrivateKey, persistentPublicKey, configuredValue, sharedSecret, aesKey, decryptedValueAB;

  try {
    configuredKey = await getKey('configured');
  } catch (e) {
    return defaultValue;
  }

  try {
    const configuredNonceB64 = await getKey('configured_nonce');
    configuredNonceAB = Base64ToArrayBuffer(configuredNonceB64);
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.getConfiguredNonceError, { event: e });
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
    throw new TwoFasError(TwoFasError.internalErrors.getConfiguredPersistentPrivateKeyError, { event: e });
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
    throw new TwoFasError(TwoFasError.internalErrors.getConfiguredPersistentPublicKeyError, { event: e });
  }

  try {
    sharedSecret = await crypto.subtle.deriveBits( 
      { name: 'ECDH', namedCurve: 'P-256', public: persistentPublicKey },
      persistentPrivateKey,
      256
    );
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.getConfiguredDeriveBitsError, { event: e });
  }

  try {
    aesKey = await crypto.subtle.importKey(
      'raw',
      sharedSecret,
      'AES-GCM',
      false,
      ['decrypt']
    );
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.getConfiguredAESKeyImportError, { event: e });
  }

  try {
    configuredValue = await storage.getItem(`session:${configuredKey}`);
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.getConfiguredGetItemFromStorageError, { event: e });
  }
  
  if (!configuredValue) {
    return new Date('2099-12-31').valueOf();
  }

  const configuredValueAB = Base64ToArrayBuffer(configuredValue);
  
  try {
    decryptedValueAB = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: configuredNonceAB },
      aesKey,
      configuredValueAB
    );
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.getConfiguredDecryptError, { event: e });
  }

  const decryptedValue = ArrayBufferToString(decryptedValueAB) || '';
  const valueInt = parseInt(decryptedValue, 10) || defaultValue;

  return valueInt;
};

export default getConfigured;
