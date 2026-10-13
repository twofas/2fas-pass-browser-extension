// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import setIdleInterval from '@/partials/functions/setIdleInterval';
import initContextMenu from '../contextMenu/initContextMenu';
import { setBadgeLocked, updateBadge } from '../utils';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import getItems from '@/partials/sessionStorage/getItems';
import initializeStorage from '../migrations/initializeStorage';

/**
* Function to bring the storage up to date and clean up old devices from local storage on startup.
* @async
* @param {Object} migrations - The state object to track migrations.
* @return {Promise<void>} A promise that resolves when the cleanup is complete.
*/
const onStartup = async migrations => {
  logger.info(LOGGER_CONSTANTS.CATEGORIES.SYSTEM, 'BackgroundSW - onStartup');

  await initializeStorage(migrations);

  try {
    const configured = await getConfiguredBoolean();

    if (configured) {
      const items = await getItems(['Login', 'PaymentCard']).catch(() => []);
      await updateBadge(true, items).catch(() => {});
    } else {
      await setBadgeLocked().catch(() => {});
    }
  } catch {
    await setBadgeLocked().catch(() => {});
  }

  // Recreate context menus on browser startup
  // Firefox doesn't persist context menus between sessions unlike Chrome
  try {
    await initContextMenu();
  } catch (e) {
    await CatchError(e);
  }

  const idleLockValue = await storage.getItem('local:autoIdleLock');
  setIdleInterval(idleLockValue);

  const devices = await storage.getItem('local:devices');

  if (devices && Array.isArray(devices)) {
    devices.forEach(device => { delete device.uuid; });

    const filteredDevices = devices.filter(device =>
      device.id &&
      device.sessionId &&
      new Date(device.updatedAt) > new Date(Date.now() - config.devicesCleanupThreshold * 24 * 60 * 60 * 1000)
    );

    await storage.setItem('local:devices', filteredDevices);
  }
};

export default onStartup;
