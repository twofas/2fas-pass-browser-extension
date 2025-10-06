// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getKey from '@/partials/sessionStorage/getKey';
import shuffleArray from '@/partials/functions/shuffleArray';
import setStorageChunkSize from './setStorageChunkSize';

/** 
* Saves the services in chunks in the session storage.
* @deprecated Use saveItems instead.
* @async
* @param {string} gzipData - The gzip data to be saved in chunks.
* @param {string} deviceId - The device ID.
* @return {boolean} Returns true if the services are saved successfully, otherwise false.
*/
const saveServices = async (gzipData, deviceId) => {
  const chunkSize = setStorageChunkSize(gzipData.length);
  const chunksData = gzipData.match(new RegExp(`.{1,${chunkSize}}`, 'g'));
  const chunksArray = [];

  const keyPromises = chunksData.map((_, i) => getKey('services', { deviceId, chunkIndex: i }).catch(() => null));
  const keys = await Promise.all(keyPromises);

  for (const [i, chunk] of chunksData.entries()) {
    const sKey = keys[i];
    
    if (sKey) {
      chunksArray.push({ key: `session:${sKey}`, value: chunk });
    }
    // FUTURE - Handle case when sKey is null (failed key generation)
  }

  shuffleArray(chunksArray);

  await storage.setItems(chunksArray);

  let storageVersion = await storage.getItem('session:storageVersion');
  storageVersion = storageVersion ? parseInt(storageVersion, 10) : 0;
  storageVersion += 1;

  await storage.setItem('session:storageVersion', storageVersion);

  return true;
};

export default saveServices;
