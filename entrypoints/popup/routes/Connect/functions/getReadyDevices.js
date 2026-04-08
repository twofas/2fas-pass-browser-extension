// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const getReadyDevices = async () => {
  const devices = await storage.getItem('local:devices') || [];
  const filteredDevices = devices.filter(device => {
    return device.scheme && device.scheme >= config.schemeThreshold &&
           device.platform && device.sessionId;
  });

  return filteredDevices.sort((a, b) => {
    const dateA = a?.updatedAt || 0;
    const dateB = b?.updatedAt || 0;

    return dateB - dateA;
  });
};

export default getReadyDevices;
