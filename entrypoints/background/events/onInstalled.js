// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import openInstallPage from '../utils/openInstallPage';
import initContextMenu from '../contextMenu/initContextMenu';
import updateBadge from '../utils/updateBadge';
import runMigrations from '../migrations';

/** 
* Function to handle the installation and update of the extension.
* @async
* @param {Object} details - The details of the installation or update event.
* @return {Promise<void>} A promise that resolves when the installation or update is complete.
*/
const onInstalled = async details => {
  await initContextMenu();

  if (!details) {
    return;
  }

  if (details?.reason === 'install' || details?.reason === 'update') {
    await runMigrations();
  }

  if (details?.reason === 'install') {
    if (import.meta.env.BROWSER !== 'safari') {
      browser.runtime.setUninstallURL(`https://2fas.com/pass/byebye/`);
    }

    try {
      await openInstallPage();
    } catch (err) {
      await CatchError(e);
    }
  } else {
    await updateBadge();
  }
};

export default onInstalled;
