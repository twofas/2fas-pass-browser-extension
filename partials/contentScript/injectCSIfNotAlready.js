// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendMessageToAllFrames from '../functions/sendMessageToAllFrames';

/** 
* Injects the content script and CSS if not already injected.
* @async
* @param {number} tabID - The ID of the tab to inject the content script and CSS into.
* @return {boolean} Indicates whether the content script was successfully injected.
*/
const injectCSIfNotAlready = async (tabID, type = REQUEST_TARGETS.CONTENT) => { // content / prompt
  let res;

  try {
    res = await sendMessageToAllFrames(tabID, { action: REQUEST_ACTIONS.CONTENT_SCRIPT_CHECK, target: type });
  } catch {}

  if (res) {
    const okResponses = res.filter(frameResponse => frameResponse?.status === 'ok');

    if (okResponses && okResponses.length > 0) {
      return true;
    }
  }

  let beforeAttempts = 0;
  let attempts = 0;
  let injected = false;

  while (beforeAttempts < 5) {
    try {
      res = await sendMessageToAllFrames(tabID, { action: REQUEST_ACTIONS.CONTENT_SCRIPT_CHECK, target: type });
    } catch {}

    if (res) {
      const okResponses = res.filter(frameResponse => frameResponse?.status === 'ok');

      if (okResponses && okResponses.length > 0) {
        injected = true;
        break;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 20));

    beforeAttempts++;
  }

  if (injected === true) {
    return true;
  }

  try {
    switch (type) {
      case REQUEST_TARGETS.CONTENT: {
        await browser.scripting.executeScript({
          target: { tabId: tabID, allFrames: true },
          files: ['content-scripts/content.js'],
          injectImmediately: true
        });
      
        await browser.scripting.insertCSS({
          target: { tabId: tabID },
          files: ['styles/content.css']
        });

        break;
      }

      case REQUEST_TARGETS.PROMPT: {
        await browser.scripting.executeScript({
          target: { tabId: tabID, allFrames: false },
          files: ['content-scripts/prompt.js'],
          injectImmediately: true
        });
        break;
      }

      default: {
        throw new TwoFasError(TwoFasError.internalErrors.injectCSIfNotAlreadyUnknownTypeError);
      }
    }
  } catch {
    return injected;
  }
  
  while (attempts < 10) {
    try {
      res = await sendMessageToAllFrames(tabID, { action: REQUEST_ACTIONS.CONTENT_SCRIPT_CHECK, target: type });
    } catch {}

    if (res) {
      const okResponses = res.filter(frameResponse => frameResponse?.status === 'ok');

      if (okResponses && okResponses.length > 0) {
        injected = true;
        break;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 20));

    attempts++;
  }

  return injected;
};

export default injectCSIfNotAlready;
