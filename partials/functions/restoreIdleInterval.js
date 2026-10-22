// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import setIdleInterval from './setIdleInterval.js';

/**
* Function to apply the stored idle lock to the idle detection interval. The browser keeps the interval only while
* the extension stays loaded: after a restart without runtime.onStartup or runtime.onInstalled (crash recovery,
* reload) it falls back to 60 seconds, so this runs on every background start.
* @async
* @return {Promise<void>} A promise that resolves when the interval is set or the failure is reported.
*/
const restoreIdleInterval = async () => {
  try {
    const idleLockValue = await storage.getItem('local:autoIdleLock');
    setIdleInterval(idleLockValue);
    logger.debug(LOGGER_CONSTANTS.CATEGORIES.SYSTEM, 'BackgroundSW - idle interval restored', { autoIdleLock: idleLockValue });
  } catch (e) {
    await CatchError(e);
  }
};

export default restoreIdleInterval;
