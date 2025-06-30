// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getUUIDforDeviceId from './getUUIDforDeviceId';
import getKey from './getKey';
import isText from '@/partials/functions/isText';

/** 
* Gets the service keys for a device ID from session storage.
* @async
* @param {string} deviceId - The device ID to look up.
* @return {string[]} The array of service keys for the device ID.
*/
const getServicesKeys = async deviceId => {
  if (!deviceId || !isText(deviceId) || deviceId.length === 0) {
    return [];
  }

  const keyEnv = import.meta.env.VITE_STORAGE_SESSION_SERVICES;

  if (!keyEnv || !isText(keyEnv) || keyEnv.length === 0) {
    throw new TwoFasError(TwoFasError.internalErrors.getServicesKeysNotDefined, { additional: { func: 'getServicesKeys' } });
  }

  let keyGenerated = keyEnv + `_${deviceId}`;
  let i = 0;
  const servicesKeys = [];
  let storageKeys;

  try {
    storageKeys = await browser.storage.session.getKeys();
  } catch {
    try {
      const storageData = await browser.storage.session.get(null);
      storageKeys = Object.keys(storageData);
    } catch {
      return [];
    }
  }

  if (!storageKeys || storageKeys.length <= 0) {
    return [];
  }

  const uuid = await getUUIDforDeviceId(deviceId);

  if (!uuid || !isText(uuid) || uuid.length === 0) {
    return [];
  }

  const publicKeyKey = await getKey('ephe_public_key', { uuid });

  if (!publicKeyKey || !isText(publicKeyKey) || publicKeyKey.length === 0) {
    return [];
  }

  const cryptoKeyB64 = await storage.getItem(`session:${publicKeyKey}`);

  if (!cryptoKeyB64 || !isText(cryptoKeyB64) || cryptoKeyB64.length === 0) {
    return [];
  }

  let cryptoKeyImported;

  try {
    const cryptoKeyAB = Base64ToArrayBuffer(cryptoKeyB64);
    cryptoKeyImported = await crypto.subtle.importKey(
      'raw',
      cryptoKeyAB,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.getServicesKeysCryptoKeyError, { additional: { func: 'getServicesKeys' } });
  }

  while (true) {
    const sKey = keyGenerated + `_${i}`;

    const keySigned = await crypto.subtle.sign(
      { name: 'HMAC' },
      cryptoKeyImported,
      StringToArrayBuffer(sKey)
    );

    const keySignedB64 = ArrayBufferToBase64(keySigned);

    if (storageKeys.includes(keySignedB64)) {
      servicesKeys.push(`session:${keySignedB64}`);
    } else {
      break;
    }

    i++;
  }

  return servicesKeys;
};

export default getServicesKeys;
