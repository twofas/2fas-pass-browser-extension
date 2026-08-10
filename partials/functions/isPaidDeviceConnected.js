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

  // Skip placeholders pushed by generateEphemeralKeys before a pairing completes
  const pairedDevices = devices.filter(d => d?.id);

  if (pairedDevices.length === 0) {
    return false;
  }

  // Get latest device by updatedAt
  const latestDevice = pairedDevices.reduce((latest, device) => {
    return (!latest || (device?.updatedAt && device.updatedAt > latest.updatedAt)) ? device : latest;
  }, null);

  if (!latestDevice) {
    return false;
  }

  const expirationDate = latestDevice?.expirationDate;

  if (!expirationDate || !isText(expirationDate)) {
    return false;
  }

  let expirationDateParsed;

  try {
    expirationDateParsed = atob(expirationDate);
  } catch {
    return false;
  }

  if (!/^\d+$/.test(expirationDateParsed)) {
    return false;
  }

  const expirationDateInt = Number(expirationDateParsed);
  const currentDate = Date.now();

  return Number.isSafeInteger(expirationDateInt) && expirationDateInt > currentDate;
};

export default isPaidDeviceConnected;
