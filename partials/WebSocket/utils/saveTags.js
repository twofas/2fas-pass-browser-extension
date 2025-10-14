// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getKey from '@/partials/sessionStorage/getKey';
import compress from '@/partials/gzip/compress';
import Tag from '@/partials/models/Tag';

/** 
* Saves the tags in the session storage.
* @async
* @param {string} tagsData - The tags array to be saved.
* @param {string} vaultId - The ID of the vault.
* @param {string} deviceId - The device ID.
* @return {boolean} Returns true if the tags are saved successfully, otherwise false.
*/
const saveTags = async (tagsData, vaultId, deviceId) => {
  // @TODO: Add ifs for non array etc.
  const validTags = [];

  for (const tagData of tagsData) {
    try {
      const tag = new Tag(tagData, vaultId, deviceId);
      validTags.push(tag);
    } catch {}
  }

  const jsonString = JSON.stringify(validTags);
  const gzipDataAB = await compress(jsonString);
  const gzipData = ArrayBufferToBase64(gzipDataAB);

  const tagsKey = await getKey('tags', { vaultId, deviceId });
  await storage.setItem(`session:${tagsKey}`, gzipData);

  let storageVersion = await storage.getItem('session:storageVersion');
  storageVersion = storageVersion ? parseInt(storageVersion, 10) : 0;
  storageVersion += 1;

  await storage.setItem('session:storageVersion', storageVersion);

  return true;
};

export default saveTags;
