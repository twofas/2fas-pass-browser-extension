// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getItems from '@/partials/sessionStorage/getItems';
import getItemsKeys from '@/partials/sessionStorage/getItemsKeys';
import getKey from '@/partials/sessionStorage/getKey';
import saveItems from '@/partials/WebSocket/utils/saveItems';
import { ENCRYPTION_KEYS } from '@/constants';
import getLocalKey from '../getLocalKey';
import decryptPopupState from '@/entrypoints/popup/store/popupState/decryptPopupState';
import encryptPopupState from '@/entrypoints/popup/store/popupState/encryptPopupState';

const isDev = import.meta.env.DEV;

/**
* Function to forget the sif for a specific item ID.
* @async
* @param {string} itemId - The ID of the item for which the sif should be forgotten.
* @param {string} vaultId - The ID of the vault containing the item.
* @return {Promise<void>} A promise that resolves when the sif forget is complete.
*/
const sifT2Reset = async (deviceId, vaultId, itemId) => {
  // Get items
  const items = await getItems();

  // Update password
  const item = items.find(item => item.deviceId === deviceId && item.vaultId === vaultId && item.id === itemId);

  if (!item) {
    return;
  }

  item.removeSif();

  // Get itemsKeys
  const itemsKeys = await getItemsKeys(deviceId, vaultId);

  // Remove encryptionItemT2Key in session storage for this deviceId + itemId
  const itemT2Key = await getKey(ENCRYPTION_KEYS.ITEM_T2.sK, { deviceId, itemId });
  await storage.removeItem(`session:${itemT2Key}`);

  // Remove items from session storage (by itemsKeys)
  await storage.removeItems(itemsKeys);

  // saveItems
  await saveItems(items, deviceId, vaultId);

  // Clear popup state data for this item's details path across all tabs
  await clearPopupStateForItem(deviceId, vaultId, itemId);
};

/**
* Clears popup state data for a specific item's details path across all tabs.
* @async
* @param {string} deviceId - The device ID.
* @param {string} vaultId - The vault ID.
* @param {string} itemId - The item ID.
* @return {Promise<void>}
*/
const clearPopupStateForItem = async (deviceId, vaultId, itemId) => {
  let popupStateKey = null;
  let storageKey = null;
  let allTabsData = null;
  let localKey = null;
  let modified = false;

  try {
    popupStateKey = await getKey('popup_state');
    storageKey = `session:${popupStateKey}`;
    allTabsData = await storage.getItem(storageKey);

    if (!allTabsData) {
      return;
    }

    if (!isDev) {
      localKey = await getLocalKey();

      if (!localKey) {
        return;
      }
    }

    const detailsPathname = `/details/${deviceId}/${vaultId}/${itemId}`;

    for (const tabId of Object.keys(allTabsData)) {
      let tabState = null;

      if (isDev) {
        tabState = allTabsData[tabId];
      } else {
        tabState = await decryptPopupState(allTabsData[tabId], localKey);
      }

      if (!tabState?.popupState?.state?.pathData) {
        continue;
      }

      const pathData = tabState.popupState.state.pathData;

      if (pathData[detailsPathname]) {
        delete pathData[detailsPathname];
        modified = true;

        if (isDev) {
          allTabsData[tabId] = tabState;
        } else {
          const encryptedState = await encryptPopupState(tabState, localKey);

          if (encryptedState) {
            allTabsData[tabId] = encryptedState;
          }
        }
      }
    }

    if (modified) {
      await storage.setItem(storageKey, allTabsData);
    }
  } catch (e) {
    CatchError(e);
  } finally {
    popupStateKey = null;
    storageKey = null;
    allTabsData = null;
    localKey = null;
    modified = false;
  }
};

export default sifT2Reset;
