// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import isPaidDeviceConnected from './isPaidDeviceConnected';
import setIdleInterval from './setIdleInterval';

/**
* Restores the default idle lock when no paid device is connected.
* The 'default' value (lock only on restart) is a paid-only choice, so it must not survive
* the last paid device going away.
* @async
* @return {Promise<boolean>} True if the idle lock was restored, false otherwise.
*/
const restoreDefaultIdleLockIfNotPaid = async () => {
  const paidDeviceConnected = await isPaidDeviceConnected();

  if (paidDeviceConnected) {
    return false;
  }

  const autoIdleLockStorage = await storage.getItem('local:autoIdleLock');

  if (autoIdleLockStorage !== 'default' && autoIdleLockStorage !== null) {
    return false;
  }

  await storage.setItem('local:autoIdleLock', config.defaultStorageIdleLock);
  setIdleInterval(config.defaultStorageIdleLock);

  return true;
};

export default restoreDefaultIdleLockIfNotPaid;
