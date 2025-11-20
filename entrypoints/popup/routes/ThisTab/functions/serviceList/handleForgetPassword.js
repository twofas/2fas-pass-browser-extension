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

/** 
* Function to handle the forget password action.
* @async
* @param {Event} e - The click event.
* @param {number} itemId - The ID of the login.
* @return {Promise<void>}
*/
const handleForgetPassword = async (e, itemId, setMore) => {
  e.preventDefault();
  e.stopPropagation();

  try {
    setMore(false);
  } catch {}

  // Get items
  const items = await getItems();

  // Update password
  const item = items.find(item => item.id === itemId);
  const { vaultId, deviceId } = item;
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
};

export default handleForgetPassword;
