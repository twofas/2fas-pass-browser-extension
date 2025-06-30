// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Gets the UUID for a device ID from session storage.
* @async
* @param {string} deviceId - The device ID to look up.
* @return {string|null} The UUID for the device ID, or null if not found.
*/
const getUUIDforDeviceId = async deviceId => {
  const devices = await storage.getItem('local:devices') || [];
  const device = devices.find(d => d.id === deviceId);

  if (!device) {
    return null;
  }

  return device.uuid;
};

export default getUUIDforDeviceId;
