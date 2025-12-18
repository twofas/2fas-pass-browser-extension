// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import decompress from '@/partials/gzip/decompress';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import getItemsKeys from './getItemsKeys';
import matchModel from '@/models/itemModels/matchModel';

/** 
* Gets the items from session storage.
* @async
* @return {Object[]} The array of items.
*/
const getItems = async (filter = []) => {
  let configured;

  try {
    configured = await getConfiguredBoolean();
  } catch (e) {
    await CatchError(e);
    return [];
  }

  if (!configured) {
    return [];
  }

  let devices;

  try {
    devices = await storage.getItem('local:devices');
  } catch (e) {
    await CatchError(e);
    return [];
  }

  if (!devices || !Array.isArray(devices) || devices.length === 0) {
    return [];
  }

  const devicesData = devices.map(device => {
    return {
      deviceId: device?.id,
      vaultsIds: device.vaults.map(vault => vault.id).filter(id => id) || [],
    };
  });

  if (devicesData.length === 0) {
    return [];
  }

  // Process all devices and their vaults in parallel
  const devicePromises = devicesData.map(async ({ deviceId, vaultsIds }) => {
    // For each device, process all its vaults
    const vaultPromises = vaultsIds.map(async vaultId => {
      try {
        const itemsKeys = await getItemsKeys(deviceId, vaultId);

        if (!Array.isArray(itemsKeys) || itemsKeys.length === 0) {
          return null;
        }

        const chunks = await storage.getItems(itemsKeys);

        if (!Array.isArray(chunks) || chunks.length === 0) {
          return null;
        }

        return chunks.map(chunk => chunk?.value).filter(Boolean).join('');
      } catch (e) {
        await CatchError(e);
        return null;
      }
    });

    return await Promise.all(vaultPromises);
  });

  const vaultResults = await Promise.all(devicePromises);
  const itemsB64 = vaultResults.flat().filter(Boolean);

  if (itemsB64.length === 0) {
    return [];
  }

  // Process decompression and parsing in parallel
  const processPromises = itemsB64.map(async items => {
    try {
      const itemsDeviceGZIP = Base64ToArrayBuffer(items);
      const itemsDeviceStr = await decompress(itemsDeviceGZIP);
      const parsed = JSON.parse(itemsDeviceStr);

      if (!Array.isArray(parsed)) {
        return null;
      }

      return parsed;
    } catch (e) {
      await CatchError(e);
      return null;
    }
  });

  const jsons = (await Promise.all(processPromises)).filter(Boolean);
  const flattened = jsons.flat();

  const mappedPromises = flattened.map(matchModel);
  const mapped = (await Promise.all(mappedPromises)).filter(Boolean);

  if (filter && Array.isArray(filter) && filter.length > 0) {
    return mapped.filter(item => filter.includes(item?.constructor?.name));
  }

  return mapped;
};

export default getItems;
