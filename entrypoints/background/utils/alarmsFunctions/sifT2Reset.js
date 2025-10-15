// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getItems from '@/partials/sessionStorage/getItems';
import getItemsKeys from '@/partials/sessionStorage/getItemsKeys';
import compressObject from '@/partials/gzip/compressObject';
import getKey from '@/partials/sessionStorage/getKey';
import saveItems from '@/partials/WebSocket/utils/saveItems';
import { ENCRYPTION_KEYS } from '@/constants';

/** 
* Function to forget the sif for a specific item ID.
* @async
* @param {string} itemId - The ID of the item for which the sif should be forgotten.
* @return {Promise<void>} A promise that resolves when the sif forget is complete.
*/
const sifT2Reset = async itemId => {
  // @TODO: getItem here?
  // Get items
  const items = await getItems();

  // Update password
  const item = items.find(item => item.id === itemId);
  console.log(item);
  const { vaultId, deviceId } = item;
  item.removeSif();

  // Get itemsKeys
  const itemsKeys = await getItemsKeys(vaultId, deviceId);

  // Remove encryptionItemT2Key in session storage for this itemId & deviceId
  const itemT2Key = await getKey(ENCRYPTION_KEYS.ITEM_T2.sK, { deviceId, itemId });
  await storage.removeItem(`session:${itemT2Key}`);

  // Remove items from session storage (by itemsKeys)
  await storage.removeItems(itemsKeys);

  // saveItems
  await saveItems(items, vaultId, deviceId, true);
};

export default sifT2Reset;
