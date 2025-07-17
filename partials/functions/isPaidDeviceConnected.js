// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import isText from './isText';

/** 
* Checks if a paid device is connected.
* @async
* @return {boolean} True if the device is connected and paid, false otherwise.
*/
const isPaidDeviceConnected = async () => { // FUTURE - Change for multiple devices
  const devices = await storage.getItem('local:devices');

  if (!devices || !Array.isArray(devices) || devices.length === 0) {
    return false;
  }

  // Get latest device by updatedAt
  const latestDevice = devices.reduce((latest, device) => {
    return (!latest || (device?.updatedAt && device.updatedAt > latest.updatedAt)) ? device : latest;
  }, null);

  if (!latestDevice) {
    return false;
  }

  const expirationDate = latestDevice?.expirationDate;

  if (!expirationDate || !isText(expirationDate)) {
    return false;
  }

  const expirationDateParsed = atob(expirationDate);
  const expirationDateInt = parseInt(expirationDateParsed, 10);
  const currentDate = Date.now();

  return !isNaN(expirationDateInt) && expirationDateInt > currentDate;
};

export default isPaidDeviceConnected;
