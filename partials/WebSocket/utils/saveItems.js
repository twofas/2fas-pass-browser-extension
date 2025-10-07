// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getKey from '@/partials/sessionStorage/getKey';
import shuffleArray from '@/partials/functions/shuffleArray';
import setStorageChunkSize from './setStorageChunkSize';
import decompress from '@/partials/gzip/decompress';
import compress from '@/partials/gzip/compress';
import filterModel from './filterModel';

/** 
* Saves the items in chunks in the session storage.
* @async
* @param {string} gzipInputData - The gzip input data to be saved in chunks.
* @param {string} deviceId - The device ID.
* @return {boolean} Returns true if the items are saved successfully, otherwise false.
*/
const saveItems = async (gzipInputData, deviceId) => {
  // @TODO: Add ifs for empty data etc.
  const decompressedData = await decompress(Base64ToArrayBuffer(gzipInputData));
  const decompressedJSON = JSON.parse(decompressedData);

  const correctData = decompressedJSON.filter(filterModel);

  const jsonString = JSON.stringify(correctData);
  const gzipDataAB = await compress(jsonString);
  const gzipData = ArrayBufferToBase64(gzipDataAB);

  const chunkSize = setStorageChunkSize(gzipData.length);
  const chunksData = gzipData.match(new RegExp(`.{1,${chunkSize}}`, 'g'));
  const chunksArray = [];

  const keyPromises = chunksData.map((_, i) => getKey('items', { deviceId, chunkIndex: i }));
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
