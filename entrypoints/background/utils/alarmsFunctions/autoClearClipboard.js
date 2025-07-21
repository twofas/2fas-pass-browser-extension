// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendMessageToAllFrames from '@/partials/functions/sendMessageToAllFrames';
import sendMessageToTab from '@/partials/functions/sendMessageToTab';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';
import addAutoClearAction from './addAutoClearAction';

/** 
* Function to automatically clear the clipboard.
* @async
* @return {Promise<void>} A promise that resolves when the clipboard is cleared.
*/
const autoClearClipboard = async (itemId, itemType) => {
  let allTabs;

  try {
    allTabs = await browser.tabs.query({ status: 'complete' });
  } catch {
    await addAutoClearAction(itemId, itemType);
    return;
  }

  if (!allTabs || allTabs.length <= 0) {
    await addAutoClearAction(itemId, itemType);
    return;
  }

  const filteredTabs = allTabs.filter(tab => tab && tab.id);

  const response = [];

  for (const tab of filteredTabs) {
    await injectCSIfNotAlready(tab.id, REQUEST_TARGETS.CONTENT); // FUTURE - separate content script for auto clear clipboard?
    const clearClipboardMessage = { action: REQUEST_ACTIONS.AUTO_CLEAR_CLIPBOARD };
    
    try {
      response.push(await sendMessageToAllFrames(tab.id, { ...clearClipboardMessage, target: REQUEST_TARGETS.CONTENT }));
      response.push(await sendMessageToTab(tab.id, { ...clearClipboardMessage, target: REQUEST_TARGETS.POPUP }));
      response.push(await sendMessageToTab(tab.id, { ...clearClipboardMessage, target: REQUEST_TARGETS.FOCUS_CONTENT }));
      response.push(await sendMessageToAllFrames(tab.id, { ...clearClipboardMessage, target: REQUEST_TARGETS.PROMPT }));
    } catch {}
  }

  if (!response || response.length <= 0 || !Array.isArray(response)) {
    await addAutoClearAction(itemId, itemType);
    return;
  }

  const responseFiltered = response.flat().filter(res => res && res?.status && res?.status === 'ok');

  if (responseFiltered.length <= 0) {
    await addAutoClearAction(itemId, itemType);
    return;
  }
};

export default autoClearClipboard;
