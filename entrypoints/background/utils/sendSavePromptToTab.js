// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendMessageToAllFrames from '@/partials/functions/sendMessageToAllFrames';

/** 
* Function to send a save prompt to a specific tab.
* @async
* @param {number} tabID - The ID of the tab to send the prompt to.
* @param {string} serviceTypeData - The type of service to use for the prompt.
* @return {Promise<void>} A promise that resolves when the prompt is sent.
*/
const sendSavePromptToTab = async (tabID, serviceTypeData) => {
  let res = [];

  try {
    const theme = await storage.getItem('local:theme');

    res = await sendMessageToAllFrames(tabID, {
      action: REQUEST_ACTIONS.SAVE_PROMPT,
      theme,
      serviceTypeData,
      target: REQUEST_TARGETS.CONTENT
    });

    res = res.filter(r => r?.status === 'cancel' || r?.status === 'doNotAsk' || r?.status === 'addLogin' || r?.status === 'updateLogin');
    res = res[0];
  } catch (e) {
    await CatchError(e);
  }

  return res;
};

export default sendSavePromptToTab;
