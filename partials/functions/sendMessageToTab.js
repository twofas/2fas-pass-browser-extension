// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Sends a message to a tab and returns the response.
* @async
* @param {number} tabID - The ID of the tab to send the message to.
* @param {object} message - The message to send.
* @return {Promise<object>} The response from the tab.
* @throws {Error} If the tab does not respond or the response is unknown.
*/
const sendMessageToTab = async (tabID, message) => {
  let res;

  try {
    res = await browser.tabs.sendMessage(tabID, message);
  } catch {
    return undefined;
  }
  
  if (!res) {
    return undefined;
  }

  switch (res?.status) {
    case 'notification': {
      return false;
      // return TwoFasNotification.show({
      //   Title: res.title,
      //   Message: res.message
      // }, tabID);
    }

    default: {
      return res;
    }
  }
};

export default sendMessageToTab;
