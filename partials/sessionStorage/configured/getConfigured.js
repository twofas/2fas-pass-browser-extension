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
  // FUTURE - Maybe class with checking method?
  const defaultValue = new Date('2099-12-31').valueOf();
  let configuredKey, configuredNonceB64, configuredNonceAB, persistentPrivateKey, persistentPublicKey, configuredValue, sharedSecret, aesKey, decryptedValueAB;

  try {
    [configuredKey, configuredNonceB64] = await Promise.all([
      getKey('configured'),
      getKey('configured_nonce')
    ]);
    
    configuredNonceAB = Base64ToArrayBuffer(configuredNonceB64);
  } catch (e) {
    if (e.message?.includes('configured') && !e.message?.includes('nonce')) {
      return defaultValue;
    }
    
    throw new TwoFasError(TwoFasError.internalErrors.getConfiguredNonceError, { event: e });
  }

  try {
    const [persistentPrivateKeyB64, persistentPublicKeyB64] = await Promise.all([
      storage.getItem('local:persistentPrivateKey'),
      storage.getItem('local:persistentPublicKey')
    ]);

    const [persistentPrivateKeyAB, persistentPublicKeyAB] = await Promise.all([
      Promise.resolve(Base64ToArrayBuffer(persistentPrivateKeyB64)),
      Promise.resolve(Base64ToArrayBuffer(persistentPublicKeyB64))
    ]);

    [persistentPrivateKey, persistentPublicKey] = await Promise.all([
      crypto.subtle.importKey('pkcs8', persistentPrivateKeyAB, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits'] ),
      crypto.subtle.importKey('spki', persistentPublicKeyAB, { name: 'ECDH', namedCurve: 'P-256' }, false, [] )
    ]);

  } catch (e) {
    const isPrivateKeyError = e.message?.includes('pkcs8') || e.message?.includes('deriveBits');
    const errorType = isPrivateKeyError 
      ? TwoFasError.internalErrors.getConfiguredPersistentPrivateKeyError
      : TwoFasError.internalErrors.getConfiguredPersistentPublicKeyError;
    
    throw new TwoFasError(errorType, { event: e });
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
