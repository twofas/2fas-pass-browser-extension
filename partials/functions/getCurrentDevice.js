// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Gets the current device.
* Only returns devices that have a uuid assigned (actively connected).
* Throws if no device with uuid exists.
* @async
* @param {string|null} deviceId - The ID of the device to retrieve, or null to get the most recently used device.
* @return {Object} The current device object.
*/
const getCurrentDevice = async (deviceId = null) => {
  const devices = await storage.getItem('local:devices');

  if (!devices || !Array.isArray(devices) || devices.length === 0) {
    throw new TwoFasError(TwoFasError.internalErrors.getCurrentDeviceNoDevice, { additional: { func: 'getCurrentDevice' } });
  }

  const devicesWithUuid = devices.filter(d => d.uuid);

  if (devicesWithUuid.length === 0) {
    throw new TwoFasError(TwoFasError.internalErrors.getCurrentDeviceLackOfUUID, { additional: { func: 'getCurrentDevice' } });
  }

  let device;

  if (!deviceId) {
    device = devicesWithUuid.sort((a, b) => b.updatedAt - a.updatedAt)[0];
  } else {
    device = devicesWithUuid.find(d => d.id === deviceId);
  }

  if (!device) {
    throw new TwoFasError(TwoFasError.internalErrors.getCurrentDeviceNoDevice, { additional: { func: 'getCurrentDevice' } });
  }

  return device;
};

export default getCurrentDevice;
