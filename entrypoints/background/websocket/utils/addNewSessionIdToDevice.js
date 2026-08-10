// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Add new session ID to the device matching the given identifiers.
* @async
* @param {Object} identifiers - The identifiers of the device.
* @param {string} [identifiers.uuid] - The UUID of the device assigned for the current session.
* @param {string} [identifiers.deviceId] - The persistent ID of the device.
* @param {string} newSessionId - The new session ID to add.
* @return {Promise<void>}
*/
const addNewSessionIdToDevice = async (identifiers, newSessionId) => {
  const { uuid, deviceId } = identifiers || {};
  const devices = await storage.getItem('local:devices') || [];
  // deviceId is the persistent identifier, uuid is dropped by cleanupDevices mid-conversation
  const device = devices.find(d => deviceId && d.id === deviceId) || devices.find(d => uuid && d.uuid === uuid);

  if (!device) {
    throw new TwoFasError(TwoFasError.internalErrors.deviceNotFound, { additional: { func: 'addNewSessionIdToDevice' } });
  }

  device.sessionId = newSessionId;
  device.updatedAt = Date.now();

  await storage.setItem('local:devices', devices);
};

export default addNewSessionIdToDevice;
