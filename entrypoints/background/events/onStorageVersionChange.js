// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import initContextMenu from '../contextMenu/initContextMenu';
import { updateContextMenu, updateBadge, setBadgeLocked } from '../utils';
import getItems from '@/partials/sessionStorage/getItems';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';

/**
* Function to handle changes in storage version.
* @async
* @param {number|undefined} newValue - The new storageVersion value. undefined when session was cleared.
* @return {Promise<void>} A promise that resolves when the storage version change is handled.
*/
const onStorageVersionChange = async newValue => {
  if (typeof newValue !== 'number') {
    await setBadgeLocked().catch(() => {});
    await initContextMenu().catch(() => {});
    return;
  }

  const contextMenuSetting = await storage.getItem('local:contextMenu');

  if (contextMenuSetting === false) {
    await browser.contextMenus.removeAll();
    return;
  }

  const [items, configured] = await Promise.all([
    getItems().catch(() => []),
    getConfiguredBoolean().catch(() => false)
  ]);

  await initContextMenu(items);
  await updateContextMenu(items);
  await updateBadge(configured, items).catch(() => {});
};

export default onStorageVersionChange;
