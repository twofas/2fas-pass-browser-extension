// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendMessageToAllFrames from '@/partials/functions/sendMessageToAllFrames';
import sendMessageToTab from '@/partials/functions/sendMessageToTab';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';

/** 
* Function to automatically clear the clipboard.
* @async
* @return {Promise<void>} A promise that resolves when the clipboard is cleared.
*/
const autoClearClipboard = async () => {
  let allTabs;

  try {
    allTabs = await browser.tabs.query({ status: 'complete' });
  } catch {}

  allTabs.forEach(async tab => {
    if (tab && tab.id) {
      await injectCSIfNotAlready(tab.id, REQUEST_TARGETS.CONTENT); // FUTURE - separate content script for auto clear clipboard?
      
      try {
        await sendMessageToAllFrames(tab.id, { action: REQUEST_ACTIONS.AUTO_CLEAR_CLIPBOARD, target: REQUEST_TARGETS.CONTENT });
        await sendMessageToTab(tab.id, { action: REQUEST_ACTIONS.AUTO_CLEAR_CLIPBOARD, target: REQUEST_TARGETS.POPUP });
        await sendMessageToAllFrames(tab.id, { action: REQUEST_ACTIONS.AUTO_CLEAR_CLIPBOARD, target: REQUEST_TARGETS.PROMPT });
      } catch {}
    }
  });
};

export default autoClearClipboard;
