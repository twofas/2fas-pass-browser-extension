// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import decompress from '@/partials/gzip/decompress';
import sanitizeObject from '@/partials/functions/sanitizeObject';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import getItemsKeys from './getItemsKeys';

/** 
* Gets the items from session storage.
* @async
* @return {Object[]} The array of items.
*/
const getItems = async () => {
  const configured = await getConfiguredBoolean();

  if (!configured) {
    return [];
  }

  const devices = await storage.getItem('local:devices');

  if (!devices || devices.length <= 0) {
    return [];
  }

  const devicesIds = devices.map(device => device.id).filter(id => id);

  // Process all devices in parallel
  const devicePromises = devicesIds.map(async deviceId => {
    try {
      const itemsKeys = await getItemsKeys(deviceId);
      const chunks = await storage.getItems(itemsKeys);
  
      if (chunks.length > 0) {
        const chunksValues = chunks.map(chunk => chunk.value);
        return chunksValues.join('');
      }

      return null;
    } catch (e) {
      await CatchError(e);
      return null;
    }
  });

  const itemsB64 = (await Promise.all(devicePromises)).filter(Boolean);

  if (itemsB64.length === 0) {
    return [];
  }

  // Process decompression and parsing in parallel
  const processPromises = itemsB64.map(async items => {
    try {
      const itemsDeviceGZIP = Base64ToArrayBuffer(items);
      const itemsDeviceStr = await decompress(itemsDeviceGZIP);
      return JSON.parse(itemsDeviceStr);
    } catch (e) {
      await CatchError(e);
      return null;
    }
  });

  const jsons = (await Promise.all(processPromises)).filter(Boolean);

  console.log(jsons.flat());
  return jsons.flat();

//   // Flatten all jsons into single array
//   const json = jsons.flat().filter(
//     login =>
//       login?.deviceId && 
//       login?.id && 
//       (login?.securityType && Number.isInteger(login?.securityType) && login?.securityType >= SECURITY_TIER.TOP_SECRET && login?.securityType <= SECURITY_TIER.SECRET)
//   );

//   return sanitizeObject(json);
};

export default getItems;
