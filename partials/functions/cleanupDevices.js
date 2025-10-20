// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Cleans up the devices stored in local storage by removing unnecessary properties and duplicates.
* @async
* @return {Promise<void>}
*/
const cleanupDevices = async () => {
  const devices = await storage.getItem('local:devices');

  if (!devices) {
    return;
  }
  
  // Remove uuid from devices
  devices.forEach(device => {
    delete device.uuid;
  });

  // Remove devices without id
  const filteredDevices = devices.filter(device => device.id);

  // Remove devices without scheme or with smaller scheme version than 2
  const schemeFilteredDevices = filteredDevices.filter(device => {
    return device.scheme && device.scheme >= config.schemeThreshold;
  });

  // Remove duplicates based on updatedAt
  const uniqueDevices = schemeFilteredDevices.reduce((acc, device) => {
    const existingDevice = acc.find(d => d.id === device.id);

    if (!existingDevice) {
      acc.push(device);
    } else if (existingDevice.updatedAt < device.updatedAt) {
      acc[acc.indexOf(existingDevice)] = device;
    }

    return acc;
  }, []);

  await storage.setItem('local:devices', uniqueDevices);
};

export default cleanupDevices;
