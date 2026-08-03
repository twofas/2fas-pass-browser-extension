// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import isPaidDeviceConnected from '@/partials/functions/isPaidDeviceConnected';

/**
* Adds the expiration date to the device matching the given identifiers.
* @async
* @param {Object} identifiers - The identifiers of the device.
* @param {string} [identifiers.uuid] - The UUID of the device assigned for the current session.
* @param {string} [identifiers.deviceId] - The persistent ID of the device.
* @param {string} expirationDate - The expiration date in Base64 to add.
*/
const addExpirationDateToDevice = async (identifiers, expirationDate) => {
  const { uuid, deviceId } = identifiers || {};
  const devices = await storage.getItem('local:devices') || [];
  // deviceId is the persistent identifier, uuid is only valid for the current session
  const device = devices.find(d => deviceId && d.id === deviceId) || devices.find(d => uuid && d.uuid === uuid);

  if (!device) {
    throw new TwoFasError(TwoFasError.internalErrors.deviceNotFound, { additional: { func: 'addExpirationDateToDevice' } });
  }

  device.expirationDate = expirationDate;
  device.updatedAt = Date.now();

  await storage.setItem('local:devices', devices);

  const paidDeviceConnected = await isPaidDeviceConnected();

  if (!paidDeviceConnected) {
    const autoIdleLockStorage = await storage.getItem('local:autoIdleLock');
    
    if (autoIdleLockStorage === 'default' || autoIdleLockStorage === null) {
      await storage.setItem('local:autoIdleLock', config.defaultStorageIdleLock);

      if (import.meta.env.BROWSER !== 'safari') {
        browser.idle.setDetectionInterval(config.defaultStorageIdleLock * 60);
      }
    }
  }
};

export default addExpirationDateToDevice;
