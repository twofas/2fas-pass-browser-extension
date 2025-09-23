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
* @return {Promise<void>} A promise that resolves when the clipboard is cleared.
*/
const autoClearClipboard = async (itemId, itemType) => {
  await addAutoClearAction(itemId, itemType);

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
