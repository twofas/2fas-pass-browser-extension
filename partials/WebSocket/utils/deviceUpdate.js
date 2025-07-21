// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Updates the device with the given UUID.
* @async
* @param {string} uuid - The UUID of the device to update.
* @param {object} payload - The payload to update the device with.
* @return {string} The ID of the updated device.
*/
const deviceUpdate = async (uuid, payload) => {
  let devices = await storage.getItem('local:devices') || [];
  devices = devices.filter(d => d.id !== payload.deviceId); // Remove old devices with the same ID

  const device = devices.find(d => d.uuid === uuid);

  if (!device) {
    throw new TwoFasError(TwoFasError.internalErrors.deviceNotFound, { additional: { func: 'deviceUpdate' } });
  }

  device.name = payload.deviceName || '2FAS Pass Mobile App';
  device.id = payload.deviceId;
  device.platform = payload.deviceOs || '';
  device.updatedAt = Date.now();

  await storage.setItem('local:devices', devices);

  return device.id;
};

export default deviceUpdate;
