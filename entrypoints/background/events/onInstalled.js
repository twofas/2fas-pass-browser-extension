// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import initContextMenu from '../contextMenu/initContextMenu';
import { openInstallPage, updateBadge } from '../utils';
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
  await initContextMenu();

  if (!details) {
    return;
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

  if (details?.reason === 'install') {
    if (import.meta.env.BROWSER !== 'safari') {
      browser.runtime.setUninstallURL(`https://2fas.com/pass/byebye/`);
    }

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
