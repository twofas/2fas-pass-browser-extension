// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getCurrentDevice from './getCurrentDevice';

/** 
* Gets the supported features of the current device.
* @async
* @param {string|null} deviceId - The ID of the device to retrieve supported features for, or null to use the most recently used device.
* @return {Array} An array of supported features for the specified device.
*/
const getSupportedFeatures = async (deviceId = null) => {
  const device = await getCurrentDevice(deviceId);
  return device?.supportedFeatures || [];
};

export default getSupportedFeatures;
