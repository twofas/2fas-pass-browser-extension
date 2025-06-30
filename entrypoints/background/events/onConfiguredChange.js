// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import contextMenuConfigured from '../contextMenu/contextMenuConfigured';
import contextMenuNotConfigured from '../contextMenu/contextMenuNotConfigured';
import updateBadge from '../utils/updateBadge';
import updateContextMenu from '../utils/updateContextMenu';

/** 
* Function to handle changes in configuration.
* @async
* @param {any} oldValue - The old value of the configuration.
* @param {any} newValue - The new value of the configuration.
* @return {Promise<boolean>} A promise that resolves to true if the configuration change is handled successfully, otherwise false.
*/
const onConfiguredChange = async (oldValue, newValue) => {
  try {
    await updateBadge();
    const contextMenuSetting = await storage.getItem('local:contextMenu');
  
    if (contextMenuSetting === false) {
      await browser.contextMenus.removeAll();
      return false;
    }
  
    if (newValue === true) {
      await contextMenuConfigured();
      await updateContextMenu();
    } else {
      await contextMenuNotConfigured();
    }

    return true;
  } catch (e) {
    await CatchError(e);
    return false;
  }
};

export default onConfiguredChange;
