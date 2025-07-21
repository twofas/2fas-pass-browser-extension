// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import contextMenuConfigured from '../contextMenu/contextMenuConfigured';
import updateContextMenu from '../utils/updateContextMenu';
import updateBadge from '../utils/updateBadge';
import getServices from '@/partials/sessionStorage/getServices';

/** 
* Function to handle changes in storage version.
* @async
* @return {Promise<void>} A promise that resolves when the storage version change is handled.
*/
const onStorageVersionChange = async () => {
  const contextMenuSetting = await storage.getItem('local:contextMenu');
  let services;

  if (contextMenuSetting === false) {
    await browser.contextMenus.removeAll();
    return;
  }

  try {
    services = await getServices();
  } catch {}

  // Configured always true here
  await contextMenuConfigured(services);
  await updateContextMenu(services);
  await updateBadge(services);
};

export default onStorageVersionChange;
