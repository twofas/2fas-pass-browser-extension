// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getItems from './getItems';

/**
 * Gets a single item from session storage by ID.
 * @async
 * @param {string} deviceId - The device ID
 * @param {string} vaultId - The ID of the vault
 * @param {string} itemId - The ID of the item to retrieve
 * @return {Object|undefined} The item if found, undefined otherwise
 */
const getItem = async (deviceId, vaultId, itemId) => {
  if (!deviceId || !vaultId || !itemId) {
    return undefined;
  }

  let items = null;

  try {
    items = await getItems();

    if (!Array.isArray(items)) {
      items = null;
      return undefined;
    }

    const foundItem = items.find(item => item?.deviceId === deviceId && item?.vaultId === vaultId && item?.id === itemId) || undefined;

    items = null;

    return foundItem;
  } catch (e) {
    await CatchError(e);
    items = null;
    return undefined;
  }
};

export default getItem;
