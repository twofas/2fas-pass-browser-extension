// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendMessageToTab, getPopupWindowData } from '@/partials/functions';
import addAutoClearAction from './addAutoClearAction';

/** 
* Function to automatically clear the clipboard.
* @async
* @param {string} deviceId - The ID of the device.
* @param {string} vaultId - The ID of the vault.
* @param {string} itemId - The ID of the item to clear.
* @param {string} itemType - The type of the item to clear.
* @return {Promise<void>} A promise that resolves when the clipboard is cleared.
*/
const autoClearClipboard = async (deviceId, vaultId, itemId, itemType) => {
  await addAutoClearAction(deviceId, vaultId, itemId, itemType);

  const data = { action: REQUEST_ACTIONS.FOCUS_CHECK };
  const allTabs = await browser.tabs.query({});
  const popupData = await getPopupWindowData();

  try {
    await sendMessageToTab(popupData.id, { ...data, target: REQUEST_TARGETS.POPUP });
  } catch {}

  for (const tab of allTabs) {
    try {
      await sendMessageToTab(tab.id, { ...data, target: REQUEST_TARGETS.FOCUS_CONTENT });
    } catch {}
  }
};

export default autoClearClipboard;
