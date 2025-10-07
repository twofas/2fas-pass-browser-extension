// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getItems from '../sessionStorage/getItems';
import decryptPassword from './decryptPassword';
import URIMatcher from '../URIMatcher';

/** 
* Function to handle automatic clearing of the clipboard.
* @return {Promise<void>} A promise that resolves when the clipboard is cleared.
*/
const storageAutoClearActions = async () => {
  const storageClearActions = await storage.getItem('session:autoClearActions');

  if (!storageClearActions || storageClearActions.length === 0) {
    return;
  }

  // Get action with latest timestamp
  const action = storageClearActions.reduce((latest, action) => {
    return action.timestamp > latest.timestamp ? action : latest;
  }, storageClearActions[0]);

  if (!action || !action?.itemId || !action?.itemType) {
    await storage.setItem('session:autoClearActions', []);
    return;
  }

  let clipboardValue;

  if (action?.itemId === '00000000-0000-0000-0000-000000000000') {
    try {
      clipboardValue = await navigator.clipboard.readText();
    } catch {
      await storage.setItem('session:autoClearActions', []);
      return;
    }

    if (clipboardValue.length >= 6 && clipboardValue.length <= 64) {
      try {
        await navigator.clipboard.writeText('');
      } catch {}
    }
  }

  let items;

  try {
    items = await getItems();
  } catch {
    return;
  }

  if (!items || items.length === 0) {
    await storage.setItem('session:autoClearActions', []);
    return;
  }

  const item = items.find(s => s.id === action.itemId);

  if (!item) {
    await storage.setItem('session:autoClearActions', []);
    return;
  }

  let itemValue;

  if (action.itemType === 'password') {
    try {
      itemValue = await decryptPassword(item);
    } catch {
      await storage.setItem('session:autoClearActions', []);
      return;
    }
  } else if (action.itemType === 'uri') {
    itemValue = item.uris || [];
  } else {
    itemValue = item[action.itemType];
  }

  try {
    clipboardValue = await navigator.clipboard.readText();
  } catch {
    await storage.setItem('session:autoClearActions', []);
    return;
  }

  if (action.itemType === 'uri') {
    const uriFiltered = itemValue.filter(uri => {
      let normalizedUrl;

      try {
        normalizedUrl = URIMatcher.normalizeUrl(uri.text);
      } catch {}

      return normalizedUrl === clipboardValue;
    });

    if (uriFiltered.length > 0) {
      await navigator.clipboard.writeText('');
    } else {
      await storage.setItem('session:autoClearActions', []);
    }
  }

  if (itemValue === clipboardValue) {
    try {
      await navigator.clipboard.writeText('');
    } catch {}
  }

  await storage.setItem('session:autoClearActions', []);
};

export default storageAutoClearActions;
