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
* @async
* @param {string} gzipData - The gzip data to be saved in chunks.
* @param {string} deviceId - The device ID.
* @return {boolean} Returns true if the services are saved successfully, otherwise false.
*/
const saveServices = async (gzipData, deviceId) => {
  const chunkSize = setStorageChunkSize(gzipData.length);
  const chunksData = gzipData.match(new RegExp(`.{1,${chunkSize}}`, 'g'));
  const chunksArray = [];

  for (const [i, chunk] of chunksData.entries()) {
    let sKey;

    try {
      sKey = await getKey('services', { deviceId, chunkIndex: i });
    } catch {} // FUTURE - Error handling?

    chunksArray.push({
      key: `session:${sKey}`,
      value: chunk
    });
  };

  shuffleArray(chunksArray);

  const promises = chunksArray.map(chunk => storage.setItem(chunk.key, chunk.value));

  await Promise.all(promises);

  let storageVersion = await storage.getItem('session:storageVersion');
  storageVersion = storageVersion ? parseInt(storageVersion, 10) : 0;
  storageVersion += 1;

  await storage.setItem('session:storageVersion', storageVersion);

  return true;
};

export default saveServices;
