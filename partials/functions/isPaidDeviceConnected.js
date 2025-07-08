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
const isPaidDeviceConnected = async () => {
  const devices = await storage.getItem('local:devices');
  const expirationDatesB64 = devices.map(device => device?.expirationDate);

  const expirationDates = expirationDatesB64.map(date => (date && isText(date)) ? atob(date) : null).filter(Boolean);

  if (!expirationDates || expirationDates.length === 0) {
    return false;
  }

  const currentDate = Date.now();

  const validExpirationDates = expirationDates.filter(date => date && parseInt(date, 10) || 0 > currentDate);

  return !!(validExpirationDates && validExpirationDates.length > 0);
};

export default isPaidDeviceConnected;
