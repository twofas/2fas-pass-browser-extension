// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import decompress from '@/partials/gzip/decompress';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import getKey from './getKey';
import Tag from '../models/Tag';

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

  const devicesIds = devices.map(device => device.id).filter(id => id);

  // Process all devices in parallel
  const devicePromises = devicesIds.map(async deviceId => {
    try {
      const tagsKey = await getKey('tags', { deviceId });
      const tags = await storage.getItem(`session:${tagsKey}`);

      return { deviceId, tags };
    } catch (e) {
      await CatchError(e);
      return null;
    }
  });

  const tagsB64 = (await Promise.all(devicePromises)).filter(Boolean);

  if (tagsB64.length === 0) {
    return [];
  }

  // Process decompression and parsing in parallel
  const processPromises = tagsB64.map(async ({ deviceId, tags }) => {
    try {
      const tagsDeviceGZIP = Base64ToArrayBuffer(tags);
      const tagsDeviceStr = await decompress(tagsDeviceGZIP);
      const json = JSON.parse(tagsDeviceStr);

      return json.map(item => {
        item.deviceId = deviceId;
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
