// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import isPaidDeviceConnected from '@/partials/functions/isPaidDeviceConnected';

/** 
* Adds the expiration date to the device with the given UUID.
* @async
* @param {string} uuid - The UUID of the device.
* @param {string} expirationDate - The expiration date in Base64 to add.
*/
const addExpirationDateToDevice = async (uuid, expirationDate) => {
  const devices = await storage.getItem('local:devices') || [];
  const device = devices.find(d => d.uuid === uuid);

  if (!device) {
    throw new TwoFasError(TwoFasError.internalErrors.deviceNotFound, { additional: { func: 'addExpirationDateToDevice' } });
  }

  device.expirationDate = expirationDate;
  device.updatedAt = new Date().valueOf();

  await storage.setItem('local:devices', devices);

  const paidDeviceConnected = await isPaidDeviceConnected();

  if (!paidDeviceConnected) {
    await storage.setItem('local:autoIdleLock', config.defaultStorageIdleLock);

    if (import.meta.env.BROWSER !== 'safari') {
      browser.idle.setDetectionInterval(config.defaultStorageIdleLock * 60);
    }
  }
};

export default addExpirationDateToDevice;
