// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import contextMenuConfigured from '../contextMenu/contextMenuConfigured';
import updateContextMenu from '../utils/updateContextMenu';
import updateBadge from '../utils/updateBadge';

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

  // Configured always true here
  await contextMenuConfigured();
  await updateContextMenu();
  await updateBadge();
};

export default onStorageVersionChange;
