// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import initContextMenu from '../contextMenu/initContextMenu';
import { updateContextMenu, updateBadge } from '../utils';
import getItems from '@/partials/sessionStorage/getItems';
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

  let items, configured;

  try {
    [items, configured] = await Promise.all([
      getItems().catch(() => []),
      getConfiguredBoolean().catch(() => false)
    ]);
  } catch {}

  await initContextMenu(items);
  await updateContextMenu(items);
  await updateBadge(configured, items);
};

export default onStorageVersionChange;
