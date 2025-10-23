// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendMessageToAllFrames from '@/partials/functions/sendMessageToAllFrames';

/** 
* Function to send matching logins to a specific tab.
* @async
* @param {number} tabID - The ID of the tab to which the matching logins should be sent.
* @param {Array} data - The array of matching logins to send.
* @return {Promise<void>} A promise that resolves when the logins are sent.
*/
const sendMatchingLoginsToTab = async (tabID, data) => {
  let res = [];

  try {
    const theme = await storage.getItem('local:theme');
    const sendData = data.map(item => ({
      ...item,
      content: {
        ...item.content,
        s_password: undefined
      }}
    ));

    res = await sendMessageToAllFrames(tabID, {
      action: REQUEST_ACTIONS.MATCHING_LOGINS,
      data: sendData,
      theme,
      target: REQUEST_TARGETS.CONTENT
    });

    res = res.filter(r => r?.status && r?.status === 'action' || r?.status === 'cancel');
    res = res[0];
  } catch (e) {
    await CatchError(e);
  }

  return res;
};

export default sendMatchingLoginsToTab;
