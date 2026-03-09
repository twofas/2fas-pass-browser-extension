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
const sendSavePromptToTab = async (tabID, serviceTypeData, storageKey) => {
  try {
    const theme = await storage.getItem('local:theme');

    await sendMessageToAllFrames(tabID, {
      action: REQUEST_ACTIONS.SAVE_PROMPT,
      theme,
      serviceTypeData,
      storageKey,
      target: REQUEST_TARGETS.CONTENT
    });
  } catch (e) {
    await CatchError(e);
  }
};

export default sendSavePromptToTab;
