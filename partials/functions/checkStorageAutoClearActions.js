// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getItems from '../sessionStorage/getItems';
import decryptPassword from './decryptPassword';
import URIMatcher from '../URIMatcher';

/** 
* Function to check storage auto clear actions.
* @async
* @return {Promise<boolean>} A promise that resolves to true if an action is found, otherwise false.
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

  if (!action || !action?.itemId || !action?.itemType) {
    await storage.setItem('session:autoClearActions', []);
    return false;
  }

  let itemValue;

  if (action?.itemId === '00000000-0000-0000-0000-000000000000') {
    return 'addNew';
  }

  let items;

  try {
    items = await getItems();
  } catch {
    return false;
  }

  if (!items || items.length === 0) {
    await storage.setItem('session:autoClearActions', []);
    return false;
  }

  const item = items.find(s => s?.id === action?.itemId);

  if (!item) {
    await storage.setItem('session:autoClearActions', []);
    return false;
  }

  if (action.itemType === 'password') {
    try {
      itemValue = await decryptPassword(item);
    } catch {
      await storage.setItem('session:autoClearActions', []);
      return;
    }
  } else if (action.itemType === 'uri') {
    const uris = item.uris || [];
    
    if (!uris || uris.length === 0) {
      await storage.setItem('session:autoClearActions', []);
      return false;
    }
    
    const uriTexts = uris.map(uri => uri?.text).filter(text => text);
    
    if (!uriTexts || uriTexts.length === 0) {
      await storage.setItem('session:autoClearActions', []);
      return false;
    }
    
    itemValue = [];
    uriTexts.forEach(text => {
      itemValue.push(text);

      try {
        const normalized = URIMatcher.normalizeUrl(text, true);

        if (normalized !== text) {
          itemValue.push(normalized);
        }
      } catch {}
    });

    itemValue = [...new Set(itemValue)]; // unique values
    itemValue = JSON.stringify(itemValue);
  } else {
    itemValue = item[action.itemType];
  }

  await storage.setItem('session:autoClearActions', []);

  return itemValue;
};

export default checkStorageAutoClearActions;
