// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Sends a message to all frames of a tab.
* @async
* @param {Number} tabId The ID of the tab to send the message to.
* @param {Object} message The message to send.
* @return {Promise<boolean>} Resolves to true if messages were sent successfully, false otherwise.
*/
const sendMessageToAllFrames = async (tabId, message) => {
  let frames;

  try {
    frames = await browser.webNavigation.getAllFrames({ tabId });
  } catch {
    return false;
  }

  frames = frames.filter(frame => frame.url && frame.url !== 'about:blank');

  return Promise.all(
    frames.map(frame => browser.tabs.sendMessage(tabId, message, { frameId: frame.frameId }).catch(() => false))
  );
};

export default sendMessageToAllFrames;
