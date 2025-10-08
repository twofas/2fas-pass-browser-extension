// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import decompress from '@/partials/gzip/decompress';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import getItemsKeys from './getItemsKeys';
import matchModel from '../models/matchModel';

/** 
* Gets the items from session storage.
* @async
* @return {Object[]} The array of items.
*/
const getItems = async () => {
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

  const devicesIds = devices.map(device => device?.id).filter(id => id);

  if (devicesIds.length === 0) {
    return [];
  }

  // Process all devices in parallel
  const devicePromises = devicesIds.map(async deviceId => {
    try {
      const itemsKeys = await getItemsKeys(deviceId);

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

  const itemsB64 = (await Promise.all(devicePromises)).filter(Boolean);

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

  const mapped = flattened.map(matchModel).filter(Boolean);

  console.log(mapped);

  return mapped;
};

export default getItems;
