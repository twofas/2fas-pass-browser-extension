// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Gets the current device.
* @async
* @param {string|null} deviceId - The ID of the device to retrieve, or null to get the most recently used device.
* @return {Object} The current device object.
*/
const getCurrentDevice = async (deviceId = null) => {
  const devices = await storage.getItem('local:devices');
  let device;

  if (!deviceId) {
    device = devices.sort((a, b) => b.updatedAt - a.updatedAt)[0];
  } else {
    device = devices.find(device => device.id === deviceId);
  }

  if (!device) {
    throw new TwoFasError(TwoFasError.internalErrors.getCurrentDeviceNoDevice, { additional: { func: 'getCurrentDevice' } });
  }

  if (!device?.uuid) {
    throw new TwoFasError(TwoFasError.internalErrors.getCurrentDeviceLackOfUUID, { additional: { func: 'getCurrentDevice' } });
  }

  return device;
};

export default getCurrentDevice;
