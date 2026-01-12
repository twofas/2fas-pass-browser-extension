// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import contextMenuNotConfigured from './contextMenuNotConfigured';
import contextMenuConfigured from './contextMenuConfigured';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';

/**
* Function to initialize the context menu.
* @async
* @param {Array|null} items - Optional array of items to use for context menu configuration.
* @return {Promise<void>} A promise that resolves when the context menu is initialized.
*/
const initContextMenu = async (items = null) => {
  try {
    const contextMenuSetting = await storage.getItem('local:contextMenu');

    if (contextMenuSetting === null || contextMenuSetting === true) {
      const configured = await getConfiguredBoolean();

      if (configured) {
        await contextMenuConfigured(items);
      } else {
        await contextMenuNotConfigured();
      }
    }
  } catch (e) {
    await CatchError(e);
  }
};

export default initContextMenu;
