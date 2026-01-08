// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getItem from '../sessionStorage/getItem';
import URIMatcher from '../URIMatcher';

/**
* Function to check storage auto clear actions and retrieve the value to be cleared.
* Handles item types: 'password', 'username', 'uri', 'name', 'text', 'cardNumber', 'expirationDate', 'securityCode', 'cardHolder'.
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
    return false;
  }

  let itemValue;

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
    return false;
  }

  if (action.itemType === 'password') {
    try {
      const decryptedSif = await item.decryptSif();
      itemValue = decryptedSif.password;
    } catch {
      await storage.setItem('session:autoClearActions', []);
      return;
    }
  } else if (action.itemType === 'text') {
    try {
      const decryptedSif = await item.decryptSif();
      itemValue = decryptedSif.text;
    } catch {
      await storage.setItem('session:autoClearActions', []);
      return;
    }
  } else if (action.itemType === 'cardNumber') {
    try {
      const decryptedSif = await item.decryptSif();
      itemValue = decryptedSif.cardNumber;
    } catch {
      await storage.setItem('session:autoClearActions', []);
      return;
    }
  } else if (action.itemType === 'expirationDate') {
    try {
      const decryptedSif = await item.decryptSif();
      itemValue = decryptedSif.expirationDate;
    } catch {
      await storage.setItem('session:autoClearActions', []);
      return;
    }
  } else if (action.itemType === 'securityCode') {
    try {
      const decryptedSif = await item.decryptSif();
      itemValue = decryptedSif.securityCode;
    } catch {
      await storage.setItem('session:autoClearActions', []);
      return;
    }
  } else if (action.itemType === 'uri') {
    const uris = item.content.uris || [];

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

    itemValue = [...new Set(itemValue)];
    itemValue = JSON.stringify(itemValue);
  } else {
    itemValue = item.content[action.itemType];
  }

  return itemValue;
};

export default checkStorageAutoClearActions;
