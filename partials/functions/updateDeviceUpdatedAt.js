// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Updates the 'updatedAt' timestamp of a device.
* @async
* @param {Object} device - The device object to update.
* @return {Promise<void>} A promise that resolves when the update is complete.
*/
const updateDeviceUpdatedAt = async device => {
  const devices = await storage.getItem('local:devices');
  const currentDevice = devices.find(d => d.id === device.id);

  if (currentDevice) {
    currentDevice.updatedAt = Date.now();
    await storage.setItem('local:devices', devices);
  }
};

export default updateDeviceUpdatedAt;
