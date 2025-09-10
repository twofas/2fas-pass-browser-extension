// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getKey from '@/partials/sessionStorage/getKey';

/** 
* Saves the tags in the session storage.
* @async
* @param {string} gzipData - The gzip data to be saved.
* @param {string} deviceId - The device ID.
* @return {boolean} Returns true if the tags are saved successfully, otherwise false.
*/
const saveTags = async (gzipData, deviceId) => {
  const tagsKey = await getKey('tags', { deviceId });
  await storage.setItem(`session:${tagsKey}`, gzipData);

  let storageVersion = await storage.getItem('session:storageVersion');
  storageVersion = storageVersion ? parseInt(storageVersion, 10) : 0;
  storageVersion += 1;

  await storage.setItem('session:storageVersion', storageVersion);

  return true;
};

export default saveTags;
