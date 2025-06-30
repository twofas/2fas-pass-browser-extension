// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Add new session ID to the device.
* @async
* @param {string} uuid - The UUID of the device.
* @param {string} newSessionId - The new session ID to add.
* @return {Promise<void>}
*/
const addNewSessionIdToDevice = async (uuid, newSessionId) => {
  const devices = await storage.getItem('local:devices') || [];
  const device = devices.find(d => d.uuid === uuid);

  if (!device) {
    throw new TwoFasError(TwoFasError.internalErrors.deviceNotFound, { additional: { func: 'addNewSessionIdToDevice' } });
  }

  device.sessionId = newSessionId;
  device.updatedAt = new Date().valueOf();

  await storage.setItem('local:devices', devices);
};

export default addNewSessionIdToDevice;
