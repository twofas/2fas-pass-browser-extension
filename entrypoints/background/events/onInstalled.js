// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import initContextMenu from '../contextMenu/initContextMenu';
import { openInstallPage, updateBadge, setBadgeLocked } from '../utils';
import runMigrations from '../migrations';
import setIdleInterval from '@/partials/functions/setIdleInterval';
import getItems from '@/partials/sessionStorage/getItems';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';

/**
* Function to handle the installation and update of the extension.
* @async
* @param {Object} details - The details of the installation or update event.
* @param {Object} migrations - The state object to track migrations.
* @return {Promise<void>} A promise that resolves when the installation or update is complete.
*/
const onInstalled = async (details, migrations) => {
  logger.info(LOGGER_CONSTANTS.CATEGORIES.SYSTEM, 'BackgroundSW - onInstalled', {
    reason: details?.reason,
    previousVersion: details?.previousVersion
  });

  await initContextMenu();

  if (!details) {
    return;
  }

  // Snapshot whether this profile was ALREADY initialized BEFORE running migrations.
  // This ordering is load-bearing: migration 0 (defaultStorage) generates the persistent
  // keys and sets local:migrationVersion on a true first install, so reading these markers
  // AFTER runMigrations() would make every fresh install look already-initialized and
  // permanently suppress onboarding. Safari fires onInstalled with reason 'install' (not
  // 'update') on a TestFlight/App Store update while local storage survives — in that case
  // the markers already exist and we must NOT show the onboarding page again.
  let alreadyInitialized = false;

  try {
    const [persistentPrivateKey, persistentPublicKey, migrationVersion] = await Promise.all([
      storage.getItem('local:persistentPrivateKey'),
      storage.getItem('local:persistentPublicKey'),
      storage.getItem('local:migrationVersion')
    ]);
    alreadyInitialized = Boolean((persistentPrivateKey && persistentPublicKey) || (typeof migrationVersion === 'number' && migrationVersion >= 0));
  } catch (e) {
    await CatchError(e);
  }

  if (details?.reason === 'install' || details?.reason === 'update') {
    migrations.state = 'running';

    try {
      await runMigrations();
      migrations.state = true;
    } catch (e) {
      await CatchError(e);
      migrations.state = true;
    }
  } else {
    migrations.state = true;
  }

  const idleLockValue = await storage.getItem('local:autoIdleLock');
  setIdleInterval(idleLockValue);

  if (details?.reason === 'install' && !alreadyInitialized) {
    if (import.meta.env.BROWSER !== 'safari') {
      browser.runtime.setUninstallURL(`https://2fas.com/pass/byebye/`);
    }

    await setBadgeLocked().catch(() => {});

    try {
      await openInstallPage();
    } catch (e) {
      await CatchError(e);
    }
  } else {
    try {
      const configured = await getConfiguredBoolean();

      if (configured) {
        const items = await getItems(['Login']).catch(() => []);
        await updateBadge(true, items).catch(() => {});
      } else {
        await updateBadge(false).catch(() => {});
      }
    } catch {
      await updateBadge(false).catch(() => {});
    }
  }
};

export default onInstalled;
