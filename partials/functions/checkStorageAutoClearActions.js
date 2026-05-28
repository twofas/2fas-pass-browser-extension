// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getItem from '../sessionStorage/getItem';

/**
* Function to check storage auto clear actions and retrieve the value to be cleared.
* Field-type specific value resolution is delegated to the item model via `getClipboardValue`.
* @async
* @return {Promise<string|boolean>} A promise that resolves to the item value if found, 'addNew' for new items, or false if no action.
*/
const checkStorageAutoClearActions = async () => {
  if (import.meta.env.BROWSER === 'safari') {
    return false;
  }

  const storageClearActions = await storage.getItem('session:autoClearActions');

  if (!storageClearActions || storageClearActions.length === 0) {
    return false;
  }

  // Get item with latest timestamp
  const action = storageClearActions.reduce((latest, action) => {
    return action.timestamp > latest.timestamp ? action : latest;
  }, storageClearActions[0]);

  if (!action || !action.deviceId || !action.vaultId || !action?.itemId || !action?.itemType) {
    await storage.setItem('session:autoClearActions', []);
    logger.debug(LOGGER_CONSTANTS.CATEGORIES.STORAGE, 'Popup - session write - checkStorageAutoClearActions (clearing)');
    return false;
  }

  if (
    action?.deviceId === '00000000-0000-0000-0000-000000000000' ||
    action?.vaultId === '00000000-0000-0000-0000-000000000000' ||
    action?.itemId === '00000000-0000-0000-0000-000000000000'
  ) {
    return 'addNew';
  }

  let item;

  try {
    item = await getItem(action.deviceId, action.vaultId, action.itemId);
  } catch {
    return false;
  }

  if (!item) {
    await storage.setItem('session:autoClearActions', []);
    logger.debug(LOGGER_CONSTANTS.CATEGORIES.STORAGE, 'Popup - session write - checkStorageAutoClearActions (clearing)');
    return false;
  }

  let itemValue;

  try {
    itemValue = await item.getClipboardValue(action.itemType);
  } catch {
    await storage.setItem('session:autoClearActions', []);
    logger.debug(LOGGER_CONSTANTS.CATEGORIES.STORAGE, 'Popup - session write - checkStorageAutoClearActions (clearing)');
    return false;
  }

  if (itemValue === null || itemValue === undefined || itemValue === '') {
    await storage.setItem('session:autoClearActions', []);
    logger.debug(LOGGER_CONSTANTS.CATEGORIES.STORAGE, 'Popup - session write - checkStorageAutoClearActions (clearing)');
    return false;
  }

  return itemValue;
};

export default checkStorageAutoClearActions;
