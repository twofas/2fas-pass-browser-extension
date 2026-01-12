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

  if (!frames || frames.length <= 0) {
    return false;
  }

  frames = frames.filter(frame => frame.url && frame.url !== 'about:blank'); // FUTURE - ignore recaptcha frames etc. (list from savePrompt?)

  if (!frames || frames.length <= 0) {
    return false;
  }

  return Promise.all(
    frames.map(frame => {
      return browser.tabs.sendMessage(tabId, message, { frameId: frame.frameId }).catch(() => {
        return false;
      });
    })
  );
};

export default sendMessageToAllFrames;
