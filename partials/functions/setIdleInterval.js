// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Function to set the idle detection interval for the browser.
* @param {number|string|null} idleLockValue - The stored idle lock in minutes, or 'default' for "only on restart". Any value other than a positive integer falls back to the default interval.
* @return {void}
*/
const setIdleInterval = idleLockValue => {
  if (import.meta.env.BROWSER === 'safari') {
    return;
  }

  const minutes = Number.isInteger(idleLockValue) && idleLockValue > 0 ? idleLockValue : config.defaultStorageIdleLock;
  browser.idle.setDetectionInterval(minutes * 60);
};

export default setIdleInterval;
