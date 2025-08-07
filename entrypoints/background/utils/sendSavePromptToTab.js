// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendMessageToAllFrames from '@/partials/functions/sendMessageToAllFrames';
import { SAVE_PROMPT_ACTIONS } from '@/constants/savePromptActions';

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

    res = res.filter(r => r?.status === SAVE_PROMPT_ACTIONS.CANCEL || r?.status === SAVE_PROMPT_ACTIONS.DO_NOT_ASK || r?.status === SAVE_PROMPT_ACTIONS.NEW_LOGIN || r?.status === SAVE_PROMPT_ACTIONS.UPDATE_LOGIN);
    res = res[0];
  } catch (e) {
    await CatchError(e);
  }

  return res;
};

export default sendSavePromptToTab;
