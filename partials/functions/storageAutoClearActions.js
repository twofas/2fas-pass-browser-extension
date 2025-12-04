// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getItem from '../sessionStorage/getItem';
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

  if (!action || !action.deviceId || !action.vaultId || !action?.itemId || !action?.itemType) {
    await storage.setItem('session:autoClearActions', []);
    return;
  }

  let clipboardValue;

  if (
    action?.deviceId === '00000000-0000-0000-0000-000000000000' ||
    action?.vaultId === '00000000-0000-0000-0000-000000000000' ||
    action?.itemId === '00000000-0000-0000-0000-000000000000'
  ) {
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

  let item;

  try {
    item = await getItem(action.deviceId, action.vaultId, action.itemId);
  } catch {
    return;
  }

  if (!item) {
    await storage.setItem('session:autoClearActions', []);
    return;
  }

  let itemValue;

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
    itemValue = item.content.uris || [];
  } else {
    itemValue = item.content[action.itemType];
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
