// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import decompress from '@/partials/gzip/decompress';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import getKey from './getKey';
import Tag from '@/models/Tag';

/** 
* Gets the tags from session storage.
* @async
* @return {Object[]} The array of tags.
*/
const getTags = async () => {
  const configured = await getConfiguredBoolean();

  if (!configured) {
    return [];
  }

  const devices = await storage.getItem('local:devices');

  if (!devices || devices.length <= 0) {
    return [];
  }

  const devicesData = devices.map(device => {
    return {
      deviceId: device?.id,
      vaultsIds: device.vaults.map(vault => vault.id).filter(id => id) || [],
    };
  });

  // Process all devices and their vaults in parallel
  const devicePromises = devicesData.map(async ({ deviceId, vaultsIds }) => {
    // For each device, process all its vaults
    const vaultPromises = vaultsIds.map(async vaultId => {
      let tagsKey;

      try {
        tagsKey = await getKey('tags', { vaultId, deviceId });
      } catch {}

      if (!tagsKey) {
        return null;
      }

      try {
        const tags = await storage.getItem(`session:${tagsKey}`);

        return { deviceId, vaultId, tags };
      } catch (e) {
        await CatchError(e);
        return null;
      }
    });

    return await Promise.all(vaultPromises);
  });

  const vaultResults = await Promise.all(devicePromises);
  const tagsB64 = vaultResults.flat().filter(Boolean);
  const tagsB64Filtered = tagsB64.filter(tagsObj => tagsObj.tags && tagsObj.tags.length > 0);

  if (tagsB64Filtered.length === 0) {
    return [];
  }

  // Process decompression and parsing in parallel
  const processPromises = tagsB64Filtered.map(async ({ deviceId, vaultId, tags }) => {
    try {
      const tagsDeviceGZIP = Base64ToArrayBuffer(tags);
      const tagsDeviceStr = await decompress(tagsDeviceGZIP);
      const json = JSON.parse(tagsDeviceStr);

      return json.map(item => {
        item.deviceId = deviceId;
        item.vaultId = vaultId;
        return item;
      });
    } catch (e) {
      await CatchError(e);
      return null;
    }
  });

  const jsons = (await Promise.all(processPromises)).filter(Boolean);
  const flattened = jsons.flat();

  const mapped = flattened.map(tag => {
    try {
      return new Tag(tag);
    } catch {
      return null;
    }
  }).filter(Boolean);

  return mapped;
};

export default getTags;
