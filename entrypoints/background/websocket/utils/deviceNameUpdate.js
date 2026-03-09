// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Updates the name of the device with the given ID.
* @async
* @param {Object} payload - The payload containing the device ID and new name.
* @param {string} payload.deviceId - The ID of the device to update.
* @param {string} payload.deviceName - The new name for the device.
* @return {string} The ID of the updated device.
*/
const deviceNameUpdate = async payload => {
  const devices = await storage.getItem('local:devices') || [];
  const device = devices.find(d => d.id === payload.deviceId);

  if (!device) {
    throw new TwoFasError(TwoFasError.internalErrors.deviceNotFound, { additional: { func: 'deviceNameUpdate' } });
  }

  device.name = payload.deviceName || '2FAS Pass Mobile App';
  device.updatedAt = Date.now();

  await storage.setItem('local:devices', devices);

  return payload.deviceId;
};

export default deviceNameUpdate;
