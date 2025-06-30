// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to clean up old devices from local storage on startup.
* @async
* @return {Promise<void>} A promise that resolves when the cleanup is complete.
*/
const onStartup = async () => {
  const devices = await storage.getItem('local:devices');

  const filteredDevices = devices.filter(device => 
    device.id && 
    device.sessionId && 
    new Date(device.updatedAt) < new Date(Date.now() - config.devicesCleanupThreshold * 24 * 60 * 60 * 1000)
  );

  await storage.setItem('local:devices', filteredDevices);
};

export default onStartup;
