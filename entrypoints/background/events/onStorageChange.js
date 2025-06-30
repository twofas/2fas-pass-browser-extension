// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import onConfiguredChange from './onConfiguredChange';
import onStorageVersionChange from './onStorageVersionChange';
import getKey from '@/partials/sessionStorage/getKey';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import initContextMenu from '../contextMenu/initContextMenu';

/** 
* Function to handle storage changes.
* @async
* @param {Object} change - The change object containing the new and old values.
* @param {string} areaName - The name of the storage area (e.g., "session" or "local").
* @return {Promise<void>} A promise that resolves when the storage change is handled.
*/
const onStorageChange = async (change, areaName) => {
  switch (areaName) {
    case 'session': {
      if (change?.storageVersion) {
        return onStorageVersionChange(change.storageVersion.newValue);
      }

      try {
        const configuredKey = await getKey('configured');
    
        if (configuredKey && change[configuredKey]) {
          const oldValue = change[configuredKey]?.oldValue;
          const newValueBoolean = await getConfiguredBoolean();
      
          return onConfiguredChange(oldValue, newValueBoolean);
        }
      } catch (e) {
        await CatchError(e);
      }

      break;
    }

    case 'local': {
      try {
        if (change.contextMenu) {
          const contextMenu = change.contextMenu.newValue;
    
          if (contextMenu === false) {
            await browser.contextMenus.removeAll();
          } else {
            await initContextMenu();
          }
        }
      } catch (e) {
        await CatchError(e);
      }

      break;
    }

    default: break;
  }
};

export default onStorageChange;
