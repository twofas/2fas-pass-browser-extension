// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Adds the FCM token to the device with the given UUID.
* @async
* @param {string} uuid - The UUID of the device.
* @param {string} fcmToken - The FCM token to add.
* @return {Promise<void>}
*/
const addFcmTokenToDevice = async (uuid, fcmToken) => {
  const devices = await storage.getItem('local:devices') || [];
  const device = devices.find(d => d.uuid === uuid);

  if (!device) {
    throw new TwoFasError(TwoFasError.internalErrors.deviceNotFound, { additional: { func: 'addFcmTokenToDevice' } });
  }

  device.fcmToken = fcmToken;
  device.updatedAt = new Date().valueOf();

  await storage.setItem('local:devices', devices);
};

export default addFcmTokenToDevice;
