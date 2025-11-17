// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getKey from '@/partials/sessionStorage/getKey';
import shuffleArray from '@/partials/functions/shuffleArray';
import setStorageChunkSize from './setStorageChunkSize';
import compress from '@/partials/gzip/compress';
import mapModel from '@/partials/models/itemModels/mapModel';

/** 
* Saves the items in chunks in the session storage.
* @async
* @param {string} itemsData - The items array to be saved.
* @param {string} deviceId - The device ID.
* @param {string} vaultId - The ID of the vault.
* @return {boolean} Returns true if the items are saved successfully, otherwise false.
*/
const saveItems = async (itemsData, deviceId, vaultId) => {
  if (!Array.isArray(itemsData)) {
    throw new Error('Invalid items data: must be an array');
  }

  if (!deviceId) {
    throw new Error('Invalid deviceId: must be provided');
  }

  if (!vaultId) {
    throw new Error('Invalid vaultId: must be provided');
  }

  const correctData = itemsData.map(item => mapModel(item, deviceId, vaultId)).filter(Boolean);

  const jsonString = JSON.stringify(correctData);
  const gzipDataAB = await compress(jsonString);
  const gzipData = ArrayBufferToBase64(gzipDataAB);

  const chunkSize = setStorageChunkSize(gzipData.length);
  const chunksData = gzipData.match(new RegExp(`.{1,${chunkSize}}`, 'g'));
  const chunksArray = [];

  const keyPromises = chunksData.map((_, i) => getKey('items', { deviceId, vaultId, chunkIndex: i }));
  const keys = await Promise.all(keyPromises);

  for (const [i, chunk] of chunksData.entries()) {
    const iKey = keys[i];

    if (iKey) {
      chunksArray.push({ key: `session:${iKey}`, value: chunk });
    }
    // FUTURE - Handle case when iKey is null (failed key generation)
  }

  shuffleArray(chunksArray);

  await storage.setItems(chunksArray);

  let storageVersion = await storage.getItem('session:storageVersion');
  storageVersion = storageVersion ? parseInt(storageVersion, 10) : 0;
  storageVersion += 1;

  await storage.setItem('session:storageVersion', storageVersion);

  return true;
};

export default saveItems;
