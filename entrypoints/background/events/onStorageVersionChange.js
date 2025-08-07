// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import initContextMenu from '../contextMenu/initContextMenu';
import updateContextMenu from '../utils/updateContextMenu';
import updateBadge from '../utils/badge/updateBadge';
import getServices from '@/partials/sessionStorage/getServices';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';

/** 
* Function to handle changes in storage version.
* @async
* @return {Promise<void>} A promise that resolves when the storage version change is handled.
*/
const onStorageVersionChange = async () => {
  const contextMenuSetting = await storage.getItem('local:contextMenu');
  
  if (contextMenuSetting === false) {
    await browser.contextMenus.removeAll();
    return;
  }

  let services, configured;

  try {
    [services, configured] = await Promise.all([
      getServices().catch(() => []),
      getConfiguredBoolean().catch(() => false)
    ]);
  } catch {}

  await initContextMenu();
  await updateContextMenu(services);
  await updateBadge(configured, services);
};

export default onStorageVersionChange;
