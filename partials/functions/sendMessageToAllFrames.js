// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import filterInjectableFrames from './filterInjectableFrames';

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

  // Keep frames that can host the content script: http(s) plus about:blank /
  // about:srcdoc frames with an http(s) ancestor (same-origin JS-created iframes,
  // reachable via match_about_blank). FUTURE - ignore recaptcha frames etc.
  frames = filterInjectableFrames(frames);

  if (!frames || frames.length <= 0) {
    return false;
  }

  return Promise.all(
    frames.map(frame => {
      // A rejected sendMessage (no content script in the frame) becomes the false sentinel.
      // A frame that acknowledges the message but never calls sendResponse RESOLVES to
      // undefined (not a rejection) — normalize it to the same false sentinel so callers
      // only ever see a frame response object or false, never a null/undefined that would
      // throw on a `.status` access.
      return browser.tabs.sendMessage(tabId, message, { frameId: frame.frameId })
        .then(frameResponse => frameResponse ?? false)
        .catch(() => false);
    })
  );
};

export default sendMessageToAllFrames;
