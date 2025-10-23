// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getUUIDforDeviceId from './getUUIDforDeviceId';
import getKey from './getKey';
import isText from '@/partials/functions/isText';
import { BASE64_REGEX } from '@/constants/regex';

const SESSION_PREFIX = 'session:';

/**
* Gets the items keys for a device ID from session storage.
* @async
* @param {string} deviceId - The device ID to look up.
* @param {string} vaultId - The vault ID to look up.
* @return {string[]} The array of items keys for the device ID.
*/
const getItemsKeys = async (deviceId, vaultId) => {
  const MAX_ITEMS = 10000;
  const BATCH_SIZE = 20;

  if (!deviceId || !isText(deviceId)) {
    return [];
  }

  const keyEnv = import.meta.env.VITE_STORAGE_SESSION_ITEMS;

  if (!keyEnv || !isText(keyEnv)) {
    throw new TwoFasError(TwoFasError.internalErrors.getItemsKeysNotDefined, { additional: { func: 'getItemsKeys' } });
  }

  const keyGenerated = `${keyEnv}_${vaultId}_${deviceId}`;
  let i = 0;
  const itemsKeys = [];
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

  if (!storageKeys || storageKeys.length === 0) {
    return [];
  }

  const storageKeysSet = new Set(storageKeys);
  const uuid = await getUUIDforDeviceId(deviceId);

  if (!uuid || !isText(uuid)) {
    return [];
  }

  const publicKeyKey = await getKey('ephe_public_key', { uuid });

  if (!publicKeyKey || !isText(publicKeyKey)) {
    return [];
  }

  const cryptoKeyB64 = await storage.getItem(SESSION_PREFIX + publicKeyKey);

  if (!cryptoKeyB64 || !isText(cryptoKeyB64)) {
    return [];
  }

  if (!BASE64_REGEX.test(cryptoKeyB64)) {
    throw new TwoFasError(TwoFasError.internalErrors.getItemsKeysInvalidBase64, { additional: { func: 'getItemsKeys' } });
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
    throw new TwoFasError(TwoFasError.internalErrors.getItemsKeysCryptoKeyError, { event: e, additional: { func: 'getItemsKeys' } });
  }

  while (i < MAX_ITEMS) {
    const batchEnd = Math.min(i + BATCH_SIZE, MAX_ITEMS);
    const batchIndices = [];

    for (let j = i; j < batchEnd; j++) {
      batchIndices.push(j);
    }

    let batchResults;

    try {
      batchResults = await Promise.all(
        batchIndices.map(async index => {
          const sKey = keyGenerated + '_' + index;

          const keySigned = await crypto.subtle.sign(
            { name: 'HMAC' },
            cryptoKeyImported,
            StringToArrayBuffer(sKey)
          );

          return {
            index,
            keySignedB64: ArrayBufferToBase64(keySigned)
          };
        })
      );
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.getItemsKeysSignError, { event: e, additional: { func: 'getItemsKeys', iteration: i } });
    }

    let foundGap = false;

    for (const result of batchResults) {
      if (storageKeysSet.has(result.keySignedB64)) {
        itemsKeys.push(SESSION_PREFIX + result.keySignedB64);
      } else {
        foundGap = true;
        break;
      }
    }

    if (foundGap) {
      break;
    }

    i = batchEnd;
  }

  if (i >= MAX_ITEMS && itemsKeys.length > 0) {
    throw new TwoFasError(TwoFasError.internalErrors.getItemsKeysMaxIterationsExceeded, { additional: { func: 'getItemsKeys', maxItems: MAX_ITEMS } });
  }

  try {
    cryptoKeyImported = null;
  } catch {}

  return itemsKeys;
};

export default getItemsKeys;
