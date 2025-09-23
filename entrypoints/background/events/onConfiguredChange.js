// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import contextMenuConfigured from '../contextMenu/contextMenuConfigured';
import contextMenuNotConfigured from '../contextMenu/contextMenuNotConfigured';
import { updateBadge, updateContextMenu, setBadgeLocked } from '../utils';
import getServices from '@/partials/sessionStorage/getServices';

/** 
* Function to handle changes in configuration.
* @async
* @param {any} newValue - The new value of the configuration.
* @return {Promise<boolean>} A promise that resolves to true if the configuration change is handled successfully, otherwise false.
*/
const onConfiguredChange = async newValue => {
  let services;

  try {
    services = await getServices();
  } catch {}

  try {
    const contextMenuSetting = await storage.getItem('local:contextMenu');
  
    if (contextMenuSetting === false) {
      await browser.contextMenus.removeAll();
      return false;
    }
  
    if (newValue === true) {
      await Promise.all([
        updateBadge(true, services).catch(() => {}),
        contextMenuConfigured(services).catch(() => {})
      ]);

      await updateContextMenu(services);
    } else {
      await Promise.all([
        setBadgeLocked().catch(() => {}),
        contextMenuNotConfigured(() => {})
      ]);
    }

    return true;
  } catch (e) {
    await CatchError(e);
    return false;
  }
};

export default onConfiguredChange;
