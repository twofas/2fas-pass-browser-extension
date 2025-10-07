// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getKey from '@/partials/sessionStorage/getKey';
import decompress from '@/partials/gzip/decompress';
import compress from '@/partials/gzip/compress';
import Tag from '@/partials/models/Tag';

/** 
* Saves the tags in the session storage.
* @async
* @param {string} gzipInputData - The gzip input data to be saved.
* @param {string} deviceId - The device ID.
* @return {boolean} Returns true if the tags are saved successfully, otherwise false.
*/
const saveTags = async (gzipInputData, deviceId) => {
  // @TODO: Add ifs for empty data etc.
  const decompressedData = await decompress(Base64ToArrayBuffer(gzipInputData));
  const decompressedJSON = JSON.parse(decompressedData);

  const validTags = [];

  for (const tagData of decompressedJSON) {
    try {
      const tag = new Tag(tagData);
      validTags.push(tag);
    } catch {}
  }

  const jsonString = JSON.stringify(validTags);
  const gzipDataAB = await compress(jsonString);
  const gzipData = ArrayBufferToBase64(gzipDataAB);

  const tagsKey = await getKey('tags', { deviceId });
  await storage.setItem(`session:${tagsKey}`, gzipData);

  let storageVersion = await storage.getItem('session:storageVersion');
  storageVersion = storageVersion ? parseInt(storageVersion, 10) : 0;
  storageVersion += 1;

  await storage.setItem('session:storageVersion', storageVersion);

  return true;
};

export default saveTags;
