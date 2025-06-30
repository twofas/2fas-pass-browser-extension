// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import decompress from '@/partials/gzip/decompress';
import sanitizeObject from '@/partials/functions/sanitizeObject';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import getServicesKeys from './getServicesKeys';

/** 
* Gets the services from session storage.
* @async
* @return {Object[]} The array of services.
*/
const getServices = async () => {
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
      const servicesKeys = await getServicesKeys(deviceId);
      const chunks = await storage.getItems(servicesKeys);
  
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

  const loginsB64 = (await Promise.all(devicePromises)).filter(Boolean);

  if (loginsB64.length === 0) {
    return [];
  }

  // Process decompression and parsing in parallel
  const processPromises = loginsB64.map(async logins => {
    try {
      const loginsDeviceGZIP = Base64ToArrayBuffer(logins);
      const loginsDeviceStr = await decompress(loginsDeviceGZIP);
      return JSON.parse(loginsDeviceStr);
    } catch (e) {
      await CatchError(e);
      return null;
    }
  });

  const jsons = (await Promise.all(processPromises)).filter(Boolean);

  // Flatten all jsons into single array
  const json = jsons.flat().filter(
    login =>
      login?.deviceId && 
      login?.id && 
      (login?.securityType && Number.isInteger(login?.securityType) && login?.securityType >= 0 && login?.securityType <= 2)
  );

  return sanitizeObject(json);
};

export default getServices;
