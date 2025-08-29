// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getUUIDforDeviceId from './getUUIDforDeviceId';
import isText from '../functions/isText';

/** 
* Gets a encrypted key for session storage.
* @async
* @param {string} key - The key to look up.
* @param {Object} data - The data to use for key generation.
* @return {string|null} The value for the key, or null if not found.
*/
const getKey = async (key, data) => {
  const persistentKeys = new Set(['configured', 'configured_nonce', 'ephe_public_key', 'ephe_private_key']);
  const ephemeralKeys = new Set(['services', 'tags', 'data_key', 'pass_key_t2', 'pass_key_t3', 'pass_key_t3_new']);

  const keyEnvName = `VITE_STORAGE_SESSION_${key.toUpperCase()}`;
  const keyEnv = import.meta.env[keyEnvName];
  let keyGenerated = keyEnv;
  let cryptoKeyB64, publicKeyKey, cryptoKeyImported, keySigned;
  
  if (!keyEnv) {
    const errObj = TwoFasError.internalErrors.getKeyNotFoundEnv;
    errObj.message = errObj.message.replace('%KEY_NAME%', keyEnvName);

    throw new TwoFasError(errObj, { additional: { func: 'getKey' } });
  }

  switch (key) {
    case 'services': {
      if (data?.deviceId) {
        keyGenerated += `_${data.deviceId}`;
      }

      if (typeof data?.chunkIndex !== 'undefined') {
        keyGenerated += `_${data.chunkIndex}`;
      }

      break;
    }

    case 'data_key':
    case 'pass_key_t3': {
      if (data?.deviceId) {
        keyGenerated += `_${data.deviceId}`;
      }

      break;
    }

    case 'pass_key_t2':
    case 'pass_key_t3_new': {
      if (data?.loginId) {
        keyGenerated += `_${data.loginId}`;
      }

      break;
    }

    case 'ephe_public_key':
    case 'ephe_private_key': {
      if (data?.uuid) {
        keyGenerated += `_${data.uuid}`;
      }

      break;
    }

    default: {
      keyGenerated = keyEnv;
      break;
    }
  }

  if (persistentKeys.has(key)) {
    cryptoKeyB64 = await storage.getItem('local:persistentPublicKey');
  } else if (ephemeralKeys.has(key)) {
    if (!data.uuid && !data.deviceId) {
      throw new TwoFasError(TwoFasError.internalErrors.getKeyNoDeviceIdOrUUID, { additional: { func: 'getKey' } });
    }

    if (!data.uuid && data.deviceId) {
      const uuidFromDevice = await getUUIDforDeviceId(data.deviceId);

      if (!uuidFromDevice || !isText(uuidFromDevice)) {
        const errObj = TwoFasError.internalErrors.getKeyNoUUIDForDeviceId;
        errObj.message = errObj.message.replace('%DEVICE_ID%', data.deviceId);
        throw new TwoFasError(errObj, { additional: { func: 'getKey' } });
      }

      try {
        publicKeyKey = await getKey('ephe_public_key', { uuid: uuidFromDevice });
      } catch (e) {
        throw new TwoFasError(TwoFasError.internalErrors.getKeyPublicKeyError, { event: e });
      }

      cryptoKeyB64 = await storage.getItem(`session:${publicKeyKey}`);
    } else {
      try {
        publicKeyKey = await getKey('ephe_public_key', { uuid: data.uuid });
      } catch (e) {
        throw new TwoFasError(TwoFasError.internalErrors.getKeyPublicKeyError, { event: e });
      }

      cryptoKeyB64 = await storage.getItem(`session:${publicKeyKey}`);
    }
  } else {
    const errObj = TwoFasError.internalErrors.getKeyNotFoundKeyInKeys;
    errObj.message = errObj.message.replace('%KEY_NAME%', key);
    throw new TwoFasError(errObj, { additional: { func: 'getKey' } });
  }

  if (!cryptoKeyB64) {
    throw new TwoFasError(TwoFasError.internalErrors.getKeyCryptoKeyNotFound, { additional: { func: 'getKey', key, data } });
  }

  const cryptoKeyAB = Base64ToArrayBuffer(cryptoKeyB64);

  try {
    cryptoKeyImported = await crypto.subtle.importKey(
      'raw',
      cryptoKeyAB,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.getKeyImportKeyError, { additional: { func: 'getKey', event: e } });
  }
  
  try {
    keySigned = await crypto.subtle.sign(
      { name: 'HMAC' },
      cryptoKeyImported,
      StringToArrayBuffer(keyGenerated)
    );
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.getKeySignError, { additional: { func: 'getKey', event: e } });
  }

  return ArrayBufferToBase64(keySigned);
};

export default getKey;
