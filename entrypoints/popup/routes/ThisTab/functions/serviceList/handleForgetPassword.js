// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getItems from '@/partials/sessionStorage/getItems';
import getItemsKeys from '@/partials/sessionStorage/getItemsKeys';
import compress from '@/partials/gzip/compress';
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
const handleForgetPassword = async (e, itemId, toggleMenu) => {
  e.preventDefault();
  e.stopPropagation();

  try {
    toggleMenu(false);
  } catch {}

  // Get items
  const items = await getItems();

  // Update password
  const item = items.find(item => item.id === itemId);
  const deviceId = item.deviceId;
  delete item.password;

  // Get itemsKeys
  const itemsKeys = await getItemsKeys(deviceId);

  // Compress items
  const itemsStringify = JSON.stringify(items);
  const itemsGZIP_AB = await compress(itemsStringify);
  const itemsGZIP = ArrayBufferToBase64(itemsGZIP_AB);

  // Remove encryptionItemT2Key in session storage for this itemId & deviceId
  const itemT2Key = await getKey(ENCRYPTION_KEYS.ITEM_T2.sK, { deviceId, itemId });
  await storage.removeItem(`session:${itemT2Key}`);

  // Remove items from session storage (by itemsKeys)
  await storage.removeItems(itemsKeys);

  // saveItems
  await saveItems(itemsGZIP, deviceId);
};

export default handleForgetPassword;
