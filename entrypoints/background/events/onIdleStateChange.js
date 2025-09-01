// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import cleanupDevices from '@/partials/functions/cleanupDevices';
import isPaidDeviceConnected from '@/partials/functions/isPaidDeviceConnected';

/** 
* Function to handle idle state changes.
* @async
* @param {string} state - The new idle state.
* @return {Promise<boolean>} A promise that resolves to true if the idle state change is handled successfully, otherwise false.
*/
const onIdleStateChange = async state => {
  if (state !== browser.idle.IdleState.IDLE) {
    return false;
  }

  try {
    const autoIdleLock = await storage.getItem('local:autoIdleLock');
    const paidDeviceConnected = await isPaidDeviceConnected();

    if ((autoIdleLock === 'default' || autoIdleLock === null) && paidDeviceConnected) {
      return false;
    }
  
    await cleanupDevices();
    await browser.storage.session.clear();
    return true;
  } catch (e) {
    await CatchError(e);
    return false;
  }
};

export default onIdleStateChange;
