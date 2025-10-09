// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to set the idle interval for the browser.
* @param {string} idleLockValue - The idle lock value to set (in seconds).
* @return {Promise<void>} A promise that resolves when the idle interval is set.
*/
const setIdleInterval = idleLockValue => {
  if (idleLockValue === 'default') {
    browser.idle.setDetectionInterval(config.defaultStorageIdleLock * 60);
  } else {
    browser.idle.setDetectionInterval(idleLockValue * 60);
  }
};

export default setIdleInterval;
