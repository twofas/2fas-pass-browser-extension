// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to add an auto-clear action to session storage for later use (on browser focus).
* @param {string} itemId - The ID of the item to clear.
* @param {string} itemType - The type of the item to clear.
* @return {Promise<void>} A promise that resolves when the action is added.
*/
const addAutoClearAction = async (itemId, itemType) => {
  const storageClearActions = await storage.getItem('session:autoClearActions') || [];
  storageClearActions.push({ itemId, itemType, timestamp: Date.now() });
  await storage.setItem('session:autoClearActions', storageClearActions);
};

export default addAutoClearAction;
