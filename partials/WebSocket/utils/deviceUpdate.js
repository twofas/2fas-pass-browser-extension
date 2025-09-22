// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Updates the device with the given UUID.
* @async
* @param {string} uuid - The UUID of the device to update.
* @param {object} json - The JSON object containing the device data.
* @return {string} The ID of the updated device.
*/
const deviceUpdate = async (uuid, json) => {
  let devices = await storage.getItem('local:devices') || [];
  const device = devices.find(d => d.uuid === uuid);
  
  if (!device) {
    throw new TwoFasError(TwoFasError.internalErrors.deviceNotFound, { additional: { func: 'deviceUpdate' } });
  }
  
  device.name = json?.payload?.deviceName || '2FAS Pass Mobile App';
  device.id = json?.payload?.deviceId;
  device.scheme = json?.scheme || null;
  device.platform = json?.payload?.deviceOs || '';
  device.supportedFeatures = json?.payload?.supportedFeatures || [];
  device.updatedAt = Date.now();

  devices = devices.filter(d => d?.id === json?.payload?.deviceId && d?.uuid === uuid); // Remove old devices with the same ID

  await storage.setItem('local:devices', devices);

  return device.id;
};

export default deviceUpdate;
