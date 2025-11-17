// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to add an auto-clear action to session storage for later use (on browser focus).
* @param {string} deviceId - The ID of the device.
* @param {string} vaultId - The ID of the vault.
* @param {string} itemId - The ID of the item to clear.
* @param {string} itemType - The type of the item to clear.
* @return {Promise<void>} A promise that resolves when the action is added.
*/
const addAutoClearAction = async (deviceId, vaultId, itemId, itemType) => {
  if (import.meta.env.BROWSER === 'safari') {
    return;
  }
  
  const storageClearActions = await storage.getItem('session:autoClearActions') || [];
  storageClearActions.push({ deviceId, vaultId, itemId, itemType, timestamp: Date.now() });

  await storage.setItem('session:autoClearActions', storageClearActions);
};

export default addAutoClearAction;
